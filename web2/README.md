# Web2 Twitter
The Web 2 implementation of the Twitter-like application utilizes a Python Flask Server, defined in the `server.py` file, to serve the front-end files (HTML, CSS, JS) through an HTTPS GET route. The `twitter_db.py` is an auxiliary module that encapsulates the database access exposing only an interface of simple functions to access it. A client can execute these database functions through an HTTPS POST route. However, some database functions need authentication to prevent one user from impersonating another.

## Running
To run the application, execute the `run_app.sh` script. This script creates the database, generates a self-signed certificate for the Flask Server, and runs the application in a Python Virtual Environment (venv).

```shell
./run_app.sh
```

## Interacting with the application

After the application starts, it can be accessed at https://localhost:8080. Since the server uses a self-signed certificate, the browser warns the user about it. Bypass the warning to reach the application page. The user doesn't need to log in to explore the app's feed or tweet page (accessed by clicking on a tweet). But he has to log in to post anything or like/un-like tweets.

## Test Set
To populate the application database with a test set containing: users, tweets, retweets, replies, and likes. Execute the `seed.py` file.

```shell
python3 seed.py
```

