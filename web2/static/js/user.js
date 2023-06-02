let user_info = {   // logged user info
    "username": null,
    "join_date": null,
    "profile_emoji": null,
    "password": null
}

const USERNAME_MAX_SZ = 20
const TWEET_MAX_SZ = 280

let user_action_form_loading = {} // {"btn-id-that-trigged-the-event": event_result}

function get_curr_epoch() {
    let epoch = new Date().getTime()
    return parseInt(epoch / 1000) // convert from ms to seconds
}

/////////////////////////////////////////////////
//////       User control functions        //////
/////////////////////////////////////////////////
function get_user_from_cookie() {
    user_info.username = null
    user_info.join_date = null

    // get cookies
    let cookie_arr = document.cookie.split("; ")

    // search for "user" cookie
    for (let i = 0; i < cookie_arr.length; i++) {
        if (cookie_arr[i].substring(0,4) == "user") {
            let info = cookie_arr[i].substring(5, cookie_arr[i].length).split(",")

            user_info.username = info[0]
            user_info.join_date = info[1]
            user_info.profile_emoji = info[2]
            user_info.password = info[3]

            break
        }
    }
}


function sign_up(username, password, user_emoji) {
    let btn_id = event.currentTarget.id
    let join_date = get_curr_epoch()
    let db_operation = {
        "f_calls": {
            "create_user": {
                "username": username,
                "password": password,
                "join_date": join_date,
                "emoji": user_emoji
            }
        }
    }
    query_db(db_operation, (res) => {
        if (res[0].success) {
            // create "user" cookie
            document.cookie = `user=${username},${join_date},${user_emoji},${password};sameSite=Strict`

            window.location.reload()

        } else {
            document.getElementById("sign_up_username").classList.add("is-invalid")
        }
        user_action_form_loading[btn_id] = res[0]
    })
}

function log_in(username, password) {
    let db_operation = {
        "f_calls": {
            "check_user": {"username": username,"password": password}
        }
    }
    query_db(db_operation, (res) => {
        if (res[0].success) {
            if (res[0].result && res[0].result.length) {
                // create "user" cookie
                document.cookie = `user=${res[0].result},${password};sameSite=Strict`

                window.location.reload()
            } else {
                document.getElementById("log_in_username").classList.add("is-invalid")
            }
        }
    })
}

function log_out() {
    // delete user cookie
    document.cookie = "user=; max-age=0;sameSite=Strict"

    window.location.reload()
}




/////////////////////////////////////////////////
//////      User interation functions      //////
/////////////////////////////////////////////////
function check_logged_user() {
    if (!(user_info.username && user_info.join_date)) {
        alert("You must log in.")
        return false
    }

    return true
}

function validate_tweet(msg) {
    if (msg.length == 0) {
       alert("Tweet Message can't be empty.")
        return false
    }

    if (msg.length >= TWEET_MAX_SZ) {
        alert(`Tweet Message must be less than ${TWEET_MAX_SZ} characters.`)
        return false
    }

    return true
}

function post_tweet(tweet_msg) {
    if (!check_logged_user()) return
    if (!validate_tweet(tweet_msg)) return

    let btn_id = event.currentTarget.id

    let db_operation = {
        "auth": [user_info.username, user_info.password],
        "f_calls": {
            "create_tweet": {
                "msg": tweet_msg,
                "timestamp": get_curr_epoch()
            }
        }
    }
    query_db(db_operation, (res) => {
        if (res[0].success) {

            if (feed_elem.id != "feed") return

            let tweet_id = res[0].result

            db_operation = {
                "f_calls": {
                    "get_tweet": {"tweet_id": tweet_id}
                }
            }

            query_db(db_operation, (res) => {
                let tweet
                if (!res[0].success) { return }

                tweet = res[0].result

                update_feed_push([tweet])
            })
        }
        user_action_form_loading[btn_id] = res[0]
    })
}

function post_reply(tweet_id, tweet_msg) {
    if (!check_logged_user()) return
    if (!validate_tweet(tweet_msg)) return

    let db_operation = {
        "auth": [user_info.username, user_info.password],
        "f_calls": {
            "create_reply": {
                "tweet_id": tweet_id,
                "msg": tweet_msg,
                "timestamp": get_curr_epoch()
            }
        }
    }
    query_db(db_operation, (res) => {
        if (res[0].success) {
            let btn = document.getElementById(`reply-${tweet_id}`)
            btn.classList.remove("btn-outline-primary")
            btn.classList.add("btn-primary")

            btn.firstElementChild.innerHTML = `${parseInt(btn.firstElementChild.innerHTML) + 1}`

            if (feed_elem.id != `feed-tweet-${tweet_id}`) return

            let reply_id = res[0].result

            db_operation = {
                "f_calls": {
                    "get_tweet": {"tweet_id": reply_id}
                }
            }

            query_db(db_operation, (res) => {
                let tweet
                if (!res[0].success) { return }

                tweet = res[0].result

                update_feed_push([tweet])
            })
        }
    })
}

