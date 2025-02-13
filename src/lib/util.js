/**
 * Copyright (C) 2020 Mailvelope GmbH
 * Licensed under the GNU Affero General Public License version 3
 */

'use strict';

const crypto = require('crypto');

/**
 * Checks for a valid string
 * @param  {} data     The input to be checked
 * @return {boolean}   If data is a string
 */
exports.isString = function(data) {
  return typeof data === 'string' || String.prototype.isPrototypeOf(data); // eslint-disable-line no-prototype-builtins
};

/**
 * Parse string into number
 * @param  {String} number
 * @return {Number|undefined}
 */
exports.parseNumber = function(number) {
  const integer = parseInt(number);
  return isNaN(integer) ? undefined : integer;
};

/**
 * Cast string to a boolean value
 * @param  {}  data    The input to be checked
 * @return {boolean}   If data is true
 */
exports.isTrue = function(data) {
  if (this.isString(data)) {
    return data === 'true';
  } else {
    return Boolean(data);
  }
};

/**
 * Checks for a valid key id in the query string. A key must be prepended
 * with '0x' and can be between 16 and 40 hex characters long.
 * @param {String} id - key id
 * @return {Boolean} - if the key id is valid
 */
exports.checkId = function(id) {
  if (this.isCryptoAddress(id)) {
	return true;
  }
  return /^(?:0x)?[a-fA-F0-9]{16,40}$/.test(id);
}

/**
 * Parse the search parameter
 * @param  {String} search Query parameter search
 * @param  {Object} params Map with results
 */
exports.parseSearch = function(search, qs_params) {
  const ret_params = Object.assign({}, qs_params);
  if (!search || !this.isString(search)) {
    return;
  }
  search = search.replaceAll(/\s/g, '');
  if (this.checkId(search)) {
    ret_params.cryptoAddress = this.isCryptoAddress(search) ? search : undefined;
    const id = search.replace(/^0x/, '');
    ret_params.keyId = this.isKeyId(id) ? id : undefined;
    ret_params.fingerprint = this.isFingerPrint(id) ? id : undefined;
    return ret_params;
  }
  if (search.startsWith('<') && search.endsWith('>')) {
    search = search.slice(1, -1);
  }
  if (this.isEmail(search)) {
    ret_params.email = search;
  }
  return ret_params;
}

/**
 * Parse the query string for a lookup request and set a corresponding
 * error code if the requests is not supported or invalid.
 * @param {Object} query - hapi request query object
 * @return {Object} - query parameters or undefined for an invalid request
 */
exports.parseQueryString = function({query}) {
  const qs_params = {
    op: query.op, // operation ... only 'get', 'list', 'delete', 'index', 'vindex' are supported
    mr: query.options === 'mr' // machine readable
  };
  if (!['get', 'list', 'delete', 'index', 'vindex'].includes(qs_params.op)) {
    throw Boom.notImplemented('Method not implemented');
  }
  if (qs_params.op === 'list') {
    const ret_params = Object.assign({}, qs_params);
    return ret_params;
  }
  const params = this.parseSearch(query.search, qs_params);
  if (!params.keyId && !params.fingerprint && !params.email && !params.cryptoAddress) {
    throw Boom.badRequest('Invalid search parameter');
  }
  return params;
}



/**
 * Checks for a valid crypto address key id
 * @param  {string} data   The crypto address
 * @return {boolean}       If crypto address is valid
 */
exports.isCryptoAddress = function(data) {
  if (!this.isString(data)) {
    return false;
  }
  // ethereum address
  if (/^0x[a-fA-F0-9]{40}$/.test(data)) {
    return true;
  }
  // stacks address: TODO improve regex
  if (/^S[PT]([0-9A-Z]{38,40})/.test(data)) {
    return true;
  }
  return false;
};

/**
 * Checks for a valid long key id which is 16 hex chars long.
 * @param  {string} data   The key id
 * @return {boolean}       If the key id is valid
 */
