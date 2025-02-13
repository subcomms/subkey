import React from 'react';
import { Link } from 'react-router-dom'
import {
    Container, ListGroup,
} from 'react-bootstrap';

import { SUBCHAT_URL } from  "../lib/env";


export function Help() {
  return (
    <Container className="font-lato text-subcomms-black">
      <p>
          This Public Key Server allows you to associate your BNS (Bitcoin Name System) domain with a PGP Public Key by signing your Public Key with the Crypto Wallet holding your BNS name, thus proving that the holder of the PGP Public Key is the same holder of the BNS domain.
      </p>
      <p>
        Users can then utilize applications such as <Link to={SUBCHAT_URL}>Subchat</Link> (and others) to send encrypted messages directly to a BNS domain.
      </p>

      <ListGroup>
        <ListGroup.Item>
          Use <Link to="/add">Add Key</Link> to sign a Public PGP Key using your crypto wallet.
          and store that signed Public Key on this keyserver so that others can send you encrypted messages.
        </ListGroup.Item>
        <ListGroup.Item>
          Use <Link to="/rem">Remove Key</Link> to remove a Public PGP Key that you had added to this keyserver.
        </ListGroup.Item>
        <ListGroup.Item>
          Use <Link to="/lookup">Lookup Key</Link> to search for a Public PGP Key stored on this keyserver.
        </ListGroup.Item>
        <ListGroup.Item>
          Use <Link to="/list">List Keys</Link> to list and search for available PGP Public Keys stored on this keyserver.
        </ListGroup.Item>
      </ListGroup>
    </Container>
  );
}
