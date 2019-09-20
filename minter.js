// const minterWallet = require('./minterhd.js')
const fetch = require('node-fetch') 
const minterWallet = require('minterjs-wallet') 
const minterLib = require('minter-js-sdk')

const bip_api_url = 'https://explorer-api.apps.minter.network/api/'
const data = require('./data.js')

import {walletFromMnemonic} from 'minterjs-wallet';
const wallet_reserve = walletFromMnemonic(data.BIPReserveMnemonic);

exports.generateWallet = function () {
    const wallet = minterWallet.generateWallet()
    const address = wallet.getAddressString()
    const priv_key = wallet.getPrivateKeyString()
    return {address: address, priv_key: priv_key}
}

exports.waitForBIPPayment = function (address, callback) {
    console.log("waiting for a payment on address " + address)
    let tries = 60 * 60
    let interval = setInterval(()=> {
      console.log("checking trxs on address " + address)
      fetch(`${bip_api_url}v1/addresses/${address}/transactions`)
      .then(res => res.json())
      .then(json => {
          const data = json.data
          if (data.length >0 ) {
              console.log("есть транзакции: ", data.length)
              for(let trx of data) {
                if (trx.data.coin == "BIP" && trx.data.to == address) {
                  console.log(`совпало: ${trx.data.value} ${trx.data.coin} fee: ${trx.fee} from: ${trx.from}  to ${trx.data.to}`)
                  clearInterval(interval)
                  callback(trx)
                }
              }
          }
      })
  
      tries -= 1
      if (tries < 1) cancelInterval(interval)
    }, 1000)    
}

exports.getBalances = function (address, callback) {
    console.log("get balance for address " + address)  
    fetch(`${bip_api_url}v1/addresses/${address}`)
    .then(res => res.json())
    .then(json => {
        if (json.data && json.data.balances) {
            callback(json.data.balances)    
        }
    })    
}

exports.getBIPBalance = function(address, callback) {
    console.log("get BIP balance for " + address)
    this.getBalances(address, (balances) => {
        let bipBalance = 0
        if (balances.length > 0) {
            for(let b of balances) {
                if (b.coin == "BIP") bipBalance = Number(b.amount)
            }
            callback(bipBalance)    
        }
    })
}

exports.sendFromReserve = function (amount, address, callback) {
    console.log("send ", amount, " to ", address)
    sendBIP(wallet_reserve.getPrivateKeyString(), address, amount, callback)
}

function sendBIP(privateKey, to, value, callback) {
    let amount = Number(value)
    console.log("send " + amount + "BIP " +" to " + to)
    // const minterSDK = new Minter({apiType: 'node', baseURL: 'https://minter-node-1.testnet.minter.network'});
    const minterSDK = new minterLib.Minter({apiType: 'gate', baseURL: 'https://gate-api.minter.network'});
    const txParams = new minterLib.SendTxParams({
        privateKey: privateKey,
        chainId: 1,
        address: to,
        amount: amount,
        coinSymbol: 'BIP',
        feeCoinSymbol: 'BIP',
        gasPrice: 1
    })
    
    minterSDK.postTx(txParams)
        .then((txHash) => {
            callback(true, txHash)
        }).catch((error) => {
            const errMessage = error.response.data.error;
            console.log(errMessage)
            callback(false, errMessage)
        })
}

// HD
// const wallet = walletFromMnemonic('solar method network orphan bullet february early gesture letter sun clerk axis');
// const seed = minterWallet.seedFromMnemonic('solar method network orphan bullet february early gesture letter sun clerk axis')
// console.log('seed: ', seed.toString('hex'))
// const hd_key = minterWallet.hdKeyFromSeed(seed, 1)._privateKey.toString('hex')
// console.log('hd key: ', hd_key)
// const hd_key1 = minterWallet.hdKeyFromSeed(seed, 3)._privateKey.toString('hex')
// console.log('hd key1: ', hd_key1)
// const hd_key2 = minterWallet.hdKeyFromSeed(seed, 4)._privateKey.toString('hex')
// console.log('hd key2: ', hd_key2)
// const wallet1 = minterWallet.walletFromPrivateKey(Buffer.from(hd_key, 'hex'))
// const wallet2 = minterWallet.walletFromPrivateKey(Buffer.from(hd_key1, 'hex'))
// const wallet3 = minterWallet.walletFromPrivateKey(Buffer.from(hd_key2, 'hex'))
// import {walletFromExtendedPrivateKey} from 'minterjs-wallet';
// const wallet = walletFromExtendedPrivateKey('xprv9s21ZrQH143K4KqQx9Zrf1eN8EaPQVFxM2Ast8mdHn7GKiDWzNEyNdduJhWXToy8MpkGcKjxeFWd8oBSvsz4PCYamxR7TX49pSpp3bmHVAY');
// const key = minterWallet.hdKeyFromSeed()