exports.isKeyId = function(data) {
  if (!this.isString(data)) {
    return false;
  }
  return /^[a-fA-F0-9]{16}$/.test(data);
};

/**
 * Checks for a valid version 4 fingerprint which is 40 hex chars long.
 * @param  {string} data   The key id
 * @return {boolean}       If the fingerprint is valid
 */
exports.isFingerPrint = function(data) {
  if (!this.isString(data)) {
    return false;
  }
  return /^[a-fA-F0-9]{40}$/.test(data);
};

/**
 * Checks for a valid email address.
 * @param  {string} data   The email address
 * @return {boolean}       If the email address if valid
 */
exports.isEmail = function(data) {
  if (!this.isString(data)) {
    return false;
  }
  const re = /^[+a-zA-Z0-9_.!#$%&'*\/=?^`{|}~-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z0-9]{2,63}$/;
  return re.test(data);
};

/**
 * Checks for a valid nonce.
 * @param  {string} data   The nonce
 * @return {boolean}       If the nonce is valid
 */
exports.isNonce = function(data) {
  return this.isString(data) && data.length === 32;
};

/**
 * Normalize email address to lowercase.
 * @param  {string} email   The email address
 * @return {string}       lowercase email address
 */
exports.normalizeEmail = function(email) {
  if (email) {
    email = email.toLowerCase();
  }
  return email;
};

/**
 * Generate a cryptographically secure random hex string. If no length is
 * provided a 32 char hex string will be generated by default.
 * @param  {number} bytes   (optional) The number of random bytes
 * @return {string}         The random bytes in hex (twice as long as bytes)
 */
exports.random = function(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
};

/**
 * Check if the user is connecting over a plaintext http connection.
 * This can be used as an indicator to upgrade their connection to https.
 * @param  {Object} request - hapi request object
 * @return {boolean}      If http is used
 */
exports.checkHTTP = function(request) {
  return request.server.info.protocol === 'http' && request.headers['x-forwarded-proto'] === 'http';
};

/**
 * Check if the user is connecting over a https connection.
 * @param  {Object} request - hapi request object
 * @return {boolean}      If https is used
 */
exports.checkHTTPS = function(request) {
  return request.server.info.protocol === 'https' || request.headers['x-forwarded-proto'] === 'https';
};

/**
 * Get the server's own origin host and protocol. Required for sending
 * verification links via email. If the PORT environmane variable
 * is set, we assume the protocol to be 'https', since the AWS loadbalancer
 * speaks 'https' externally but 'http' between the LB and the server.
 * @param  {Object} request - hapi request object
 * @return {Object}       The server origin
 */
exports.origin = function(request) {
  return {
    protocol: this.checkHTTPS(request) ? 'https' : request.server.info.protocol,
    host: request.info.host
  };
};

/**
 * Helper to create urls pointing to this server
 * @param  {Object} origin     The server's origin
 * @param  {string} resource   (optional) The resource to point to
 * @return {string}            The complete url
 */
exports.url = function(origin, resource) {
  return `${origin.protocol}://${origin.host}${resource || ''}`;
};

/**
 * Validity status of a key
 * @type {Object}
 */
exports.KEY_STATUS = {
  invalid: 0,
  expired: 1,
  revoked: 2,
  valid: 3,
  no_self_cert: 4
};

/**
 * Asynchronous wrapper for Array.prototype.filter()
 * @param  {Array} array
 * @param  {Function} asyncFilterFn
 * @return {Promise<Array>}
 */
exports.filterAsync = async function(array, asyncFilterFn) {
  const promises = array.map(async item => await asyncFilterFn(item) && item);
  const result = await Promise.all(promises);
  return result.filter(item => item);
};

/**
 * Return Date one day in the future
 * @return {Date}
 */
exports.getTomorrow = function() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  return now;
};
