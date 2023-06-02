#!/bin/bash

CRT_DIR="certificates"
PYTHON_VENV_DIR=".venv"
BLOCKCHAIN_FILE="blockchain.json"
LOCAL_BLOCKCHAIN_FILE="localhost.json"
DAPP_FILE="dapp.json"

# check for blockchain.json file
if [[ ! -f static/${BLOCKCHAIN_FILE} ]]
then
	docker cp web3-hardhat-1:/opt/cartesi/share/blockchain/${LOCAL_BLOCKCHAIN_FILE} static/
	if [ $? != 0 ]
	then
		echo "Error: Must run Back-End first"
		exit 1
	fi
	mv ./static/${LOCAL_BLOCKCHAIN_FILE} static/${BLOCKCHAIN_FILE}
fi


# check for dapp.address
if [[ ! -f static/${DAPP_FILE} ]]
then
	if [[ -f "../deployments/localhost/${DAPP_FILE}" ]]
	then
		cp "../deployments/localhost/${DAPP_FILE}" static/
	else
		echo "${DAPP_FILE} not found."
		exit 1
	fi
fi


# generate key and self-signed certificate for Flask server (for HTTPS connection)
if [ ! -d certificates ]
then
    # create CRT_DIR directory
    mkdir ${CRT_DIR}

    # Generate a private key for the server
    openssl genrsa -out ${CRT_DIR}/server.key 2048

    # Generate a CSR (Certificate Signing Request)
    printf "\n\n\n\n\n\n\n\n\n" | openssl req -new -key ${CRT_DIR}/server.key -out ${CRT_DIR}/server.csr

    # Generate self-signed certificate (Signed using server's private key)
    openssl x509 -req -days 365 -in ${CRT_DIR}/server.csr -signkey ${CRT_DIR}/server.key -out ${CRT_DIR}/server.crt

    # remove CSR (Certificate Signing Request)
    rm ${CRT_DIR}/server.csr
fi

# check for python virtual env
if [[ ! -d "$PYTHON_VENV_DIR" ]]
then
	python3 -m venv ${PYTHON_VENV_DIR}
	echo "$PYTHON_VENV_DIR created."
fi

# activate virtual env
. ${PYTHON_VENV_DIR}/bin/activate

# install requirements
pip install -r requirements.txt

# run server
python3 server.py

# if the DApp was being executed in localhost network
# remove the dapp.address and blockchain.json files
if [[ $(head static/${BLOCKCHAIN_FILE} | grep -c '"name":.*"localhost"') != 0 ]]
then
	rm static/${DAPP_FILE}
	rm static/${BLOCKCHAIN_FILE}
fi
