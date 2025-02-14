import { verifyMessageSignatureRsv } from "@stacks/encryption";
import { verifyMessage, verifyTypedData } from "@ethersproject/wallet";
import { recoverPublicKey } from "@ethersproject/signing-key";
import { arrayify } from "@ethersproject/bytes";
import { hashMessage } from "@ethersproject/hash";
const bodyParser = require('body-parser')

import express from 'express';
const app = express();
const port = 3000;

// needed to parse JSON bodies for req.params
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});


function recoverCryptoPubKey(message, signature) {
  const msgHash = hashMessage(message);
  const msgHashBytes = arrayify(msgHash);

  // Now you have the digest,
  const recoveredPubKey = recoverPublicKey(msgHashBytes, signature);
  return recoveredPubKey;
}

function verifyMessageEthereum(message, signature, publicKey) {
  console.debug('verifyMessageEthereum: signature: ' + signature);
  console.debug('verifyMessageEthereum: publicKey: ' + publicKey);
//  const recoveredPubKey = recoverPublicKey(arrayify(hashMessage(message)), signature);
  const recoveredPubKey = recoverCryptoPubKey(message, signature);
  console.debug('verifyMessageEthereum: recoveredPubKey: ' + recoveredPubKey);
  console.debug('verifyMessageEthereum: publicKey: ' + publicKey);

  if (recoveredPubKey === publicKey) {
    return true;
  }
  return false;
}

//app.post('/api/verify-message-signature/:publicKey/:signature/:message', function (req, res) {
app.post('/api/verify-message-signature/', function (req, res) {
  console.debug("verify-message-signature: entering api method");
//  console.debug(req);

  const message = req.body.message;
  const publicKey = req.body.publicKey;
  const signature = req.body.signature;

  console.debug("verify-message-signature: message: " + message);
  console.debug("verify-message-signature: publicKey: " + publicKey);
  console.debug("verify-message-signature: signature: " + signature);
  
  console.debug("verify-message-signature: publicKey.length: " + publicKey.length);

  const verified = (publicKey.length === 132)
    ? verifyMessageEthereum(message, signature, publicKey)
//    ? verifyMessage(message, signature)
    : verifyMessageSignatureRsv({ message, publicKey, signature });

  if (verified) {
    console.debug("verify-message-signature: signature verified: verified=" + verified);
    res.status(200).send("verified")
  } else {
    console.debug("verify-message-signature: signature not verified: verified=" + verified);
    res.status(400).send("unverified")
  }
});

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