function post_retweet(tweet_id, tweet_msg) {
    if (!check_logged_user()) return
    // if (!validate_tweet(tweet_msg)) return

    let db_operation = {
        "auth": [user_info.username, user_info.password],
        "f_calls": {
            "create_retweet": {
                "tweet_id": tweet_id,
                "msg": tweet_msg,
                "timestamp": get_curr_epoch()
            }
        }
    }
    query_db(db_operation, (res) => {
        if (res[0].success) {
            let btn = document.getElementById(`retweet-${tweet_id}`)
            btn.classList.remove("btn-outline-success")
            btn.classList.add("btn-success")

            btn.firstElementChild.innerHTML = `${parseInt(btn.firstElementChild.innerHTML) + 1}`

            if (feed_elem.id != "feed") return

            let retweet_id = res[0].result

            db_operation = {
                "f_calls": {
                    "get_tweet": {"tweet_id": retweet_id}
                }
            }

            query_db(db_operation, (res) => {
                let tweet
                if (!res[0].success) { return }

                tweet = res[0].result

                update_feed_push([tweet])
            })
        }
    })
}

function like(tweet_id) {
    let btn = event.currentTarget
    event.stopPropagation()
    if (!check_logged_user()) return

    let db_operation = {
        "auth": [user_info.username, user_info.password],
        "f_calls": {
            "create_like": {
                "tweet_id": tweet_id,
            }
        }
    }
    query_db(db_operation, (res) => {
        if (res[0].success) {
            btn.classList.remove("btn-outline-danger")
            btn.classList.add("btn-danger")

            btn.firstElementChild.innerHTML = `${parseInt(btn.firstElementChild.innerHTML) + 1}`

            // change click event to "remove_like"
            btn.onclick = () => {remove_like(tweet_id)}
        }
    })
}

function remove_like(tweet_id) {
    let btn = event.currentTarget
    event.stopPropagation()
    if (!check_logged_user()) return

    let db_operation = {
        "auth": [user_info.username, user_info.password],
        "f_calls": {
            "delete_like": {
                "tweet_id": tweet_id,
            }
        }
    }
    query_db(db_operation, (res) => {
        if (res[0].success) {
            btn.classList.add("btn-outline-danger")
            btn.classList.remove("btn-danger")

            btn.firstElementChild.innerHTML = `${parseInt(btn.firstElementChild.innerHTML) - 1}`

            // change click event to "like"
            btn.onclick = () => {like(tweet_id)}
        }
    })
}


/////////////////////////////////////////////////
//////    Functions to Change page HTML    //////
/////////////////////////////////////////////////
function update_user() {
    let user_div_elem = document.getElementById("user")
    let user_tweet_elem = document.getElementById("user_tweet")

    get_user_from_cookie()

    user_div_elem.innerHTML = '<a href="/"><button class="btn btn-outline-primary mb-2">Home</button><br></a>'

    if (!(user_info.username && user_info.join_date)) {
        user_div_elem.innerHTML += `
            <button type="button" class="btn btn-link p-0 m-0" onclick="log_in_modal()">Log in</button>
            to participate in the network or
            <button type="button" class="btn btn-link p-0 m-0" onclick="sign_up_modal()">Sign up</button>
        `

        if (user_tweet_elem) user_tweet_elem.classList.add('visually-hidden')
    } else { // logged in
        user_div_elem.innerHTML += `
            <span class="profile-emoji">${user_info.profile_emoji}</span>
            <div class="text-center display-inline">
                ${user_info.username}
            </div>
            <button type="button" class="btn btn-link border-0 mb-3" onclick="log_out()">Log out</button>
            <br>
            <button type="button" class="btn btn-outline-secondary" onclick="post_tweet_modal()">Tweet</button>
        `

        if (user_tweet_elem) {
            user_tweet_elem.classList.remove('visually-hidden')
            user_tweet_elem.getElementsByClassName("profile-emoji")[0].innerHTML = user_info.profile_emoji
        }
    }
}

update_user()