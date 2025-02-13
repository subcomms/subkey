import { verifyMessageSignatureRsv } from "@stacks/encryption";
const bodyParser = require('body-parser')

import express from 'express';
const app = express();
const port = 3000;

// needed to parse JSON bodies for req.params
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

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

  const verified = verifyMessageSignatureRsv({ message, publicKey, signature });
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
