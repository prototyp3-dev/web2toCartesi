import twitter_db as db


#######################################################
### :desc: create database and database file if it not
###        exists.
### :param database: file
### :param conn: Connection object
### :return: None
#######################################################
def create_database(database, conn = None):
    # TABLES SQL
    user_table = """ CREATE TABLE IF NOT EXISTS users (
                                username VARCHAR(20),
                                password VARCHAR(64) NOT NULL,
                                join_date INTEGER NOT NULL,
                                emoji VARCHAR(8),

                                CONSTRAINT PK_user PRIMARY KEY (username)
                            ); """


    tweet_table = """ CREATE TABLE IF NOT EXISTS tweets (
                                tweet_id INTEGER,
                                username VARCHAR(20) NOT NULL,
                                msg VARCHAR(280) NOT NULL,
                                timestamp INTEGER NOT NULL,
                                n_likes INTEGER DEFAULT 0,
                                n_retweets INTEGER DEFAULT 0,
                                n_replies INTEGER DEFAULT 0,

                                CONSTRAINT PK_tweet PRIMARY KEY (tweet_id),
                                CONSTRAINT FK_tweet_user FOREIGN KEY (username) REFERENCES users(username)
                            ); """


    like_table = """ CREATE TABLE IF NOT EXISTS tweet_likes (
                                tweet_id INTEGER NOT NULL,
                                username VARCHAR(20) NOT NULL,

                                CONSTRAINT PK_like PRIMARY KEY (tweet_id, username),
                                CONSTRAINT FK0_like_tweet FOREIGN KEY (tweet_id) REFERENCES tweets(tweet_id) ON DELETE CASCADE,
                                CONSTRAINT FK1_like_user FOREIGN KEY (username) REFERENCES users(username)
                            ); """


    # retweets are tweets too
    retweet_table = """ CREATE TABLE IF NOT EXISTS retweets (
                                retweet_id INTEGER NOT NULL,
                                tweet_id INTEGER NOT NULL,

                                CONSTRAINT PK_retweet PRIMARY KEY (retweet_id, tweet_id),
                                CONSTRAINT FK0_retweet_tweet FOREIGN KEY (retweet_id) REFERENCES tweets(tweet_id) ON DELETE CASCADE,
                                CONSTRAINT FK1_retweet_tweet FOREIGN KEY (tweet_id) REFERENCES tweets(tweet_id) ON DELETE CASCADE
                            ); """   


    # replies are "tweets" too
    reply_table = """ CREATE TABLE IF NOT EXISTS replies (
                                reply_id INTEGER NOT NULL,
                                tweet_id INTEGER NOT NULL,

                                CONSTRAINT PK_reply PRIMARY KEY (reply_id, tweet_id),
                                CONSTRAINT FK0_reply_tweet FOREIGN KEY (reply_id) REFERENCES tweets(tweet_id) ON DELETE CASCADE,
                                CONSTRAINT FK1_reply_tweet FOREIGN KEY (tweet_id) REFERENCES tweets(tweet_id) ON DELETE CASCADE
                            ); """


    # TRIGGERS SQL
    like_upd_trigger = ''' CREATE TRIGGER IF NOT EXISTS like_update
        AFTER INSERT ON tweet_likes
        BEGIN
            UPDATE tweets SET n_likes = n_likes + 1 WHERE tweets.tweet_id = NEW.tweet_id;
        END;
    '''

    like_del_trigger = ''' CREATE TRIGGER IF NOT EXISTS like_delete
        AFTER DELETE ON tweet_likes
        BEGIN
            UPDATE tweets SET n_likes = n_likes - 1 WHERE tweets.tweet_id = OLD.tweet_id;
        END;
    '''

    retweet_upd_trigger = ''' CREATE TRIGGER IF NOT EXISTS retweet_update
        AFTER INSERT ON retweets
        BEGIN
            UPDATE tweets SET n_retweets = n_retweets + 1 WHERE tweets.tweet_id = NEW.tweet_id;
        END;
    '''

    retweet_del_trigger = ''' CREATE TRIGGER IF NOT EXISTS retweet_delete
        AFTER DELETE ON retweets
        BEGIN
            DELETE FROM tweets WHERE tweets.tweet_id = OLD.retweet_id;
            UPDATE tweets SET n_retweets = n_retweets - 1 WHERE tweets.tweet_id = OLD.tweet_id;
        END;
    '''

    reply_upd_trigger = ''' CREATE TRIGGER IF NOT EXISTS reply_update
        AFTER INSERT ON replies
        BEGIN
            UPDATE tweets SET n_replies = n_replies + 1 WHERE tweets.tweet_id = NEW.tweet_id;
        END;
    '''

    reply_del_trigger = ''' CREATE TRIGGER IF NOT EXISTS reply_delete
        AFTER DELETE ON replies
        BEGIN
            DELETE FROM tweets WHERE tweets.tweet_id = OLD.reply_id;
            UPDATE tweets SET n_replies = n_replies - 1 WHERE tweets.tweet_id = OLD.tweet_id;
        END;
    '''

    close_at_end = False
    # create a database connection
    if conn is None:
        conn = db.create_connection(database)
        close_at_end = True

    # create tables
    if conn is not None:
        cur = conn.cursor()

        # CREATE TABLES
        cur.execute(user_table)
        cur.execute(tweet_table)
        cur.execute(like_table)
        cur.execute(retweet_table)
        cur.execute(reply_table)

        # CREATE TRIGGERS
        cur.execute(like_upd_trigger)
        cur.execute(like_del_trigger)
        cur.execute(retweet_upd_trigger)
        cur.execute(retweet_del_trigger)
        cur.execute(reply_upd_trigger)
        cur.execute(reply_del_trigger)

        conn.commit()

        if close_at_end: conn.close()
    else:
        print("Error! cannot create the database connection.")


if __name__ == "__main__":
    create_database("twitter.db")