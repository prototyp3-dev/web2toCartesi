let conf = {
    "provider": "http://localhost:8545",
    "inspect_url": "http://localhost:5005/inspect",
    "graphql_url": "http://localhost:4000/graphql",
    "dapp": null,
    "blockchain": null
}

Promise.all([fetch("static/dapp.json"), fetch("static/blockchain.json")])
.then((responses) => {
    Promise.all([responses[0].json(), responses[1].json()])
    .then((contents) => {
        conf.dapp = contents[0]
        conf.blockchain = contents[1]

        metamask_setup()
    })
})

let user_account = null // metamask user account

// window.ethereum === Web3.givenProvider
let web3 = new Web3(window.ethereum || conf.provider)

let input_contract = null // input contract obj

/////////////////////////////////////////////////
//////         Metamask FUNCTIONS          //////
/////////////////////////////////////////////////

/////////////////////////
// Metamask Button
/////////////////////////

function change_metamask_btn_html() {
    let metamask_btn_elem = document.getElementById("metamask-connect")

    if (user_account) {
        metamask_btn_elem.innerHTML = `
            Already Connected
        `
        metamask_btn_elem.classList.add("disabled")
    } else {
        metamask_btn_elem.innerHTML = `
            Connect to Metamask
        `
        metamask_btn_elem.classList.remove("disabled")
    }
}

/////////////////////////
// Metamask Handlers
/////////////////////////

function handle_accounts(accounts) {
    if (accounts.length === 0) {
        // MetaMask is locked or the user has not connected any accounts
        user_account = null
    } else {
        user_account = accounts[0]
    }

    change_metamask_btn_html()
}

function chain_change(chainId) {
    if (web3.utils.hexToNumberString(chainId) != conf.blockchain.chainId) {
        throw `Set Metamask's Network to the one with ID: ${conf.blockchain.chainId}`
    }
}

function handle_chainid(chainId) {
    try {
        chain_change(chainId)
    }
    catch (e) {
        alert(e)
    }
}

/////////////////////////
// Metamask Setup
/////////////////////////

// check if user has metamask installed
function check_metamask() {
    return typeof window.ethereum !== 'undefined'
}

function setup_dapp_contract(contract_abi) {
    return new web3.eth.Contract(contract_abi, conf.dapp.address)
}

function setup_connected_account() {
    let accounts = window.ethereum._state.accounts
    handle_accounts(accounts)
}

function setup_handlers_account_contracts() {
    if (!check_metamask()) return

    window.ethereum.on('chainChanged', handle_chainid)
    window.ethereum.on('accountsChanged', handle_accounts)
    setup_connected_account()
    input_contract = setup_dapp_contract(conf.blockchain.contracts.InputFacet.abi)
}

function metamask_setup() {
    try {
        setup_handlers_account_contracts()
    } catch (error) {
        alert(error)
    }
}

async function metamask_user_connect() {
    if (user_account) return // already connected

    let accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    handle_accounts(accounts)
}

async function metamask_connect() {
    try {
        await metamask_user_connect()
    }
    catch (e) {
        alert(e)
        return false
    }

    return true
}


/////////////////////////
// Contract Methods (Send)
/////////////////////////

function input_contract_add_input(input, callback, on_error) {
    if (!user_account) {
        alert("Please, connect to Metamask first.")
        return
    }

    let input_hex = web3.utils.utf8ToHex(input)

    input_contract.methods.addInput(input_hex).send({ from: user_account })
    .then((receipt)=>{
        added_input = receipt.events.InputAdded.returnValues
        input_report_polling(added_input, callback)
    })
    .catch(on_error? on_error:console.log)
}

/////////////////////////////////////////////////
//////       Cartesi Machine Inspect       //////
/////////////////////////////////////////////////

function do_inspect_get(body, is_async) {
    if (is_async == undefined) { is_async = true }

    body = JSON.stringify(body)
    let url = `${conf.inspect_url}/${body}`

    // cache equals to false adds a timestamp parameter to the GET request
    return $.ajax({
        url: url,
        type: "GET",
        async: is_async,
        cache : true
    });
}

function inspect_db(functions, callback) {
    if (callback == undefined) { return }

    try {
        do_inspect_get(functions).then((res) => {
            if (res.status == "Accepted") {
                response = JSON.parse(web3.utils.hexToUtf8(res.reports[0].payload))
                callback(response)
            } else {
                alert(`Inspect ${functions} rejected by Cartesi Machine.`)
            }
        })
    } catch(err) {
        alert(err)
    }
}


/////////////////////////////////////////////////
//////           GraphQL Polling           //////
/////////////////////////////////////////////////

function input_report_polling(added_input, callback) {
    let query = `{
        "query":"query GetEpochInputReport {epochI(index: ${added_input.epochNumber}) {input(index: ${added_input.inputIndex}) {reports {nodes {payload}}}}}"
        }
    `

    function poll() {
        $.ajax({
            url: conf.graphql_url,
            type: "POST",
            contentType: "application/json",
            data: query
        }).then(
            (graphql_res)=>{
                if (graphql_res.data) {
                    report_nodes = graphql_res.data.epochI.input.reports.nodes
                    report_results = []

                    for (let i = 0; i < report_nodes.length; i++) {
                        report_results.push(JSON.parse(web3.utils.hexToUtf8(report_nodes[i].payload)))
                    }

                    console.log(report_results)
                    if (callback) callback(report_results)

                } else {
                    window.setTimeout(poll, 200)
                }
            }
        )
    }

    window.setTimeout(poll, 500)
}