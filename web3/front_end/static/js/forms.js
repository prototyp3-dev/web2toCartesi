let emojis_select_settings = {
    options: [],
    placeholder: "Search for an emoji."
}
let emojis_table_html = ""

fetch("static/assets/emojis.json")
.then((response) => {
        response.json()
        .then((json_result)=>{
            emojis_table_html = `
                <table class="table">
            `

            const emojis_per_row = 6
            let emojis_in_row = 0 // counter
            for (let i = 0; i < json_result.length; i++) {
                emojis_in_row++
                if (emojis_in_row > emojis_per_row) {
                    emojis_table_html += `</tr><tr>` // close row and open a new one
                    emojis_in_row = 1
                }

                let emoji = json_result[i].char
                let text = `${emoji} - ${json_result[i].label}`

                emojis_select_settings.options.push({"value": emoji, "text": text})
                emojis_table_html += `
                <td class="emoji-cell" onclick="table_choose_emoji('${emoji}')">
                    ${emoji}
                </td>`
            }
            emojis_table_html += "</tr></tbody></table>"
        })
    }
)

function choose_emoji(emoji) {
    document.getElementById("sign_up_profile_emoji").value = emoji
}

function table_choose_emoji(emoji) {
    let select = document.getElementById('emoji-select');
    let control = select.tomselect;

    control.addItem(emoji, true) // true to not trigger "onChange" event
    choose_emoji(emoji)
}

/////////////////////////////////////////////////
//////          Non-Modal Forms            //////
/////////////////////////////////////////////////
function static_post_tweet_form() {
    let input_elem = document.getElementById("feed_post_tweet_content")
    input_elem.setAttribute("disabled", true)

    let btn = document.getElementById("feed_post_tweet_btn")
    let btn_wait_state_html = btn.innerHTML
    btn_submit_state(btn)

    post_tweet(input_elem.value)

    handle_form_submitting(btn.id, (res) => {
        if (res.success && res.result) {
            document.getElementById("feed_post_tweet_char_counter").innerHTML = "0"
            input_elem.value = ""
        }
        btn_wait_state(btn, btn_wait_state_html)
        input_elem.removeAttribute("disabled")
    })
}


/////////////////////////////////////////////////
//////             Modal Form              //////
/////////////////////////////////////////////////
let modal_dialog = document.getElementById("dynamicModalDialog")
let modal_header = document.getElementById("dynamicModalHeader")
let modal_body = document.getElementById("dynamicModalBody")
let modal_footer = document.getElementById("dynamicModalFooter")
let modal_obj = bootstrap.Modal.getOrCreateInstance(
    document.getElementById("dynamicModal")
)

function lock_modal_window() {
    modal_obj._config.backdrop = false
    modal_obj._config.keyboard = false

    close_modal_btn = modal_header.getElementsByTagName('button')[0]
    close_modal_btn.classList.add("disabled")
}

function unlock_modal_window() {
    modal_obj._config.backdrop = true
    modal_obj._config.keyboard = true

    close_modal_btn = modal_header.getElementsByTagName('button')[0]
    close_modal_btn.classList.remove("disabled")
}

function btn_submit_state(btn, btn_submit_state_html) {
    if (!btn_submit_state_html) {
        btn.innerHTML = `<div class="spinner-border text-secondary" role="status"></div>`
    } else {
        btn.innerHTML = btn_submit_state_html
    }
}

function btn_wait_state(btn, btn_wait_state_html) {
    btn.innerHTML = btn_wait_state_html
}

function modal_submit_state(submit_btn, btn_submit_state_html) {
    lock_modal_window()
    btn_submit_state(submit_btn, btn_submit_state_html)
}

function modal_wait_state(submit_btn, btn_wait_state_html) {
    unlock_modal_window()
    btn_wait_state(submit_btn, btn_wait_state_html)
}

function handle_form_submitting(event_id, callback) {

    let check_user_event = function() {
        if (!user_action_form_loading[event_id]) {
            window.setTimeout(check_user_event, 50)
        } else {
            callback(user_action_form_loading[event_id])
            user_action_form_loading[event_id] = null
        }
    }

    window.setTimeout(check_user_event, 500)
}

