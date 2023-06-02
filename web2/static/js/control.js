// tweet array index
const ID = 0                // tweet id
const USER = 1              // user that posted the tweet
const MSG = 2               // tweet content
const TIMESTAMP = 3         // EPOCH
const N_LIKES = 4           // integer counter
const N_RETWEETS = 5        // integer counter
const N_REPLIES = 6         // integer counter
const USER_EMOJI = 7        // profile emoji of user that posted the tweet

let liked_tweets            // id of tweets liked by the user
let replied_tweets          // id of tweets replied by the user
let retweeted_tweets        // id of tweets retweeted by the user

let feed_elem               // feed HTML (ul) elem
let loading_feed_elem = document.getElementById("fetching-tweets")


// feed update on scroll variables
let latest_feed_tweet
let total_tweets            // total tweets in the database (TIMESTAMP < latest_feed_tweet)
let total_feed_tweets = 0   // total tweets currently displayed in the interface feed




// Handles POST requests
function do_json_post(body, url, is_async) {
    if (url == undefined) { return }
    if (is_async == undefined) { is_async = true }

    body = JSON.stringify(body)

    return $.ajax({
        url: url,
        type: "POST",
        async: is_async,
        data: body,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        cache : false
    });
}

// functions = [["db_function0", arg0, arg1], ["db_function1", arg0], ...]
async function query_db(functions, callback, url) {
    if (callback == undefined) { return }
    if (url == undefined) { url = "/" }

    try {
        do_json_post(functions, url).then(callback)
    } catch(err) {
        alert(err)
    }
}


function nav_to_tweet(tweet_id) {
    window.location.href = `/tweet.html?tweet_id=${tweet_id}`
}


function epoch_to_date_str(epoch) {
    epoch = epoch * 1000 // convert to ms
    return new Date(epoch).toLocaleString()
}


function build_tweet_buttons_html(tweet) {
    let reply_btn_class = replied_tweets.includes(tweet[ID])? "btn-primary": "btn-outline-primary"
    let retweet_btn_class = retweeted_tweets.includes(tweet[ID])? "btn-success": "btn-outline-success"
    let like_btn_class = liked_tweets.includes(tweet[ID])? "btn-danger": "btn-outline-danger"

    let reply_btn_onclick = `post_reply_modal('${tweet[USER]}', ${tweet[ID]})`
    let retweet_btn_onclick = `post_retweet_modal('${tweet[USER]}', ${tweet[ID]})`
    let like_btn_onclick = like_btn_class == "btn-outline-danger"? `like(${tweet[ID]})`: `remove_like(${tweet[ID]})`

    // if user is not logged, disable buttons
    let disabled = !user_info.username? "disabled":""

    return `
        <button ID="reply-${tweet[ID]}" type="button" class="btn ${reply_btn_class} ${disabled}"
            onClick="${reply_btn_onclick}">
                <i class="bi bi-chat">${tweet[N_REPLIES]}</i>
        </button>
        <button ID="retweet-${tweet[ID]}" type="button" class="btn ${retweet_btn_class} mx-5 ${disabled}"
            onClick="${retweet_btn_onclick}">
                <i class="bi bi-arrow-repeat">${tweet[N_RETWEETS]}</i>
        </button>
        <button type="button" class="btn ${like_btn_class} ${disabled}"
            onClick="${like_btn_onclick}">
            <i class="bi bi-heart">${tweet[N_LIKES]}</i>
        </button>
    `
}


function build_retweeted_tweet_html(retweet) {
    if (!retweet) return ""
    return `
        <div class="row retweeted">
            <span class="col-2 profile-emoji">${retweet[USER_EMOJI]}</span>
            <div class="col">
                <div>
                    <span>${retweet[USER]}</span>
                    <i class="bi bi-dot m-1"></i>
                    <span>${epoch_to_date_str(retweet[TIMESTAMP])}</span>
                </div>
                <div>
                    <p>${retweet[MSG]}</p>
                </div>
            </div>
        </div>
    `
}


function build_tweet_html(pair_of_tweets) {
    let tweet = pair_of_tweets[0]
    let retweet = pair_of_tweets[1] // retweeted tweet, null if tweet isn't a retweet

    return `
        <div class="row p-1">
            <span class="col-2 profile-emoji">${tweet[USER_EMOJI]}</span>
            <div class="col">
                <div>
                    <span>${tweet[USER]}</span>
                    <i class="bi bi-dot m-1"></i>
                    <span>${epoch_to_date_str(tweet[TIMESTAMP])}</span>
                </div>
                ${build_retweeted_tweet_html(retweet)}
                <div>
                    <p>${tweet[MSG]}</p>
                    ${build_tweet_buttons_html(tweet)}
                </div>
            </div>
        </div>    
    `
}

