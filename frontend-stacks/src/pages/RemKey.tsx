import React, { useState, useRef } from 'react';
import {
    Container, Row, FormGroup, FormLabel, FormControl, Col, Form, Button,
} from 'react-bootstrap';
import * as openpgp from 'openpgp';
import { StacksNetworks, StacksNetwork } from "@stacks/network";
import { StacksMocknet, StacksDevnet, StacksTestnet, StacksMainnet } from "@stacks/network";
import { stringUtf8CV } from '@stacks/transactions'
import { callContract } from "../stacks/callContract";
import { STACKS_NET } from  "../stacks/env";
import { SUBKEY_API_URL } from  "../lib/env";
import { openSignatureRequestPopup, openStructuredDataSignatureRequestPopup } from "@stacks/connect";

import { UserData } from "@stacks/connect";
import { useLoaderData } from "react-router-dom";

export function RemKey() {
    const [cryptoPubKey, setCryptoPubKey] = useState('');
    const [cryptoSignature, setCryptoSignature] = useState('');
    const [responseText, setResponseText] = useState('');
    const result = useRef(null);

    const network = StacksNetwork.fromName(STACKS_NET);
    const data = useLoaderData() as UserData;
    const address = network.isMainnet() ? data.profile.stxAddress.mainnet : data.profile.stxAddress.testnet;

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
      if (/^0x[a-fA-F0-9]{40}$/.test(data)) {
        return true;
      }
      // stacks address: TODO improve regex
      if (/^S[PT]([0-9A-Z]{38,40})/.test(data)) {
        return true;
      }
      try {
        const stacksAddress = createAddress(searchid);
        return true;
      } catch {
        return false;
      }
      return false;
    };

    const remSignedPublicArmoredKey = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);

            // public key
            const searchid = formData.get('searchid');
            //const text = formData.get('text');

			if (isCryptoAddress(searchid) && (searchid === address)) {
              openSignatureRequestPopup({
                message: "request delete of GPG Public Key",
                network: network,
                appDetails: {
                    name: "Subkey",
                    icon: window.location.origin + "/assets/images/submarine.svg"
                },
                onFinish(data) {
                    setCryptoPubKey(data.publicKey);
                    setCryptoSignature(data.signature);
			        const url = SUBKEY_API_URL;
			        const params = {
				        op: 'delete',
				        search: searchid,
						cryptoAddress: address,
						cryptoPubKey: data.publicKey,
						cryptoSignature: data.signature,
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
							cryptoPubKey: data.publicKey,
							cryptoSignature: data.signature,
				        }),
			        }).then(resp => resp.text()).then(text => {
					console.log(text); // The text from the response
						setResponseText(text);
					}).catch(error => {
					console.error('Error:', error);
						setResponseText('Error deleting key: ' + error);
					});
			    },
              });
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
