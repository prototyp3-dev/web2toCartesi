import sqlite3
from sqlite3 import Error
from hashlib import sha256

read_functions = set(
    ("get_tweet", "get_tweet_replies", "get_tweets_feed",
    "get_user_likes", "get_user_replies", "get_user_retweets",
    "count_tweet_replies", "count_tweets_feed", "check_user")
)

def auth_function(f_name):
    if f_name == "create_user" or f_name in read_functions :
        return False

    return True


#######################################################
### :desc: create a database connection to the SQLite
###        database specified by db_file.
### :param db_file: database file
### :return: Connection object or None
#######################################################
def create_connection(db_file="twitter.db"):
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        # enable foreing key check
        conn.cursor().execute("PRAGMA foreign_keys = ON")
        return conn
    except Error as e:
        print(e)

    return conn


###################################################################
#                                                                 #
#                            INSERTS                              #
#                                                                 #
###################################################################
def create_user(conn, username, password, join_date, emoji):
    password = sha256(password.encode()).hexdigest()

    sql = ''' INSERT INTO users(username, password, join_date, emoji)
            VALUES(?, ?, ?, ?) '''
    cur = conn.cursor()

    cur.execute(sql, (username, password, join_date, emoji))
    conn.commit()
    
    return True


def create_tweet(conn, username, msg, timestamp):
    sql = ''' INSERT INTO tweets(username, msg, timestamp)
            VALUES(?, ?, ?) '''
    cur = conn.cursor()

    cur.execute(sql, (username, msg, timestamp))
    conn.commit()
    
    # return lastrowid which is the most recent tweet_id
    return cur.lastrowid


def create_like(conn, tweet_id, username):
    sql = ''' INSERT INTO tweet_likes(tweet_id, username)
            VALUES(?, ?) '''
    cur = conn.cursor()

    cur.execute(sql, (tweet_id, username))
    conn.commit()
    
    return True


def create_retweet(conn, tweet_id, username, timestamp, msg=""):
    cur = conn.cursor()
    
    # the retweet is a tweet too
    sql = ''' INSERT INTO tweets(username, msg, timestamp)
        VALUES(?, ?, ?) '''
    cur.execute(sql, (username, msg, timestamp))

    retweet_id = cur.lastrowid

    sql = ''' INSERT INTO retweets(retweet_id, tweet_id)
        VALUES(?, ?) '''
    cur.execute(sql, (retweet_id, tweet_id))

    conn.commit()
    
    return retweet_id


def create_reply(conn, tweet_id, username, timestamp, msg):
    cur = conn.cursor()
    
    # the reply is a tweet too
    sql = ''' INSERT INTO tweets(username, msg, timestamp)
        VALUES(?, ?, ?) '''
    cur.execute(sql, (username, msg, timestamp))

    reply_id = cur.lastrowid

    sql = ''' INSERT INTO replies(reply_id, tweet_id)
        VALUES(?, ?) '''
    cur.execute(sql, (reply_id, tweet_id))

    conn.commit()
    
    return reply_id


###################################################################
#                                                                 #
#                            DELETES                              #
#                                                                 #
###################################################################
def delete_like(conn, tweet_id, username):
    sql = ''' DELETE FROM tweet_likes WHERE tweet_id = ? AND username = ? '''
    cur = conn.cursor()

    cur.execute(sql, (tweet_id, username))
    conn.commit()
    
    return True


###################################################################
#                                                                 #
#                            QUERIES                              #
#                                                                 #
###################################################################
def get_tweet(conn, tweet_id):
    sql = ''' SELECT * FROM 
            (SELECT tweets.*, users.emoji FROM tweets
            JOIN users ON tweets.username = users.username
            WHERE tweets.tweet_id = ?) tweet
            LEFT JOIN 
            (SELECT tweets.*, users.emoji, retweets.retweet_id FROM tweets
            JOIN users ON users.username = tweets.username
            JOIN retweets ON tweets.tweet_id = retweets.tweet_id
            WHERE retweets.retweet_id = ?) retweeted_tweet
            ON tweet.tweet_id = retweeted_tweet.retweet_id
            '''
    cur = conn.cursor()

    cur.execute(sql, (tweet_id, tweet_id))
    
    result = cur.fetchone()
    return [result[:8], None if not result[9] else result[8:]]