// front-end validation and sign up
function validate_and_sign_up(username, user_emoji) {
    // remove is-invalid flag (if exists)
    let username_elem = document.getElementById('sign_up_username')
    username_elem.classList.remove('is-invalid')

    let emoji_elem = document.getElementById('sign_up_profile_emoji')
    emoji_elem.classList.remove('is-invalid')

    let username_feedback_elem = document.getElementById('sign_up_username_feedback')

    let invalid = false

    if (username.length == 0) {
        username_feedback_elem.innerHTML = "Fill your Username."

        username_elem.classList.add('is-invalid')
        invalid = true
    }

    if (!invalid && username.length >= USERNAME_MAX_SZ) {
        username_feedback_elem.innerHTML = "Username must have less than 20 characters."

        username_elem.classList.add('is-invalid')
        invalid = true
    }

    if (user_emoji.length == 0) {
        emoji_elem.classList.add('is-invalid')
        invalid = true
    }

    if(invalid) return

    // back-end invalid feedback
    username_feedback_elem.innerHTML = "User already exists!"

    let btn = modal_footer.getElementsByTagName('button')[0]
    let btn_wait_state_html = btn.innerHTML
    modal_submit_state(btn)

    sign_up(username, user_emoji)
    handle_form_submitting(btn.id, (res) => {
        modal_wait_state(btn, btn_wait_state_html)
    })
}

function sign_up_modal() {
    if (!user_account) {
        alert("Please, connect to metamask.")
        return
    }

    modal_dialog.classList.remove("modal-lg")
    modal_header.innerHTML = `
        <div class="d-flex">
            <h5 class="modal-title fw-bold">Sign up</h5>
            <button type="button" data-bs-dismiss="modal"
            class="btn btn-white py-2 px-3 float-end ms-auto">
                <i class="bi bi-x"></i>
            </button>
        </div>

        <small class="modal-title text-muted d-block">Fill the information bellow</small>
    `

    modal_body.innerHTML = `
        <div class="form-floating mb-2">
            <input type="text" autocomplete="username"
            class="form-control" id="sign_up_username" name="sign_up_username" value="">
            <label class="ms-1" for="sign_up_username">Username</label>
            <div id="sign_up_username_feedback" class="invalid-feedback">

            </div>
        </div>

        <label for="sign_up_profile_emoji">Profile Emoji</label>
        <div class="row mb-2 align-items-center">
            <div class="col-3">
                <input type=text id="sign_up_profile_emoji" readonly
                class="profile-emoji border-0" style="width:100%">
                <div class="invalid-feedback">
                    Choose an emoji!
                </div>
            </div>

            <div class="col-9">
                <div class="mb-1">
                    <select id="emoji-select">
                    </select>
                </div>

                <div class="table-responsive" style="height: 100px;">
                    ${emojis_table_html}
                </div>
            </div>
        </div>

    `

    modal_footer.innerHTML = `
        <div class="text-center">
            <button id="sign-up-btn" type="button" class="btn btn-light text-center">
                Sign Up
            </button>
        </div>
    `

    let select = new TomSelect('#emoji-select', emojis_select_settings);
    select.on("change", choose_emoji)


    modal_obj.toggle() // open modal

    let sign_up_btn = modal_footer.getElementsByTagName('button')[0]
    sign_up_btn.onclick = function() {
        let username =  document.getElementById('sign_up_username').value
        let user_emoji = document.getElementById("sign_up_profile_emoji").value

        validate_and_sign_up(username, user_emoji)
    }
}


