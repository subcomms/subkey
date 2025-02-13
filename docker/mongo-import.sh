#!/bin/bash

mongoimport --db='subkeydb' --collection='publickey' --file='/tmp/subkeydb.publickey.json' --jsonArray --username='root' --password='root' --authenticationDatabase=admin
