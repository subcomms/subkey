import React, { useState, useRef } from 'react';
import {
    Container, Row, FormGroup, FormLabel, FormControl, Col, Form, Button,
} from 'react-bootstrap';
import * as openpgp from 'openpgp';
import { SUBKEY_API_URL } from  "../lib/env";

import { useLoaderData } from "react-router-dom";

import { arrayify } from "@ethersproject/bytes";
import { hashMessage } from "@ethersproject/hash";
import { recoverPublicKey } from "@ethersproject/signing-key";
import { getAddress } from '@ethersproject/address';

import { useAccount, useSignMessage, useVerifyMessage, useEnsName } from "wagmi";

export function RemKey() {
    const [cryptoPubKey, setCryptoPubKey] = useState('');
    const [cryptoSignature, setCryptoSignature] = useState('');
    const [responseText, setResponseText] = useState('');
    const result = useRef(null);

    const { address, isConnected, chain } = useAccount();
  	const { signMessageAsync } = useSignMessage();
//		const { verifyMessage } = useVerifyMessage();

    /**
     * Checks for a valid string
     * @param  {} data     The input to be checked
     * @return {boolean}   If data is a string
     */
    function isString(data) {
      return typeof data === 'string' || String.prototype.isPrototypeOf(data); // eslint-disable-line no-prototype-builtins
    };

    /**
     * Checks for a valid crypto address key id
     * @param  {string} data   The crypto address
     * @return {boolean}       If crypto address is valid
     */
    function isCryptoAddress(data) { // TODO: move this into utility library
      //if (!this.isString(data)) {
      //  return false;
      //}
      // ethereum address
      if (/^0x[a-fA-F0-9]{40,43}$/.test(data)) {
        return true;
      }
      try {
        const parsedAddress = getAddress(searchid);
        return true;
      } catch {
        return false;
      }
      return false;
    };

	function recoverCryptoPubKey(message, signature) {
	  const msgHash = hashMessage(message);
    const msgHashBytes = arrayify(msgHash);
    // Now you have the digest,
    const recoveredPubKey = recoverPublicKey(msgHashBytes, signature);
		return recoveredPubKey;
  }

  const remSignedPublicArmoredKey = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);

      // public key
      const searchid = formData.get('searchid');

			if (isCryptoAddress(searchid) && (searchid === address)) {
				const message = "request delete of GPG Public Key";
        const signature = await signMessageAsync({ message: message });
        console.log("Signature of the message: ", signature);
				const cryptoPubKey = recoverCryptoPubKey(message, signature);
				if (signature && signature.length > 0) {
				  setCryptoPubKey(cryptoPubKey);
					setCryptoSignature(signature);
					const url = SUBKEY_API_URL;
					const params = {
						op: 'delete',
						search: searchid,
						cryptoAddress: address,
						cryptoPubKey: cryptoPubKey,
						cryptoSignature: signature,
					};
					const qs = new URLSearchParams(params).toString();
					const fullUrl = `${url}?${qs}`;
					fetch(fullUrl, {
						method: 'DELETE',
						headers: {
							'Accept': 'application/json',
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							search: searchid,
							cryptoAddress: address,
							cryptoPubKey: cryptoPubKey,
							cryptoSignature: signature,
						}),
					}).then(resp => resp.text()).then(text => {
						console.log(text); // The text from the response
						setResponseText(text);
					}).catch(error => {
						console.error('Error:', error);
						setResponseText('Error deleting key: ' + error);
					});
			  }
		  } else if(isCryptoAddress(searchid)) {
			  alert('You must be logged in to your wallet with the same address associated with the key that you would like to remove.');
		  } else {
		    const url = SUBKEY_API_URL;
		    const params = {
			    op: 'delete',
			    search: searchid,
		    };
		    const qs = new URLSearchParams(params).toString();
		    const fullUrl = `${url}?${qs}`;
		    const resp = await fetch(fullUrl, {
			    method: 'DELETE',
			    headers: {
				    'Accept': 'application/json',
				    'Content-Type': 'application/json',
			    },
			    body: JSON.stringify({
				    search: searchid,
			    })
		    });
		    if (resp.ok) {
			    const respText = await resp.text();
			    setResponseText(respText);
		    } else {
			    setResponseText('Error deleting key');
		    }
	    }
    } catch (err) {
      console.log(err);
      alert(err.message);
    }
    result.current.scrollIntoView();
 };

    return (
        <Container className="font-lato text-subcomms-black">
            <Form onSubmit={remSignedPublicArmoredKey}>
                <br />
                <Row>
                    <Col>
						<p>Remove a PGP key that you stored on this keyserver</p>
                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col>
                        <FormGroup>
                            <FormLabel>PGP Key Identifier:</FormLabel>
                            <FormControl as="textarea" name="searchid" placeholder="email, keyid, or crypto-address" rows={1} required />
                        </FormGroup>
                    </Col>
                </Row>
                <br />
                <Row>
					<Container>
						<Button className="btn-block mr-1 mt-1" type="submit">
							Remove Key
						</Button>
					</Container>
                </Row>
                <br />
                <Row hidden={!responseText}>
                    <Col>
                        <FormGroup>
                            <FormLabel>Subkey Response</FormLabel>
                            <FormControl ref={result} as="textarea" name="responseText" spellCheck="false" rows={15} value={responseText} readOnly />
                        </FormGroup>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
}