function build_feed_html(tweets) {
    if (!tweets) return ""

    let feed_html = ""

    for (let i = 0; i < tweets.length; i++) {
        feed_html += `
            <li class="list-group-item clickable-row" onClick="nav_to_tweet(${tweets[i][0][ID]})"> 
            ${build_tweet_html(tweets[i])}
            </li>
        `
    }
    total_feed_tweets += tweets.length
    
    return feed_html
}


function update_feed_append(tweets) {
    if (!feed_elem) {
        console.log("Feed HTML element not found.")
        return
    }
    feed_elem.innerHTML += build_feed_html(tweets)
}


function update_feed_push(tweets) {
    if (!feed_elem) {
        console.log("Feed HTML element not found.")
        return
    }
    feed_elem.innerHTML = build_feed_html(tweets) + feed_elem.innerHTML
}


function fetch_and_update_feed_on_scroll(db_operations) {
    $(window).scroll(function() {
        if (!loading_feed_elem.classList.contains("visually-hidden") ||
            total_feed_tweets >= total_tweets) return
    
        if($(window).scrollTop() + $(window).height() > $(document).height()-10) {
                loading_feed_elem.classList.remove("visually-hidden")

            // update offset
            Object.keys(db_operations.f_calls).forEach((key) => {
                if (db_operations.f_calls[key].hasOwnProperty("offset")) {
                    db_operations.f_calls[key]["offset"] = total_feed_tweets
                }
            }) 

            query_db(db_operations, (res) => {
                if (!res[0].success) {
                    console.log("Failed to get tweets.", res[0].result)
                    return
                }
                
                let tweets = res[0].result
        
                loading_feed_elem.classList.add("visually-hidden")
    
                update_feed_append(tweets)
            })
        }
    })
}


function build_tweet_page_html(res) {
    if (!res[0].success) { 
        console.log("Failed to get tweet.", res[0].result)
        return
    }
    let tweet = res[0].result
    
    let tweet_resplies = res[1].success? res[1].result:[]
    if (tweet_resplies.length > 0) {
        latest_feed_tweet = tweet_resplies[0][0][TIMESTAMP]
    }

    liked_tweets = res[2].success? res[2].result:[]
    retweeted_tweets = res[3].success? res[3].result:[]
    replied_tweets = res[4].success? res[4].result:[]
    total_tweets = res[5].success? res[5].result:0

    let tweet_elem = document.getElementById("tweet")
    tweet_elem.innerHTML = build_tweet_html(tweet)
    
    loading_feed_elem.classList.add("visually-hidden")

    update_feed_append(tweet_resplies)

    db_operations = {
        "f_calls": {
            "get_tweet_replies": {
                "tweet_id": tweet[0][ID],
                "offset": total_feed_tweets,
                "timestamp": latest_feed_tweet
            }
        }
    }
    fetch_and_update_feed_on_scroll(db_operations)
}


function tweet_page(tweet_id) {
    feed_elem = document.getElementById(`feed-tweet-${tweet_id}`)
    loading_feed_elem.classList.remove("visually-hidden")

    let db_operations = {
        "f_calls": {
            "get_tweet": {"tweet_id": tweet_id},
            "get_tweet_replies": {"tweet_id": tweet_id},
            "get_user_likes": {"username": user_info.username},
            "get_user_retweets": {"username": user_info.username},
            "get_user_replies": {"username": user_info.username},
            "count_tweet_replies": {"tweet_id": tweet_id}
        }
    }

    query_db(db_operations, build_tweet_page_html)
}


function build_home_page_html(res) {
    if (!res[0].success) { 
        console.log("Failed to get tweets feed!", res[0])
        return
    }
    
    let tweets = res[0].result
    if (tweets.length > 0) {
        latest_feed_tweet = tweets[0][0][TIMESTAMP]
    }

    liked_tweets = res[1].success? res[1].result:[]
    retweeted_tweets = res[2].success? res[2].result:[]
    replied_tweets = res[3].success? res[3].result:[]
    total_tweets = res[4].success? res[4].result:0

    loading_feed_elem.classList.add("visually-hidden")

    update_feed_append(tweets)

    db_operations = {
        "f_calls": {
            "get_tweets_feed": {
                "timestamp": latest_feed_tweet,
                "offset": total_feed_tweets
            }
        }
    }

    fetch_and_update_feed_on_scroll(db_operations)
}


function home_page() {
    feed_elem = document.getElementById("feed")
    loading_feed_elem.classList.remove("visually-hidden")

    let db_operations = {
        "f_calls": {
            "get_tweets_feed": {},
            "get_user_likes": {"username": user_info.username},
            "get_user_retweets": {"username": user_info.username},
            "get_user_replies": {"username": user_info.username},
            "count_tweets_feed": {}
        }
    }

    query_db(db_operations, build_home_page_html)
}
