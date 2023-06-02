#!/bin/bash


CRT_DIR="certificates"
PYTHON_VENV_DIR=".venv"


if [ ! -f twitter.db ]
then
    python3 create_schema.py
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
