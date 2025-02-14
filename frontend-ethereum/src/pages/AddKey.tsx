import React, { useState, useRef } from 'react';
import {
    Container, Row, FormGroup, FormLabel, FormControl, Col, Form, Button,
} from 'react-bootstrap';
import { Link } from 'react-router-dom'
import * as openpgp from 'openpgp';
import { SUBKEY_API_URL_ADD } from  "../lib/env";

import { useLoaderData } from "react-router-dom";

import { saveAs } from 'file-saver';

import { arrayify } from "@ethersproject/bytes";
import { hashMessage } from "@ethersproject/hash";
import { recoverPublicKey } from "@ethersproject/signing-key";

import { useAccount, useSignMessage, useVerifyMessage, useEnsName } from "wagmi";
//import { signMessage } from "@wagmi/core";
import { getEnsName } from "@wagmi/core";
import { injected } from 'wagmi/connectors'
import { getConfig } from "../../wagmi.config";

export function AddKey() {
  const [showSigningOptions, setShowSigningOptions] = useState(false);
  const [cryptoPubKey, setCryptoPubKey] = useState('');
  const [cryptoSignature, setCryptoSignature] = useState('');
  const [signedPublicArmoredKeyText, setSignedPublicArmoredKeyText] = useState('');
  const [publicArmoredKeyText, setPublicArmoredKeyText] = useState('');

  const { address, isConnected, chain } = useAccount();
//  const { smData, signMessage } = useSignMessage();
  const { signMessageAsync } = useSignMessage();
//  const { verifyMessage } = useVerifyMessage();

  const resultPAK = useRef(null);
  const result = useRef(null);

  const getDomainName = async(address: string) => {
		const config = getConfig();
		try {
			const ensName = await getEnsName(config, {
				address: address,
				chainId: chain.id
			});
			return ensName?.toString()
		} catch (error) {
		}
		return "";
  }


	function recoverCryptoPubKey(message, signature) {
	  const msgHash = hashMessage(message);
    const msgHashBytes = arrayify(msgHash);
    // Now you have the digest
    const recoveredPubKey = recoverPublicKey(msgHashBytes, signature);
		return recoveredPubKey;
	}

  const signPublicArmoredKey = async (e) => {
        e.preventDefault();
        try {
            const domainName = await getDomainName();
            const formData = new FormData(e.target);


            setSignedPublicArmoredKeyText("");
            const publicArmoredKey = formData.get('publicArmoredKey');

            const signature = await signMessageAsync({ message: publicArmoredKey });
            console.log("Signature of the message: ", signature);
						const cryptoPubKey = recoverCryptoPubKey(publicArmoredKey, signature);

            var comment_1 = "Comment: crypto-domain': ens: " + domainName;
            var comment_2 = "Comment: crypto-address': ethereum: " + address;
            var comment_3 = "Comment: ECDSA-signature: ethereum: " + signature;
            var pak = publicArmoredKey;
            var re = /\-\-\-\-\-BEGIN PGP PUBLIC KEY BLOCK\-\-\-\-\-\n(.*)/;
            var commentedPubKey = pak.replace(re,
              "-----BEGIN PGP PUBLIC KEY BLOCK-----\n" +
              comment_1 + "\n" +
              comment_2 + "\n" +
              comment_3 + "\n" +
              "$1"
            );

            setCryptoPubKey(cryptoPubKey);
            setCryptoSignature(signature);
            setSignedPublicArmoredKeyText(commentedPubKey);

            const resp = await fetch(SUBKEY_API_URL_ADD, {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                keytext: publicArmoredKey,
                cryptoAddress: address,
                cryptoDomainName: domainName,
                cryptoPubKey: cryptoPubKey,
                cryptoSignature: signature,
              })
            });
            if (resp.ok) {
              const respText = await resp.text();
              setSignedPublicArmoredKeyText(respText + "\n\n" + commentedPubKey);
            } else {
              setSignedPublicArmoredKeyText('Error adding key');
            }
            result.current.scrollIntoView();
        } catch (err) {
            console.log(err);
            alert(err.message);
        }
    };

    const handlePublicArmoredKeyTextChange = (e) => {
        setPublicArmoredKeyText(e.target.value);
    };


    const generateKeypair = async(e) => {
        e.preventDefault();
        try {
          const formData = new FormData(e.target);
          const name = formData.get('keypairUserName');
          const email = formData.get('keypairUserEmail');
          const passphrase = formData.get('keypairPassphrase');
          (async () => {
            const { privateKey, publicKey } = await openpgp.generateKey({
              type: 'rsa', // Type of the key
              rsaBits: 4096, // RSA key size (defaults to 4096 bits)
              userIDs: [{ name: name, email: email }], // you can pass multiple user IDs
              passphrase: passphrase // protects the private key
            });
            setCryptoPubKey(publicKey);
            setPublicArmoredKeyText(publicKey);
            var blob = new Blob([privateKey], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "private_key.asc");
          })();
          resultPAK.current.scrollIntoView();
        } catch (err) {
          console.log(err);
          alert(err.message);
        }
    }

    return (
        <Container className="font-lato text-subcomms-black">
            <Form onSubmit={generateKeypair}>
                <br />
                <Row>
                    <Col>
                        <p>Your Public PGP key will be signed with your crypto wallet so others can verify it is yours.</p>
                        <p>To use your existing PGP Public Key, simply paste it into the Public PGP Key text area and click "Sign and Add Key"</p>
                        <p>If you do not have an existing PGP Key, you can <Link to="https://sslinsights.com/how-to-generate-pgp-key-pair/">generate one yourself offline</Link> or use this tool:</p>
                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col>
                        <FormGroup>
                            <FormLabel>Name (can be fake)</FormLabel>
                            <FormControl as="textarea" name="keypairUserName" spellCheck="false" rows={1} required />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>Email (can be fake, use reachable email if you want to verify/revoke keys via email)</FormLabel>
                            <FormControl as="textarea" name="keypairUserEmail" spellCheck="false" rows={1} required />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>Passphrase (obviously back this up or be sure you don't forget it)</FormLabel>
                            <FormControl as="textarea" name="keypairPassphrase" spellCheck="false" rows={1} required />
                        </FormGroup>
                        <Button className="btn-block mr-1 mt-1" type="submit">
                          Generate Keypair
                        </Button>
                    </Col>
                </Row>
                <hr />
            </Form>
            <Form onSubmit={signPublicArmoredKey}>
                <Row>
                    <Col>
                        <FormGroup>
                            <FormLabel>Public PGP Key</FormLabel>
                            <FormControl ref={resultPAK} as="textarea" name="publicArmoredKey" spellCheck="false" rows={15} value={publicArmoredKeyText} onChange={handlePublicArmoredKeyTextChange} required />
                        </FormGroup>
                    </Col>
                </Row>
                <br />
                <Row>
                  <Container>
                    <Button className="btn-block mr-1 mt-1" type="submit">
                      Sign and Add Key
                    </Button>
                  </Container>
                </Row>
                <br />
                <Row hidden={!signedPublicArmoredKeyText}>
                    <Col>
                        <FormGroup>
                            <FormLabel>Signed Public PGP Key</FormLabel>
                            <FormControl ref={result} as="textarea" name="signedPublicArmoredKeyText" spellCheck="false" rows={15} value={signedPublicArmoredKeyText} readOnly />
                        </FormGroup>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
}
