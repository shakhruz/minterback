// const {NodeClient, WalletClient} = require('bclient')
// const {Network} = require('bcoin')
// const network = Network.get('main')

// const clientOptions = {
//   network: network.type,
//   port: network.rpcPort,
//   apiKey: '88d5ba16657ef8d18009f641ad745e2bd9b4dba3253d6e7d202c4a2db44a3eb6'
// }

// const walletOptions = {
//     network: network.type,
//     port: network.walletPort,
//     apiKey: '88d5ba16657ef8d18009f641ad745e2bd9b4dba3253d6e7d202c4a2db44a3eb6'
// }

// const options = {
//     passphrase: "",
//     witness: false,
//     watchOnly: false
// };
  
// const walletClient = new WalletClient(walletOptions)
// const client = new NodeClient(clientOptions)

// token='17715756779e4a5f7c9b26c48d90a09d276752625430b41b5fcf33cf41aa7615'
// const wallet = walletClient.wallet("primary", token);
// const btc_reserve_name = "minterx"


// sendBTC(account, value_sat, to, callback) {
//     bestFee.fetchMean().then((fee) => {
//       console.log("mean fee: ", fee)
//       const rate = Math.round(fee * 375)
//       console.log("sending " + value_sat + "SAT to " + to + " fee rate: " + rate)
//       const txOptions = {
//           account: account,
//           rate: rate,
//           outputs: [{ value: value_sat, address: to }]
//       };
  
//       (async () => {
//         const result = await wallet.send(txOptions);
//         console.log("tx result:", result);
//         callback(true, result.hash)
//         })().catch((err) => {
//           console.log(err);
//           callback(false, err.stack )
//       });
//     })
//   },
//   checkBTCWallet(username, callback) {
//     (async() => {
//         const account = await wallet.getAccount(username);
//         if (account) {
//             console.log("account for ", username, account)
//         } else {
//             const account = await wallet.createAccount(username)
//             console.log("created account:", account)
//         }    
//         callback(account)
//     })();         
//   }    