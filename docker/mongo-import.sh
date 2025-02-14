#!/bin/bash

mongoimport --db='subkeydb' --collection='publickey' --file="/tmp/subkeydb.publickey.${CRYPTO_PLATFORM}.json" --jsonArray --username='root' --password='root' --authenticationDatabase=admin