function log_in_modal() {
    if (!user_account) {
        alert("Please, connect to metamask.")
        return
    }

    modal_dialog.classList.remove("modal-lg")
    modal_header.innerHTML = `
        <div class="d-flex">
            <h5 class="modal-title fw-bold">Log in</h5>
            <button type="button" data-bs-dismiss="modal"
            class="btn btn-white py-2 px-3 float-end ms-auto">
                <i class="bi bi-x"></i>
            </button>
        </div>

        <small class="modal-title text-muted d-block">
            Fill the information bellow
        </small>
    `

    modal_body.innerHTML = `
        <div class="form-floating mb-2">
            <input type="text" autocomplete="username"
            class="form-control" id="log_in_username" name="log_in_username" value="">
            <label class="ms-1" for="log_in_username">Username</label>
            <div class="invalid-feedback">
                User not found!
            </div>
        </div>
    `

    modal_footer.innerHTML = `
        <div class="text-center">
            <button type="button" class="btn btn-light text-center">
                Log In
            </button>
        </div>
    `

    modal_obj.toggle() // open modal

    let log_in_btn = modal_footer.getElementsByTagName('button')[0]
    log_in_btn.onclick = function() {
        let username = document.getElementById('log_in_username').value

        log_in(username, user_account)
    }
}


function validate_tweet_content_on_input(char_counter_id, post_tweet_btn_id) {
    tweet_content_elem = event.currentTarget

    let tweet_char_counter_elem = document.getElementById(char_counter_id)
    tweet_char_counter_elem.innerHTML = tweet_content_elem.value.length

    let post_tweet_btn = document.getElementById(post_tweet_btn_id)


    if (tweet_content_elem.value.length >= TWEET_MAX_SZ) {
        post_tweet_btn.classList.add("disabled")
        tweet_char_counter_elem.classList.add("text-danger")

    } else {
        post_tweet_btn.classList.remove("disabled")
        tweet_char_counter_elem.classList.remove("text-danger")
    }
}


function build_post_modal_html(header_html, placeholder_html, button_html, post_function) {
    modal_dialog.classList.add("modal-lg")
    // clear header and footer
    modal_header.innerHTML = ""
    modal_footer.innerHTML = ""

    modal_body.innerHTML = `
        <div class="row p-3">
            <span class="col-2 profile-emoji">${user_info.profile_emoji}</span>

            <div class="col">
                <div>
                    <span id="modal_tweet_header">
                        ${header_html}
                    </span>
                </div>

                <div>
                    <textarea type="text" class="form-control mb-2" id="modal_tweet_content" placeholder_html="${placeholder_html}" rows="4"
                    oninput="validate_tweet_content_on_input('modal_tweet_char_counter', 'modal_tweet_button')"></textarea>
                    <span id="modal_tweet_char_counter">0</span>
                    <button id="modal_tweet_button" type="button"
                    class="btn btn-outline-dark float-end">
                        ${button_html}
                    </button>
                </div>
            </div>

        </div>
    `

    let post_tweet_btn = modal_body.getElementsByTagName('button')[0]
    post_tweet_btn.onclick = function() {
        let tweet_content_elem = document.getElementById("modal_tweet_content")
        post_function(tweet_content_elem.value)
        modal_obj.toggle()
        tweet_content_elem.value = ""
    }
    modal_obj.toggle()
}

function post_tweet_modal() {
    let header_html = "You say..."
    let placeholder_html = "What's happening?"
    let button_html = "Tweet"

    build_post_modal_html(header_html, placeholder_html, button_html, (msg) => {post_tweet(msg)})
}

function post_reply_modal(to, tweet_id) {
    // prevents from clicking the tweet when
    // reply or retweet are clicked
    event.stopPropagation()

    let header_html = `You are replying to ${to}.`
    let placeholder_html = "Tweet your reply."
    let button_html = "Reply"

    build_post_modal_html(header_html, placeholder_html, button_html, (msg) => {post_reply(tweet_id, msg)})
}

function post_retweet_modal(to, tweet_id) {
    // prevents from clicking the tweet when
    // reply or retweet are clicked
    event.stopPropagation()

    let header_html = `You are retweeting to ${to}.`
    let placeholder_html = "Add a comment."
    let button_html = "Retweet"

    build_post_modal_html(header_html, placeholder_html, button_html, (msg) => {post_retweet(tweet_id, msg)})
}
