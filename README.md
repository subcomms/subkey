Subkey Keyserver
====================

Ever wished you could use your Ethereum or Stacks/BTC crypto keys to sign a GPG public key for secure communication?

Subkey is a simple OpenPGP public key server that serves keys signed by a crypto-wallet for ethereum or stacks.

### Usability

The goal of this key server is to enable a better user experience for OpenPGP user agents by providing a more reliable source of public keys.
Users verify their public key by signing it with their crypto wallet and, similar to messengers like Signal, a user can optionally verify via email address by clicking on a link of a PGP encrypted message. This prevents user A from uploading a public key for user B. With this property in place, automatic key lookup is more reliable than with standard SKS servers.

This ensures that you know exactly who owns a public key because the key itself is cryptographically signed by the very address you wish to send encrypted messages to.


# API

The key server provides a modern RESTful API, but is also backwards compatible to the OpenPGP HTTP Keyserver Protocol (HKP). The following properties are enforced by the key server to enable reliable automatic key look in user agents:

* Only public keys that are signed with a crypto wallet or have been verified with at least one verified email address are served
* There can be only one public key per crypto address, crypto domain name such as BNS, or verified email address at a given time
* A key ID specified in a query must be at least 16 hex characters (64-bit long key ID)
* Key ID collisions are checked upon key upload to prevent collision attacks

## HKP API

