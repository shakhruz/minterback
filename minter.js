const minterWallet = require('minterjs-wallet') 
const minterApiUrl = 'https://explorer-api.apps.minter.network/api/'
const bip_api_url = 'https://explorer-api.apps.minter.network/api/'

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
