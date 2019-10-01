const Web3 = require("web3");
const data = require("./data");

const EthereumTx = require("ethereumjs-tx").Transaction;
const log = require("ololog").configure({ time: true });
const ansi = require("ansicolor").nice;

const apiKey = "556d9e89ad8243d8b9547209537f5cef";
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://ethereum.api.nodesmith.io/v1/mainnet/jsonrpc?apiKey=${apiKey}`
  )
);

const web3_ws = new Web3(
  new Web3.providers.WebsocketProvider(
    `wss://ethereum.api.nodesmith.io/v1/mainnet/jsonrpc/ws?apiKey=${apiKey}`
  )
);

// log(`ETH:`.cyan)

exports.generateWallet = function() {
  const account = web3_ws.eth.accounts.create();
  console.log("new ETH wallet: ", account.address, account.privateKey);
  return account;
};

exports.getBalance = function(address, callback) {
  web3.eth.getBalance(address).then(result => {
    const balance = web3.utils.fromWei(result, "ether");
    // console.log("eth balance: " + balance + " ETH")
    callback(balance);
  });
};

exports.sendToReserve = function(priv_key, from, amount_eth, callback) {
  const value_wei = web3.utils.toWei(
    web3.utils.toBN(Number(amount_eth.toFixed(9)) * 1000000000),
    "gwei"
  );
  console.log(`sending ${value_wei} wei from ${from} to ${data.ethAddress}`);
  sendTransaction(priv_key, from, data.ethAddress, value_wei, callback);
};

exports.sendFromReserve = function(to, amount_eth, callback) {
  const value_wei = web3.utils.toWei(
    web3.utils.toBN(Number(amount_eth.toFixed(9)) * 1000000000),
    "gwei"
  );
  console.log(`sending ${value_wei} wei from ${data.ethAddress} to ${to}`);
  sendTransaction(
    data.ethWalletPrivKey,
    data.ethAddress,
    to,
    value_wei,
    callback
  );
};

function sendTransaction(privateKey, from, to, value_wei, callback) {
  (async () => {
    web3.eth.getTransactionCount(from).then(nonce => {
      console.log(
        `The outgoing transaction count for your wallet address is: ${nonce}`
      );

      getCurrentGasPrices().then(gasPrices => {
        console.log("gas prices: ", gasPrices);
        let details = {
          to: to,
          value: web3.utils.toHex(value_wei), //web3.toHex( web3.toWei(amountToSend, 'ether') ),
          // "gas": 21000,
          // "gasPrice": gasPrices.high * 1000000000, // converts the gwei price to wei
          nonce: nonce + 1,
          gasPrice: 20000000000,
          gasLimit: 21000,
          chainId: 1 // EIP 155 chainId - mainnet: 1, rinkeby: 4
        };

        const transaction = new EthereumTx(details);
        transaction.sign(Buffer.from(privateKey, "hex"));
        const serializedTransaction = transaction.serialize();

        //   const feeCost = transaction.getUpfrontCost()
        //   console.log('Total Amount of wei needed:' + feeCost.toString())

        web3.eth
          .sendSignedTransaction("0x" + serializedTransaction.toString("hex"))
          .on("transactionHash", function(hash) {
            console.log("tx hash: ", hash);
            callback(true, `Транзакция отправлена: ${hash}`);
          })
          .on("receipt", function(receipt) {
            console.log("tx receipt: ", receipt);
            callback(true, `Транзакция принята: ${receipt}`);
          })
          .on("confirmation", function(confirmationNumber, receipt) {
            console.log("tx confirmation: ", confirmationNumber, receipt);
            callback(
              true,
              `Транзакция подтверждена, номер подтверждения: ${confirmationNumber}`
            );
          })
          .on("error", error => {
            console.log("ETH sending error:", error);
            callback(false, `Ошибка при проведении транзакции: ${error}`);
          });
      });
    });
  })();
}

const axios = require("axios");

const getCurrentGasPrices = async () => {
  let response = await axios.get(
    "https://ethgasstation.info/json/ethgasAPI.json"
  );
  let prices = {
    low: response.data.safeLow / 10,
    medium: response.data.average / 10,
    high: response.data.fast / 10
  };

  // console.log (`Current ETH Gas Prices (in GWEI):`)
  // console.log(`Low: ${prices.low} (transaction completes in < 30 minutes)`)
  // console.log(`Standard: ${prices.medium} (transaction completes in < 5 minutes)`)
  // console.log(`Fast: ${prices.high} (transaction completes in < 2 minutes)`)

  return prices;
};

exports.waitForPayment = function(address, callback) {
  var subscription2 = web3_ws.eth
    .subscribe("pendingTransactions", function(error, result) {
      if (error) {
        console.error(error);
        callback(false, eror);
      }
      callback(true, result);
      console.log("pending: ", result);
    })
    .on("data", function(transaction) {
      console.log("pending data: ", transaction);
    });
};

// const account = web3_ws.eth.accounts.privateKeyToAccount(data.ethWalletPrivKey);
// const account = web3.eth.accounts.create();

// var subscription = web3_ws.eth.subscribe('logs', {
//     address: data.ethAddress
//     // topics: [data.ethAddress]
// }, function(error, result) {
//     if (error) console.error("subs error", error)
//     else console.log("subs result: ", result);
// })
// .on("data", function(log){
//     console.log("eth data: ", log);
// })
// .on("changed", function(log){
//     console.log("changed: ", log)
// });

// unsubscribes the subscription
// subscription.unsubscribe(function(error, success){
//     if(success)
//         console.log('Successfully unsubscribed!');
// });

// var BN = web3_ws.utils.BN;
// var number = new BN('1234').add(new BN('1')).toString();
// web3_ws.utils.isBN(number);
// web3_ws.utils.isAddress('0xc1912fee45d61c87cc5ea59dae31190fffff232d');
// web3_ws.utils.toBN(1234).toString();
// web3_ws.utils.toBN('1234').add(web3_ws.utils.toBN('1')).toString();
// web3_ws.utils.toWei('1', 'ether');
// web3_ws.utils.fromWei('1', 'ether');
