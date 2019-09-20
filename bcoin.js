global.fetch = require("node-fetch");

const {NodeClient, WalletClient} = require('bclient')
const {Network} = require('bcoin')
const network = Network.get('main')
const data = require('./data')

const bestFee = require('bitcoin-best-fee')

const clientOptions = {
  network: network.type,
  port: network.rpcPort,
  apiKey: '88d5ba16657ef8d18009f641ad745e2bd9b4dba3253d6e7d202c4a2db44a3eb6'
}

const walletOptions = {
    network: network.type,
    port: network.walletPort,
    apiKey: '88d5ba16657ef8d18009f641ad745e2bd9b4dba3253d6e7d202c4a2db44a3eb6'
}

const options = {
    passphrase: "",
    witness: false,
    watchOnly: false
};
  
const walletClient = new WalletClient(walletOptions)
const client = new NodeClient(clientOptions)

const token='17715756779e4a5f7c9b26c48d90a09d276752625430b41b5fcf33cf41aa7615'
const wallet = walletClient.wallet("primary", token);
let reserve_account;
let reserve_name = data.BTCReserveAccountName;
// let fees = {high: 20, low: 20, mean: 20}

function getReserveAccount() {
    (async() => {
        let account = await wallet.getAccount(reserve_name)
        if (account) {
            console.log("reserve account: ", account)
        } else {
            account = await wallet.createAccount(reserve_name)
            console.log("created reserve account")
        }
        reserve_account = account
    })();       
}
getReserveAccount()

exports.generateReserveAddress = function (callback) {
    (async () => {
        const result = await wallet.createAddress(reserve_name);
        const input_address = result.address
        callback(input_address)
    })();
}

// function getFees() {
//     bestFee.fetchHigh().then(fee_high => {fees.high = fee_high; console.log("high fee: ", fee_high)})
//     bestFee.fetchLow().then(fee_low => {fees.low = fee_low; console.log("low fee: ", fee_low)})
//     bestFee.fetchMean().then(fee_mean => {fees.mean = fee_mean; console.log("mean fee: ", fee_mean)})    
// }
// getFees()

exports.getFees = function() {
    return fees
}

exports.addBTCWallet = async function (wallet_id, callback) {
    const account = await wallet.createAccount(wallet_id)
    console.log("created account:", account)
    callback(account)
}

exports.checkWallet = function (wallet_id, callback) {
    (async() => {
        const account = await wallet.getAccount(wallet_id);
        if (account) {
            // console.log("account for ", username, account)
        } else {
            const account = await wallet.createAccount(wallet_id)
            // console.log("created account:", account)
        }    
        callback(account)
    })();       
}

exports.getBalance = async function (wallet_id, callback) {
    const resultBalance = await wallet.getBalance(wallet_id)
    console.log("balance for ", wallet_id, resultBalance)
    callback(resultBalance.confirmed)
}

exports.send = function (wallet_id, value_sat, to, rate, callback) {
    console.log("sending " + value_sat + "SAT to " + to + " fee rate: " + rate)
    sendTransaction(wallet_id, value_sat, to, rate, callback)
}

exports.sendFast = function (wallet_id, value_sat, to, callback) {
    bestFee.fetchMean().then((fee) => {
        console.log("mean fee: ", fee)
        const rate = Math.round(fee * 375)
        console.log("sending " + value_sat + "SAT to " + to + " fee rate: " + rate)
        sendTransaction(wallet_id, value_sat, to, rate, callback)
    })    
}

exports.sendFromReserve = function (value_sat, to, callback) {
    this.sendFast(data.BTCReserveAccountName, value_sat, to, callback)
}

function sendTransaction(account, value_sat, to, rate, callback) {
    const txOptions = {
        account: account,
        rate: rate,
        outputs: [{ value: value_sat, address: to }]
    };
    
    (async () => {
        const result = await wallet.send(txOptions);
        console.log("tx result:", result);
        callback(true, {hash: result.hash, fee: result.fee})
    })().catch((err) => {
        console.log(err);
        callback(false, err.stack )
    });
}

exports.waitForPayment = function (wallet_id, input_address, callback) {
    (async () => {
        // Connection and auth handled by opening client
        await walletClient.open();
        await walletClient.join('*', token);
      })();

    walletClient.bind('confirmed', (acc, details) => {
        console.log('Wallet -- TX Event, Wallet ID:\n', acc, details);
        for (let out of details.outputs ) {
            if (out.address == input_address) {
                console.log("транзакция: ", details)
                console.log("платеж на ", out.value, "sat отправлен")
                callback(out.value, details)
            }
        }
    });
}

