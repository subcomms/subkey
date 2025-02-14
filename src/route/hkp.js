/**
 * Copyright (C) 2020 Mailvelope GmbH
 * Licensed under the GNU Affero General Public License version 3
 */

'use strict';

const Boom = require('@hapi/boom');
const util = require('../lib/util');
const openpgp = require('openpgp');

/**
 * An implementation of the OpenPGP HTTP Keyserver Protocol (HKP)
 * See https://tools.ietf.org/html/draft-shaw-openpgp-hkp-00
 */
class HKP {
  /**
   * Create an instance of the HKP server
   * @param  {Object} publicKey - an instance of the public key service
   */
  constructor(publicKey) {
    this._publicKey = publicKey;
  }

  /**
   * Public key upload via http POST
   * @param {Object} request - hapi request object
   * @param {Object} h - hapi response toolkit
   */
  async add(request, h) {
    const {
		keytext: publicKeyArmored,
		cryptoAddress: cryptoAddress,
		cryptoDomainName: cryptoDomainName,
		cryptoPubKey: cryptoPubKey,
		cryptoSignature: cryptoSignature,
	} = request.payload;
    if (!publicKeyArmored) {
      return Boom.badRequest('No key found');
    }
    const origin = util.origin(request);
    await this._publicKey.put({publicKeyArmored, cryptoAddress, cryptoDomainName, cryptoPubKey, cryptoSignature, origin, i18n: request.i18n});
    if (cryptoAddress && cryptoAddress.length > 0) {
	    return h.response('Upload successful.').code(200);
	  }
		return h.response('Upload successful. Check your inbox to verify your email address.').code(200);
  }

  /**
   * Public key lookup via http GET
   * @param {Object} request - hapi request object
   * @param {Object} h - hapi response toolkit
   */
  async lookup(request, h) {
    const params = util.parseQueryString(request);
    const key = await this._publicKey.get({...params, i18n: request.i18n});
    if (params.op === 'get') {
      if (params.mr) {
        return h.response(key.publicKeyArmored)
        .header('Content-Type', 'application/pgp-keys; charset=utf-8')
        .header('Content-Disposition', 'attachment; filename=openpgp-key.asc');
      } else {
        return h.view('key-armored', {query: params, key});
      }
    } else if (['index', 'vindex'].includes(params.op)) {
      const VERSION = 1;
      const COUNT = 1; // number of keys
      const fp = key.fingerprint.toUpperCase();
      let algo;
      try {
        algo = openpgp.enums.write(openpgp.enums.publicKey, key.algorithm);
      } catch (e) {
        algo = key.algorithm.includes('rsa') ? 1 : '';
      }
      const created = key.created ? (key.created.getTime() / 1000) : '';
      const keySize = key.keySize ? key.keySize : '';
      let body = `info:${VERSION}:${COUNT}\npub:${fp}:${algo}:${keySize}:${created}::\n`;
      for (const uid of key.userIds) {
        if (uid.verified) {
          body += `uid:${encodeURIComponent(`${uid.name} <${uid.email}>`)}:::\n`;
        }
      }
      return h.response(body).type('text/plain');
    }
  }



}

exports.plugin = {
  name: 'HKP',
  async register(server, options) {
    const hkp = new HKP(server.app.publicKey);

    const routeOptions = {
      bind: hkp,
      cors: options.server.cors,
      security: options.server.security,
      ext: {
        onPreResponse: {
          method({response}, h) {
            if (!response.isBoom) {
              return h.continue;
            }
            return h.response(response.message).code(response.output.statusCode).type('text/plain');
          }
        }
      }
    };

    server.route({
      method: 'POST',
      path: '/pks/add',
      handler: hkp.add,
      options: routeOptions
    });

    server.route({
      method: 'GET',
      path: '/pks/lookup',
      handler: hkp.lookup,
      options: routeOptions
    });
  }
};
