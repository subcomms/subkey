import React, { useState, useRef, useEffect } from 'react';
import {
    Container, Row, FormGroup, FormLabel, FormControl, Col, Form, Button,
} from 'react-bootstrap';
import {Link} from "react-router-dom";
import Table from 'react-bootstrap/Table';
import * as openpgp from 'openpgp';
import { StacksMocknet, StacksTestnet, StacksMainnet } from "@stacks/network";
import { stringUtf8CV } from '@stacks/transactions'
import { callContract } from "../stacks/callContract";
import { STACKS_NET } from  "../stacks/env";
import { SUBKEY_API_URL } from  "../lib/env";

export function ListKeys() {
  const [signedPublicArmoredKey, setSignedPublicArmoredKey] = useState('');

  const result = useRef(null);

	const [ data, setData] = useState(null);

	const schema = {
	  "id": "",
	  "domain_name": "",
	  "address": "",
	  "email": "",
	};

	useEffect(() => {
		const url = SUBKEY_API_URL;
		const params = {
			op: 'list',
			// search: searchid,
		};
		const qs = new URLSearchParams(params).toString();
		const fullUrl = `${url}?${qs}`;
		fetch(fullUrl, {
		  method: 'GET',
		}).then(response => response.json()
		).then(data => {
		  setData(data);
		})
	}, []);


    const getSignedPublicArmoredKey = async (e) => {
        e.preventDefault();
        try {
			const url = SUBKEY_API_URL;
			const params = {
				op: 'list',
				// search: searchid,
			};
			const qs = new URLSearchParams(params).toString();
			const fullUrl = `${url}?${qs}`;
			const resp = await fetch(fullUrl);
			if (resp.ok) {
			    const respText = await resp.text();
			    setSignedPublicArmoredKey(respText);
			} else {
			    setSignedPublicArmoredKey('Error listing keys');
			}
            result.current.scrollIntoView();
        } catch (err) {
            console.log(err);
            alert(err.message);
        }
    };


//    function onKeyUp(event) {
    const onKeyUp = async(event) => {
	    if (event.key === "Enter") {
			event.preventDefault();
			getSignedPublicArmoredKey();
		}
    };

	const TableHeader = (props) => {
	  const { headers } = props;
	  return(
		<thead className="thead-dark" key="header-1">
			<tr key="header-0">
			  { headers && headers.map((value, index) => {
				  return <th key={index}><div>{value}</div></th>
			  })}
			</tr>
		</thead>
	  );
	}

	const TableBody = (props) => {
	  const { headers, rows } = props;
	  const columns = headers ? headers.length : 0;
	  const showSpinner = rows === null;

	  function buildRow(row, headers) {
		return (
			 <tr key={row.id}>
			 { headers.map((value, index) => {
				 return <td className="font-lato text-subcomms-gray-08" key={index}>{row[value]}</td>
			  })}
			 </tr>
		 )
	  };

	  return(
		<tbody>
			{showSpinner &&
			  <tr key="spinner-0">
				  <td colSpan={columns} className="text-center">
					  <div className="spinner-border" role="status">
						  <span className="sr-only">Loading...</span>
					  </div>
				  </td>
			  </tr>
			  }
			{ !showSpinner && rows && rows.map((value) => {
				  return buildRow(value, headers);
			  })}
		</tbody>
	  );
	}

	const Table = (props) => {
	  const { headers, rows } = props;
	  return (
		<div>
		  <table className="table table-bordered table-hover">
		  <TableHeader headers={headers}></TableHeader>
		  <TableBody headers={headers} rows={rows}></TableBody>
		  </table>
		</div>
	  );
	}

    return (
        <Container>
		  <div className="row">
            <div className="col">
			  <Table headers={Object.keys(schema)} rows={data} />
            </div>
          </div>
        </Container>
    );
}
