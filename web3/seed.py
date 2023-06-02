import twitter_db as db

conn = db.create_connection("twitter.db")

# create users
db.create_user(conn, "User 1", "1234", 1668179401, "\u231a")
db.create_user(conn, "User 2", "1234", 1668179402, "\u231b")
db.create_user(conn, "User 3", "1234", 1668179503, "\u23e9")
db.create_user(conn, "User 4", "1234", 1668179504, "\u23ea")
db.create_user(conn, "User 5", "1234", 1668179605, "\u23eb")

# create tweets
db.create_tweet(conn, "User 1", "Tweet Test 1", 1668179424)
db.create_tweet(conn, "User 1", "Tweet Test 2", 1668179426)
db.create_tweet(conn, "User 2", "Tweet Test 3", 1668179427)
db.create_tweet(conn, "User 3", "Tweet Test 4", 1668179428)
db.create_tweet(conn, "User 4", "Tweet Test 5", 1668179429)
db.create_tweet(conn, "User 4", "Tweet Test 6", 1668179430)
db.create_tweet(conn, "User 5", "Tweet Test 7", 1668179431)
db.create_tweet(conn, "User 1", "Tweet Test 8", 1668179432)
db.create_tweet(conn, "User 1", "Tweet Test 9", 1668179433)
db.create_tweet(conn, "User 2", "Tweet Test 10", 1668179434)
db.create_tweet(conn, "User 3", "Tweet Test 11", 1668179435)
db.create_tweet(conn, "User 4", "Tweet Test 12", 1668179436)
db.create_tweet(conn, "User 4", "Tweet Test 13", 1668179437)
db.create_tweet(conn, "User 5", "Tweet Test 14", 1668179438)
db.create_tweet(conn, "User 1", "Tweet Test 15", 1668179439)
db.create_tweet(conn, "User 1", "Tweet Test 16", 1668179440)
db.create_tweet(conn, "User 2", "Tweet Test 17", 1668179441)
db.create_tweet(conn, "User 3", "Tweet Test 18", 1668179442)
db.create_tweet(conn, "User 4", "Tweet Test 19", 1668179443)
db.create_tweet(conn, "User 4", "Tweet Test 20", 1668179444)
db.create_tweet(conn, "User 5", "Tweet Test 21", 1668179445)
db.create_tweet(conn, "User 1", "Tweet Test 22", 1668179446)
db.create_tweet(conn, "User 1", "Tweet Test 23", 1668179447)
db.create_tweet(conn, "User 2", "Tweet Test 24", 1668179448)
db.create_tweet(conn, "User 3", "Tweet Test 25", 1668179449)
db.create_tweet(conn, "User 4", "Tweet Test 26", 1668179450)
db.create_tweet(conn, "User 4", "Tweet Test 27", 1668179451)
db.create_tweet(conn, "User 5", "Tweet Test 28", 1668179452)



# create likes
db.create_like(conn, 2, "User 1") # User 1 liked tweet 2
db.create_like(conn, 2, "User 3") # User 3 liked tweet 2
db.create_like(conn, 2, "User 5") # User 5 liked tweet 2
db.create_like(conn, 1, "User 2") # User 2 liked tweet 2
db.create_like(conn, 3, "User 4") # User 4 liked tweet 3

# create retweets
db.create_retweet(conn, 3, "User 4", 1668202633, "User 4 quoted tweet 3 in his retweet")
db.create_retweet(conn, 2, "User 1", 1668202693)
db.create_retweet(conn, 4, "User 5", 1668202753, "User 5 quoted tweet 4 in his retweet")

# create replies
db.create_reply(conn, 1, "User 2", 1668179473, "User 2 Replying Tweet 1")
db.create_reply(conn, 4, "User 1", 1668179482, "User 1 Replying Tweet 4")
db.create_reply(conn, 4, "User 3", 1668179542, "User 3 Replying Tweet 4")
db.create_reply(conn, 2, "User 5", 1668179716, "User 5 Replying Tweet 2")
db.create_reply(conn, 6, "User 4", 1668179787, "Reply 1")
db.create_reply(conn, 6, "User 4", 1668179788, "Reply 2")
db.create_reply(conn, 6, "User 4", 1668179789, "Reply 3")
db.create_reply(conn, 6, "User 4", 1668179790, "Reply 4")
db.create_reply(conn, 6, "User 4", 1668179791, "Reply 5")
db.create_reply(conn, 6, "User 4", 1668179792, "Reply 6")
db.create_reply(conn, 6, "User 4", 1668179793, "Reply 7")
db.create_reply(conn, 6, "User 4", 1668179794, "Reply 8")
db.create_reply(conn, 6, "User 4", 1668179795, "Reply 9")
db.create_reply(conn, 6, "User 4", 1668179796, "Reply 10")
db.create_reply(conn, 6, "User 4", 1668179797, "Reply 11")
db.create_reply(conn, 6, "User 4", 1668179798, "Reply 12")
db.create_reply(conn, 6, "User 4", 1668179799, "Reply 13")
db.create_reply(conn, 6, "User 4", 1668179800, "Reply 14")
db.create_reply(conn, 6, "User 4", 1668179801, "Reply 15")
db.create_reply(conn, 6, "User 4", 1668179802, "Reply 16")
db.create_reply(conn, 6, "User 4", 1668179803, "Reply 17")
db.create_reply(conn, 6, "User 4", 1668179804, "Reply 18")
db.create_reply(conn, 6, "User 4", 1668179805, "Reply 19")
db.create_reply(conn, 6, "User 4", 1668179806, "Reply 20")

conn.close()