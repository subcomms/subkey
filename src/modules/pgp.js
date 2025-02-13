/**
 * Copyright (C) 2020 Mailvelope GmbH
 * Licensed under the GNU Affero General Public License version 3
 */

'use strict';

const Boom = require('@hapi/boom');
const log = require('../lib/log');
const util = require('../lib/util');
const openpgp = require('openpgp');

const {KEY_STATUS} = util;

/**
 * A simple wrapper around OpenPGP.js
 */
class PGP {
  constructor(purify) {
    this.purify = purify;
    openpgp.config.showVersion = false;
    openpgp.config.showComment = false;
  }

  /**
   * Parse an ascii armored pgp key block and get its parameters.
   * @param  {String} publicKeyArmored  ascii armored pgp key block
   * @param  {String} cryptoAddress crypto address
   * @param  {String} cryptoDomainName crypto domain name bns/ens
   * @param  {String} cryptoPubKey ECDSA public key paired with private key used for signature
   * @param  {String} cryptoSignature ECDSA signature of the public key
   * @return {Promise<Object>}          public key document to persist
   */
  async parseKey(publicKeyArmored, cryptoAddress = null, cryptoDomainName = null, cryptoPubKey = null, cryptoSignature = null) {
    const key = await this.readKey(publicKeyArmored);
    if (key.isPrivate()) {
      log.error('Attempted private key upload');
      throw Boom.badRequest('Error uploading private key. Please keep your private key secret and never upload it to key servers. Only public keys accepted.');
    }
    await this.purify.purifyKey(key);
    // verify key
    const verifyDate = util.getTomorrow();
    const keyStatus = await this.verifyKey(key, verifyDate);
    if (keyStatus === KEY_STATUS.invalid) {
      log.error('Invalid PGP key: primary key verification failed\n%s', key.armor());
      throw Boom.badRequest('Invalid PGP key. Verification of the primary key failed.');
    }
    // check for at least one valid user ID
    const userIds = await this.parseUserIds(key, verifyDate, cryptoAddress, cryptoDomainName, cryptoPubKey, cryptoSignature);
    if (!userIds.length) {
      log.error('Invalid PGP key: no valid user IDs with email address found\n%s', publicKeyArmored);
      throw Boom.badRequest('Invalid PGP key: no valid user ID with email address found');
    }
    // get algorithm details from primary key
    const keyInfo = key.getAlgorithmInfo();
    this.purify.checkMaxKeySize(key);
    console.dir(userIds);
    // public key document that is stored in the database
    return {
      keyId: key.getKeyID().toHex(),
      fingerprint: key.getFingerprint(),
      userIds,
      created: key.getCreationTime(),
      uploaded: new Date(),
      algorithm: keyInfo.algorithm,
      keySize: keyInfo.bits,
      publicKeyArmored: key.armor()
    };
  }

  /**
   * Verify key
   * @param  {PublicKey} key
   * @param  {Date} verifyDate     The verification date
   * @return {Promise<Number>}     The KEY_STATUS
   */
  async verifyKey(key, verifyDate = new Date()) {
    try {
      await key.verifyPrimaryKey(verifyDate);
      return KEY_STATUS.valid;
    } catch (e) {
      switch (e.message) {
        case 'Primary key is revoked':
        case 'Primary user is revoked':
          return KEY_STATUS.revoked;
        case 'Primary key is expired':
          return KEY_STATUS.expired;
        default:
          return KEY_STATUS.invalid;
      }
    }
  }

  /**
   * Parse user IDs and return the ones that are valid or revoked and contain an email address
   * @param  {PublicKey} key
   * @param  {Date} verifyDate  Verify user IDs at this point in time
   * @return {Promise<Array>}   An array of user ID objects
   */
  async parseUserIds(key, verifyDate = new Date(), cryptoAddress = null, cryptoDomainName = null, cryptoPubKey = null, cryptoSignature = null) {
    const result = [];
    for (const user of key.users) {
      const userStatus = await this.verifyUser(user, verifyDate);
      const {email, name} = this.purify.parseUserID(user.userID);
      if (userStatus !== KEY_STATUS.invalid && email) {
        result.push({
          status: userStatus,
          name: name,
          name: email,
          cryptoAddress: cryptoAddress,
          cryptoDomainName: cryptoDomainName,
          cryptoPubKey: cryptoPubKey,
          cryptoSignature: cryptoSignature,
          verified: false
        });
      }
    }
	console.dir(result);
    return result;
  }

  async verifyUser(user, verifyDate = new Date()) {
    try {
      await user.verify(verifyDate);
      return KEY_STATUS.valid;
    } catch (e) {
      switch (e.message) {
        case 'Self-certification is revoked':
          return KEY_STATUS.revoked;
        case 'No self-certifications found':
          return user.revocationSignatures.length ? KEY_STATUS.revoked : KEY_STATUS.no_self_cert;
        case 'Self-certification is invalid: Signature is expired':
          return KEY_STATUS.expired;
        default:
          return KEY_STATUS.invalid;
      }
    }
  }

  /**
   * Remove user IDs from armored key block which are not in array of user IDs
   * @param  {Array} userIds                user IDs to be kept
   * @param  {String} armoredKey            armored key block to be filtered
   * @param  {Boolean} verifyEncryptionKey  verify that key has encryption capabilities
   * @return {Promise<String>}              filtered amored key block
   */
  async filterKeyByUserIds(userIds, armoredKey, verifyEncryptionKey) {
    const emails = userIds.map(({email}) => email);
    const key = await this.readKey(armoredKey);
    try {
      if (verifyEncryptionKey) {
        await key.getEncryptionKey(null, util.getTomorrow());
      }
    } catch (e) {
      log.error('Invalid PGP key: no valid encryption key found\n%s\n%s', e, armoredKey);
      throw Boom.badRequest(`Invalid PGP key. No valid encryption key found: ${e.message}`);
    }
    key.users = key.users.filter(({userID}) => emails.includes(this.purify.parseUserID(userID).email));
    return key.armor();
  }

  /**
   * Merge (update) armored key blocks
   * @param  {String} srcArmored  source amored key block
   * @param  {String} dstArmored  destination armored key block
   * @return {Promise<String>}    merged armored key block
   */
  async updateKey(srcArmored, dstArmored) {
    const srcKey = await this.readKey(srcArmored);
    const dstKey = await this.readKey(dstArmored);
    const updatedKey = await dstKey.update(srcKey);
    this.purify.limitNumOfCertificates(updatedKey);
    this.purify.checkMaxKeySize(updatedKey);
    return updatedKey.armor();
  }


  async readKey(armoredKey) {
    if (!/-----BEGIN\sPGP\sPUBLIC\sKEY\sBLOCK-----/.test(armoredKey)) {
      log.error('No armored PGP key\n%s', armoredKey);
      throw Boom.badRequest('Malformed PGP key. Keys need to start with an armor header line: -----BEGIN PGP PUBLIC KEY BLOCK-----');
    }
    try {
      //return await openpgp.readKey({armoredKey});
      const key = await openpgp.readKey({armoredKey});
	  return key;
    } catch (e) {
      log.error('Failed to parse PGP key\n%s\n%s', e, armoredKey);
      throw Boom.badRequest(`Failed to read PGP key: ${e.message}`);
    }
  }
}

module.exports = PGP;
