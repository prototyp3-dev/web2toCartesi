# Copyright 2022 Cartesi Pte. Ltd.
#
# SPDX-License-Identifier: Apache-2.0
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use
# this file except in compliance with the License. You may obtain a copy of the
# License at http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distributed
# under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
# CONDITIONS OF ANY KIND, either express or implied. See the License for the
# specific language governing permissions and limitations under the License.

from os import environ
import logging
import requests
import json
import twitter_db as db

logging.basicConfig(level="INFO")
logger = logging.getLogger(__name__)

rollup_server = environ["ROLLUP_HTTP_SERVER_URL"]
logger.info(f"HTTP rollup_server url is {rollup_server}")

def hex2str(hex):
    """
    Decodes a hex string into a regular string
    """
    return bytes.fromhex(hex[2:]).decode("utf-8")

def str2hex(str):
    """
    Encodes a string as a hex string
    """
    return "0x" + str.encode("utf-8").hex()

def handle_advance(data):
    logger.info(f"Received advance request data {data}")
    try:
        address = data["metadata"]["msg_sender"]
        payload_utf8 = hex2str(data["payload"])
        payload_json = None
        # PAYLOAD CONTENT
        # {
        #     "auth": [username],
        #     "f_calls": {
        #         "f_name0": {},
        #         "f_name1": {param0: value0},
        #         "f_name2": {param0: value0}
        #     }
        # }
        payload_json = json.loads(payload_utf8)


        db_conn = db.create_connection()
        for f_name, f_args in payload_json["f_calls"].items():
            if not f_args:
                f_args = {}

            try:
                if db.auth_function(f_name):
                    if "auth" not in payload_json:
                        raise Exception("Missing auth.")

                    if type(payload_json["auth"]) != list or len(payload_json["auth"]) != 1:
                        raise Exception(f"Bad formatted auth. Expected: [username], got: {payload_json['auth']}")

                    if not db.check_user(db_conn, payload_json["auth"][0], address):
                        raise Exception(f"Could not authenticate user {payload_json['auth'][0]}.")

                    f_args.update({"username": payload_json["auth"][0]})
                
                if db.user_function(f_name):
                    f_args.update({"address": address})

                f_args.update({"conn": db_conn}) # add db connection to function args

                # this is simplification for the example
                func = getattr(db, f_name) # get function ref
                #func(**f_args)
                result = {"success": True, "result": func(**f_args)}
                response = requests.post(
                    rollup_server + "/report", json={"payload": str2hex(json.dumps(result))}
                )
            except Exception as e:
                error = {"success": False, "result": str(e)}
                error_hex = str2hex(json.dumps(error))

                response = requests.post(
                    rollup_server + "/report", json={"payload": error_hex}
                )

        db_conn.close()
        return "accept"

    except Exception as e:
        error_hex = str2hex(str(e))

        response = requests.post(
            rollup_server + "/report", json={"payload": error_hex}
        )
        print(error)
        return "reject"


def handle_inspect(data):
    logger.info(f"Received inspect request data {data}")
    try:
        payload_utf8 = hex2str(data["payload"])
        payload_json = None
        # PAYLOAD CONTENT
        # {
        #     "auth": [username],
        #     "f_calls": {
        #         "f_name0": {},
        #         "f_name1": {param0: value0},
        #         "f_name2": {param0: value0}
        #     }
        # }
        payload_json = json.loads(payload_utf8)

        db_conn = db.create_connection()
        results = []
        for f_name, f_args in payload_json["f_calls"].items():
            try:
                if not db.read_function(f_name):
                    raise Exception(f"{f_name} is not a read function!")

                if not f_args:
                    f_args = {}

                f_args.update({"conn": db_conn}) # add db connection to function args

                # this is simplification for the example
                func = getattr(db, f_name) # get function ref
                results.append({"success": True, "result": func(**f_args)})
            except Exception as e:
                error = {"success": False, "result": str(e)}
                error_hex = str2hex(json.dumps(error))

                response = requests.post(
                    rollup_server + "/report", json={"payload": error_hex}
                )

        results_hex = str2hex(json.dumps(results))
        response = requests.post(
            rollup_server + "/report", json={"payload": results_hex}
        )
        logger.info(f"Received report status {response.status_code}")

        db_conn.close()
        return "accept"

    except Exception as e:
        print(e)
        error_hex = str2hex(str(e))

        response = requests.post(
            rollup_server + "/report", json={"payload": error_hex}
        )

        return "reject"


handlers = {
    "advance_state": handle_advance,
    "inspect_state": handle_inspect,
}

finish = {"status": "accept"}
rollup_address = None

while True:
    logger.info("Sending finish")
    response = requests.post(rollup_server + "/finish", json=finish)
    logger.info(f"Received finish status {response.status_code}")
    if response.status_code == 202:
        logger.info("No pending rollup request, trying again")
    else:
        rollup_request = response.json()
        data = rollup_request["data"]
        if "metadata" in data:
            metadata = data["metadata"]
            if metadata["epoch_index"] == 0 and metadata["input_index"] == 0:
                rollup_address = metadata["msg_sender"]
                logger.info(f"Captured rollup address: {rollup_address}")
                continue
        handler = handlers[rollup_request["request_type"]]
        finish["status"] = handler(rollup_request["data"])
