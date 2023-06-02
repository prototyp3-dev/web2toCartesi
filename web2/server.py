from flask import Flask, request, send_from_directory, render_template
import twitter_db as db


appFlask = Flask(__name__, template_folder="./")




@appFlask.route('/', methods=['GET'])
def index():
    return send_from_directory("./", "index.html")


@appFlask.route('/tweet.html', methods=['GET'])
def tweet_page():
    tweet_id = request.args.get('tweet_id')
    
    if not tweet_id:
        return "Missing \"tweet_id\" parameter.", 400
    
    return render_template("tweet.html", tweet_id=tweet_id)


@appFlask.route('/', methods=['POST'])
def process_request():
    body = request.json
    # BODY CONTENT
    # {
    #     "auth": [username, password],
    #     "f_calls": {
    #         "f_name0": {},
    #         "f_name1": {param0: value0},
    #         "f_name2": {param0: value0}
    #     }
    # }

    db_conn = db.create_connection()
    results = []
    for f_name, f_args in body["f_calls"].items():
        if not f_args:
            f_args = {}

        try:
            if db.auth_function(f_name):
                if "auth" not in body:
                    raise Exception("Missing auth.")

                if type(body["auth"]) != list or len(body["auth"]) != 2:
                    raise Exception(f"Bad formatted auth. Expected: [username, password], got: {body['auth']}")

                if not db.check_user(db_conn, body["auth"][0], body["auth"][1]):
                    raise Exception(f"Could not authenticate user {body['username']}.")
                
                f_args.update({"username": body["auth"][0]})

            f_args.update({"conn": db_conn}) # add db connection to function args

            # this is simplification for the example
            func = getattr(db, f_name) # get function ref
            results.append({"success": True, "result": func(**f_args)})
        except Exception as e:
            results.append({"success": False, "result": str(e)})

    db_conn.close()
    return results




if __name__ == "__main__":
    context=("certificates/server.crt", "certificates/server.key")
    appFlask.run("0.0.0.0", port=8080, ssl_context=context, debug=True)