def get_user_likes(conn, username):
    sql = ''' SELECT tweet_id FROM tweet_likes WHERE username = ? '''
    cur = conn.cursor()

    cur.execute(sql, (username,))
    
    return list(map(lambda x: x[0], cur.fetchall()))


def get_user_retweets(conn, username):
    sql = ''' SELECT tweet_id FROM retweets WHERE
        retweet_id IN (SELECT tweet_id FROM tweets WHERE username = ?)
        '''
    cur = conn.cursor()

    cur.execute(sql, (username,))
    
    return list(map(lambda x: x[0], cur.fetchall()))


# Get tweets (id) that a given user replied
def get_user_replies(conn, username):
    sql = ''' SELECT tweet_id FROM replies WHERE
        reply_id IN (SELECT tweet_id FROM tweets WHERE username = ?)
        '''
    cur = conn.cursor()

    cur.execute(sql, (username,))
    
    return list(map(lambda x: x[0], cur.fetchall()))


# Get replies of a given tweet
def get_tweet_replies(conn, tweet_id, timestamp = 20000000000, limit = 8, offset = 0):
    sql = ''' SELECT tweets.*, users.emoji FROM tweets
            JOIN users ON tweets.username = users.username
            WHERE tweet_id IN (SELECT reply_id FROM replies WHERE replies.tweet_id = ?)
            AND timestamp < ? ORDER BY timestamp DESC
            LIMIT ? OFFSET ?'''

    cur = conn.cursor()

    cur.execute(sql, (tweet_id, timestamp, limit, offset))
    
    return list(map(lambda x: [x, None], cur.fetchall())) #cur.fetchall()

def count_tweet_replies(conn, tweet_id):
    sql = ''' SELECT COUNT(*) FROM tweets WHERE 
            tweet_id IN (SELECT reply_id FROM replies WHERE replies.tweet_id = ?) '''
    cur = conn.cursor()

    cur.execute(sql, (tweet_id, ))
    
    return cur.fetchone()[0]

# get tweets that aren't a reply
def get_tweets_feed(conn, timestamp = 20000000000, limit = 8, offset = 0):
    sql = ''' SELECT * FROM
            (SELECT tweets.*, users.emoji FROM tweets 
            JOIN users ON users.username = tweets.username
            WHERE tweet_id NOT IN (SELECT reply_id FROM replies)
            AND timestamp < ?) feed_tweets
            LEFT JOIN
            (SELECT tweets.*, users.emoji, retweets.retweet_id FROM tweets
            JOIN users ON users.username = tweets.username
            JOIN retweets ON tweets.tweet_id = retweets.tweet_id
            AND timestamp < ?) retweeted_tweets
            ON feed_tweets.tweet_id = retweeted_tweets.retweet_id
            ORDER BY feed_tweets.timestamp DESC
            LIMIT ? OFFSET ?'''

    cur = conn.cursor()

    cur.execute(sql, (timestamp, timestamp, limit, offset))
    
    return list(map(lambda x: [x[:8], None if not x[9] else x[8:]], cur.fetchall()))


def count_tweets_feed(conn):
    sql = ''' SELECT COUNT(*) FROM tweets WHERE 
            tweet_id NOT IN (SELECT reply_id FROM replies) '''
    cur = conn.cursor()

    cur.execute(sql)
    
    return cur.fetchone()[0]

###################################################################
#                                                                 #
#                              AUX                                #
#                                                                 #
###################################################################
def check_user(conn, username, password):
    sql = ''' SELECT username, join_date, emoji FROM users WHERE username = ? AND password = ? '''
    cur = conn.cursor()

    password = sha256(password.encode()).hexdigest()
    
    cur.execute(sql, (username, password))
    
    return cur.fetchone()
