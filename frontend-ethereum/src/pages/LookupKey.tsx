import React, { useState, useRef } from 'react';
import {
    Container, Row, FormGroup, FormLabel, FormControl, Col, Form, Button,
} from 'react-bootstrap';
import * as openpgp from 'openpgp';
import { SUBKEY_API_URL } from  "../lib/env";

import { getAddress } from '@ethersproject/address';
import { getEnsName } from "@wagmi/core";
import { getConfig } from "../../wagmi.config";
import { normalize } from 'viem/ens'

export function LookupKey() {
    const [showSigningOptions, setShowSigningOptions] = useState(false);
    const [signedPublicArmoredKey, setSignedPublicArmoredKey] = useState('');

    const result = useRef(null);

  const getEnsAddressForName = async(ensName: string) => {
		const config = getConfig();
		const address = await getEnsName(config, {
		  name: normalize(ensName),
			chainId: chain.id
		});
    return address?.toString()
  }

    const getSignedPublicArmoredKey = async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(e.target);

        // email, keyid, crypt-address, or crypto-domainname
        var searchid = formData.get('searchid');
        try {
          const parsedAddress = getAddress(searchid);
        } catch {
          try {
            // not a ethereum address, maybe an ENS domain name
						const ownerAddress = getEnsAddressForName(searchid)
            searchid = ownerAddress;
          } catch (err) {
          }
        }

        const url = SUBKEY_API_URL;
        const params = {
          op: 'get',
          search: searchid,
        };
        const qs = new URLSearchParams(params).toString();
        const fullUrl = `${url}?${qs}`;
        const resp = await fetch(fullUrl);
        if (resp.ok) {
          const respText = await resp.text();
          setSignedPublicArmoredKey(respText);
        } else {
          setSignedPublicArmoredKey('Error fetching key');
        }
        result.current.scrollIntoView();
      } catch (err) {
        console.log(err);
        alert(err.message);
      }
    };


    const onKeyUp = async(event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        getSignedPublicArmoredKey();
      }
    };


    return (
        <Container className="font-lato text-subcomms-black">
            <Form onSubmit={getSignedPublicArmoredKey}>
                <br />
                <Row>
                    <Col>
                        <p>Lookup a Public PGP key stored on this keyserver</p>
                    </Col>
                </Row>
                <hr />
                <Row>
                    <Col>
                        <FormGroup>
                            <FormLabel>PGP Key Identifier:</FormLabel>
                            <FormControl as="textarea" name="searchid" placeholder="email, keyid, or crypto-address" rows={1} onKeyPress={onKeyUp} required />
                        </FormGroup>
                    </Col>
                </Row>
                <br />
                <Row>
            <Container>
            <Button className="btn-block mr-1 mt-1" type="submit">
              Lookup Key
            </Button>
          </Container>
                </Row>
                <br />
                <Row hidden={!signedPublicArmoredKey}>
                    <Col>
                        <FormGroup className="font-lato">
                            <FormLabel>Signed Public PGP Key</FormLabel>
                            <FormControl ref={result} as="textarea" name="signedPublicArmoredKey" rows={15} value={signedPublicArmoredKey} readOnly />
                        </FormGroup>
                    </Col>
                </Row>
            </Form>
        </Container>
    );
}
