from flask import Flask, request, send_from_directory, render_template


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




if __name__ == "__main__":
    context=("certificates/server.crt", "certificates/server.key")
    appFlask.run("0.0.0.0", port=8080, ssl_context=context, debug=True)