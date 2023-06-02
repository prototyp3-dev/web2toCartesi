# Web3 Twitter

```
Cartesi Rollups version: 0.8.x
```

The Web 3 implementation of the Twitter-like application utilizes a Python Flask Server, defined in the `front_end/server.py` file, to serve the front-end files (HTML, CSS, JS) through an HTTPS GET route. The `front_end/twitter_db.py` is an auxiliary module that encapsulates the database access exposing only an interface of simple functions to access it. In this version, the purpose of the Flask Server is only to serve the front-end files since now the database and the auxiliary module will be inside Cartesi Machine. The database functions defined in the `front_end/twitter_db.py` are executed through inspectState, for functions that don't alter the machine's state and addInput, for the ones that do. To learn more about inspectState and addInput, check out the documentation of the [Front-end APIs](https://docs.cartesi.io/cartesi-rollups/http-api/#front-end-apis).

This example, contrary to other `rollups-examples`, does not use shared resources from the main directory, and as such, the commands for building, running, and deploying it are slightly different.

The table of contents below shows the sections of this README but also represents a step-by-step to run and interact with the DApp. The sixth step is an optional step that shows how to deploy the DApp to a Testnet. Once deployed, the user can interact with it in the same way as in the fifth step.

## Table of Contents

1. [Requirements](#requirements)
2. [Building](#building)
3. [Running the back end](#running-the-back-end)
4. [Running the front end](#running-the-front-end)
5. [Interacting with the application](#interacting-with-the-application)
6. [Deploying to a testnet](#deploying-to-a-testnet)

## Requirements

Please refer to the [rollups-examples requirements](https://github.com/cartesi/rollups-examples/tree/main/README.md#requirements).

## Building

To build the application, run the following command:

```shell
docker buildx bake -f docker-bake.hcl -f docker-bake.override.hcl --load
```

## Running the back end

The application can be executed in Host and Production modes, as instructed below.

### Host Mode

When developing an application, it is often important to easily test and debug it. For that matter, it is possible to run the Cartesi Rollups environment in [host mode](https://github.com/cartesi/rollups-examples/tree/main/README.md#host-mode), so that the DApp's back-end can be executed directly on the host machine, allowing it to be debugged using regular development tools such as an IDE.

```shell
docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose-host.yml up
```

The application can afterwards be shut down with the following command:
```shell
docker compose -f docker-compose.yml -f docker-compose.override.yml -f docker-compose-host.yml down -v
```

This DApp's back-end is written in Python, so to run it in your machine you need to have `python3` installed.

In order to start the back-end, run the following commands in a dedicated terminal:

```shell
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python3 create_schema.py
ROLLUP_HTTP_SERVER_URL="http://127.0.0.1:5004" python3 twitter.py
```

The final command will effectively run the back-end and send corresponding outputs to port `5004`.
It can optionally be configured in an IDE to allow interactive debugging using features like breakpoints.

You can also use a tool like [entr](https://eradman.com/entrproject/) to restart the back-end automatically when the code changes. For example:

```shell
ls *.py | ROLLUP_HTTP_SERVER_URL="http://127.0.0.1:5004" entr -r python3 twitter.py
```

After the back-end successfully starts, it should print an output like the following:

```log
INFO:__main__:HTTP rollup_server url is http://127.0.0.1:5004
INFO:__main__:Sending finish
```


### Production Mode

To start the application, execute the following command:

```shell
docker compose up
```

The application can afterwards be shut down with the following command:

```shell
docker compose down -v
```



## Running the front end

After setting up the back end (building and running), execute the commands below:

```shell
cd front_end
./run_front_end.sh
```


## Interacting with the application

With both the back and the front ends running, access https://localhost:8080 to interact with the application. Since the server uses a self-signed certificate, the browser warns the user about it. Bypass the warning to reach the application page.

The user doesn't need to log in to explore the app's feed or tweet page (accessed by clicking on a tweet). But he has to log in to post anything or like/un-like tweets. Since inputs that alter the machine's state are at first Layer-1 transactions, you must connect to Metamask to be able to sign those transactions. And finally, sign up to start interacting with the DApp. Note that you have to select the network that the DApp is running. Furthermore, every tweet, retweet, reply, or like, is a transaction and must be signed and paid.

## Deploying to a testnet

Deploying the application to a blockchain requires creating a smart contract on that network, as well as running a validator node for the DApp.

The first step is to build the DApp's back-end machine, which will produce a hash that serves as a unique identifier.

```shell
docker buildx bake -f docker-bake.hcl -f docker-bake.override.hcl machine --load
```

Once the machine docker image is ready, we can use it to deploy a corresponding Rollups smart contract. This requires you to define a few environment variables to specify which network you are deploying to, which account to use, and which RPC gateway to use when submitting the deploy transaction.

```shell
export NETWORK=<network>
export MNEMONIC=<user sequence of twelve words>
export RPC_URL=<https://your.rpc.gateway>
```

For example, to deploy to the Goerli testnet using an Alchemy RPC node, you could execute:

```shell
export NETWORK=goerli
export MNEMONIC=<user sequence of twelve words>
export RPC_URL=https://eth-goerli.alchemyapi.io/v2/<USER_KEY>
```

With that in place, you can submit a deploy transaction to the Cartesi DApp Factory contract on the target network by executing the following command:

```shell
DAPP_NAME=twitter docker compose -f ./deploy-testnet.yml up
```

This will create a file at `./deployments/<network>/twitter.address` with the deployed contract's address.
Once the command finishes, it is advisable to stop the docker compose and remove the volumes created when executing it.

```shell
DAPP_NAME=twitter docker compose -f ./deploy-testnet.yml down -v
```

After that, a corresponding Cartesi Validator Node must also be instantiated in order to interact with the deployed smart contract on the target network and handle the back-end logic of the DApp.
Aside from the environment variables defined above, the node will also need a secure websocket endpoint for the RPC gateway (WSS URL) and the chain ID of the target network.

For example, for Goerli and Alchemy, you would set the following additional variables:

```shell
export WSS_URL=wss://eth-goerli.alchemyapi.io/v2/<USER_KEY>
export CHAIN_ID=5
```

Then, the node itself can be started by running a docker compose as follows:

```shell
DAPP_NAME=mydapp docker compose -f ./docker-compose-testnet.yml -f ./docker-compose.override.yml up
```