The HKP APIs are not documented here. Please refer to the [HKP specification](https://tools.ietf.org/html/draft-shaw-openpgp-hkp-00) to learn more. The server generally implements the full specification, but has some constraints to improve the security for automatic key lookup:

#### Accepted `search` parameters
* BNS domain name such as subkey.btc
* A Stacks BTC address
* Email addresses
* V4 Fingerprints
* Key IDs with 16 digits (64-bit long key ID)


## REST API

### Lookup a key

#### By BNS (Bitcoin Name System) domain name

```
GET /api/v1/key?search=subkey.btc
```

#### By Stacks address

```
GET /api/v1/key?search=ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5
```

#### By key ID

```
GET /api/v1/key?keyId=b8e4105cc9dedc77
```

#### By fingerprint

```
GET /api/v1/key?fingerprint=e3317db04d3958fd5f662c37b8e4105cc9dedc77
```

#### By email address

```
GET /api/v1/key?email=user@example.com
```

#### Payload (JSON):

```json
{
  "keyId": "b8e4105cc9dedc77",
  "fingerprint": "e3317db04d3958fd5f662c37b8e4105cc9dedc77",
  "userIds": [
    {
      "name": "Private User",
      "email": "private-user@fake.email",
	    "cryptoAddress": "SP3STJ1ZEAEQGT0VQZJC966WG7DZWNEZ3F1Z1H8PG",
	    "cryptoDomainName": "example_domain.btc",
	    "cryptoPubKey": "03cfc11a64fb420c53c1c1d24ca467c7543623e3eb32d1a1f3347927b27577ee2e"
	    "cryptoSignature": "c7b0ca8e96e366428213cf521ef9d65e7886b756823c3d460587bcb4b3ba19dc21a822592b4ae7921205767bab358df25fc789d8fcad597ee3587b81347291d200"
      "verified": "true"
    },
  ],
  "created": "Sat Oct 17 2015 12:17:03 GMT+0200 (CEST)",
  "algorithm": "rsaEncryptSign",
  "keySize": "4096",
  "publicKeyArmored": "-----BEGIN PGP PUBLIC KEY BLOCK----- ... -----END PGP PUBLIC KEY BLOCK-----"
}
```

* **keyId**: The 16 char key id in hex
* **fingerprint**: The 40 char key fingerprint in hex
* **userIds.name**: The user ID's name
* **userIds.email**: The user ID's email address
* **userIds.cryptoAddress**: The user crypto wallet address
* **userIds.cryptoDomainName**: The BNS crypto domain name if associated with address
* **userIds.cryptoPubKey**: The ECDSA public key for the crypto address
* **userIds.cryptoSignature**: The signature when signing the PGP Public Key with the users ECDSA private key for the crypto address
* **userIds.verified**: If the user ID's email address has been verified
* **created**: The key creation time as a JavaScript Date
* **algorithm**: The primary key alogrithm
* **keySize**: The key length in bits
* **publicKeyArmored**: The ascii armored public key block

### Upload new key

```
POST /api/v1/key
```

#### Payload (JSON):

```json
{
  "publicKeyArmored": "-----BEGIN PGP PUBLIC KEY BLOCK----- ... -----END PGP PUBLIC KEY BLOCK-----"
}
```

* **publicKeyArmored**: The ascii armored public PGP key to be uploaded

E.g. to upload a key from shell:
```bash
curl https://keys.mailvelope.com/api/v1/key --data "{\"publicKeyArmored\":\"$( \
  gpg --armor --export-options export-minimal --export $GPGKEYID | sed ':a;N;$!ba;s/\n/\\n/g' \
  )\"}" 
```

### Verify uploaded key (via link in email)

```
GET /api/v1/key?op=verify&keyId=b8e4105cc9dedc77&nonce=6a314915c09368224b11df0feedbc53c
```

### Request key removal

```
DELETE /api/v1/key?keyId=b8e4105cc9dedc77 OR ?email=user@example.com
```

### Verify key removal (via link in email)

```
GET /api/v1/key?op=verifyRemove&keyId=b8e4105cc9dedc77&nonce=6a314915c09368224b11df0feedbc53c
```

## Abuse resistant key server

The key server implements mechanisms described in the draft [Abuse-Resistant OpenPGP Keystores](https://datatracker.ietf.org/doc/html/draft-dkg-openpgp-abuse-resistant-keystore-06) to mitigate various attacks related to flooding the key server with bogus keys or certificates. The filtering of keys can be customized with [environment variables](#settings).

In detail the following key components are filtered out:

* user attribute packets
* third-party certificates
* certificates exceeding 8383 bytes
* certificates that cannot be verified with primary key
* unhashed subpackets except: issuer, issuerFingerprint, embeddedSignature
* unhashed subpackets of embedded signatures
* user IDs exceeding 1024 bytes
* user IDs that have no self certificate or revocation signature
* subkeys exceeding 8383 bytes
* above 5 revocation signatures. Hardest, earliest revocations are kept.
* superseded certificates. Newest 5 are kept.

A key is rejected if one of the following is detected:

* primary key packet exceeding 8383 bytes
* primary key packet is not version 4
* key without user ID
* key with more than 20 email addresses
* key with more than 20 subkeys
* key size exceeding 32768 bytes
* new uploaded key is not valid 24h in the future

# Language & DB

The server is written is in JavaScript ES2020 and runs on [Node.js](https://nodejs.org/) v18+.

It uses [MongoDB](https://www.mongodb.com/) v7.0+ as its database.

Note: You may also use [FerretDB](https://ferretdb.com), which aims to provide a Free Software replacement for MongoDB. But you will need to use ferretdb-compat branch since FerretDB is currently missing some features required by Mailvelope Keyserver.

# Getting started
## Installation

### Docker

There are 3 environments available: dev, test, and prod
There are 2 cryptos supported: stacks and ethereum

To build the docker containers, run the build script from the top level directory.
```shell
bash docker/build.sh test stacks
```
or
```shell
bash docker/build.sh dev ethereum
```

Then open a browser and visit: [Subkey](https://localhost:5173/)


#### Recommended indexes

To improve query performance the following indexes are recommended:

```
db.publickey.createIndex({"userIds.cryptoAddress" : 1, "userIds.verified" : 1}) // query by cryptoAddress
db.publickey.createIndex({"userIds.cryptoDomainName" : 1, "userIds.verified" : 1}) // query by cryptoDomainName
db.publickey.createIndex({"userIds.email" : 1, "userIds.verified" : 1}) // query by email
db.publickey.createIndex({"keyId" : 1, "userIds.verified" : 1}) // query by keyID
db.publickey.createIndex({"fingerprint" : 1, "userIds.verified" : 1}) // query by fingerprint
```

## Configuration

Configuration settings may be provided as environment variables. The file config/config.js reads the environment variables and defines configuration values for settings with no corresponding environment variable. Warning: Default settings are only provided for a small minority of settings in these files (as most of them are very individual like host/user/password)!

### Development

You can edit any of the environment config files via:

```shell
$EDITOR docker/env-subkey-server-{dev,test,prod}
```

### Production

For production use, settings configuration with environment variables is recommended as `NODE_ENV=production` is REQUIRED to be set as environment variable to instruct node.js to adapt e.g. logging to production use.

### Settings

Available settings with its environment-variable-names, possible/example values and meaning (if not self-explainable). Defaults **bold**:

* NODE_ENV=development|production (no default, needs to be set as environment variable)
* LOG_LEVEL=debug|**info**|notice|warning|err|crit|alert|emerg
* SERVER_HOST=**localhost**
* PORT=**8888** (application server port)
* CORS_HEADER=true [CORS headers](https://hapi.dev/api#-routeoptionscors)
* HTTP_SECURITY_HEADER=true [security headers](https://hapi.dev/api#-routeoptionssecurity)
* CSP_HEADER=true (add Content-Security-Policy as in src/lib/csp.js)
* MONGO_URI=subkey-db/subkeydb
* MONGO_USER=root
* MONGO_PASS=your_mongo_db_pwd
* SMTP_HOST=smpt.your-email-provider.com
* SMTP_PORT=465
* SMTP_TLS=**true** (if true the connection will use TLS when connecting to server. If false then TLS is used if server supports the STARTTLS extension. In most cases set this value to true if you are connecting to port 465. For port 587 or 25 keep it false.)
* SMTP_STARTTLS=**true** (if this is true and SMTP_TLS is false then Nodemailer tries to use STARTTLS even if the server does not advertise support for it.)
* SMTP_PGP=**true** (encrypt verification message with public key (allows to verify presence + usability of private key at owner of the email address))
* SMTP_USER=smtp_user
* SMTP_PASS=smtp_pass
* SENDER_NAME="Subkey OpenPGP Key Server"
* SENDER_EMAIL=noreply@your-key-server.net
* PUBLIC_KEY_PURGE_TIME=**14** (number of days after which uploaded keys are deleted if they have not been verified)
* UPLOAD_RATE_LIMIT=10 (key upload rate limit per email address in the PUBLIC_KEY_PURGE_TIME period)

The following variables are available to customize the filtering behavior as outlined in [Abuse resistant key server](#abuse-resistant-key-server):

* PURIFY_KEY=**true** (main switch to enable filtering of keys)
* MAX_NUM_USER_EMAIL=**20** (max. number of email addresses per key)
* MAX_NUM_SUBKEY=**20** (max. number of subkeys per key)
* MAX_NUM_CERT=**5** (max. number of superseding certificates)
* MAX_SIZE_USERID=**1024**
* MAX_SIZE_PACKET=**8383**
* MAX_SIZE_KEY=**32768**

### Notes on SMTP

The key server uses [nodemailer](https://nodemailer.com) to send out emails upon public key upload to verify email address ownership. To test this feature locally, configure `SMTP_USER` and `SMTP_PASS` settings to your email test account. Make sure that `SMTP_USER` and `SENDER_EMAIL` match.

For production you should use a service like [Amazon SES](https://aws.amazon.com/ses/), [Mailgun](https://www.mailgun.com/) or [Sendgrid](https://sendgrid.com/use-cases/transactional-email/). Nodemailer supports all of these out of the box.

# License

AGPL v3.0

See the [LICENSE](https://raw.githubusercontent.com/mailvelope/keyserver/master/LICENSE) file for details

## Libraries

Among others, this project relies on the following open source libraries:

* [OpenPGP.js](https://openpgpjs.org/)
* [Nodemailer](https://nodemailer.com/)
* [hapi](https://hapi.dev/)
* [mongodb](https://mongodb.github.io/node-mongodb-native/)
