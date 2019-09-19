// const minterWallet = require('./minterhd.js') 
const minterWallet = require('minterjs-wallet') 

const minterApiUrl = 'https://explorer-api.apps.minter.network/api/'
const bip_api_url = 'https://explorer-api.apps.minter.network/api/'

import {walletFromMnemonic} from 'minterjs-wallet';

exports.generateWallet = function () {
    const wallet = minterWallet.generateWallet()
    console.log("generated address:", wallet.getAddressString())    
    return {address: wallet.getAddressString(), priv_key: wallet.getPrivateKeyString()}
}

const spread = 5 // % спрэда

// function newBIPWallet() {
//     const wallet = minterWallet.generateWallet()
//     this.bip_address = wallet.getAddressString()
//     console.log("new BIP address", this.bip_address)
//     return wallet
// }

// this.showSendToAddress = true
// this.waitForBIPpayment(this.bip_address, (trx, user_id)=>{
//   console.log("got BIP payment: ", trx, user_id)
//   this.bip_received = trx.data.value * 1000
//   this.showGotPayment = true
//   this.btc_to_send = this.bip_received / this.bip_btc_buy_price * 100000000
// })

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

