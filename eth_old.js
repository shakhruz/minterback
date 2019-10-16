const Web3 = require("web3");
const data = require("./data");

const EthereumTx = require("ethereumjs-tx").Transaction;
const log = require("ololog").configure({ time: true });
const ansi = require("ansicolor").nice;
const axios = require("axios");

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

const ethers = require("ethers");

// let provider = ethers.getDefaultProvider();
let infuraProvider = new ethers.providers.InfuraProvider("mainnet");

let mnemonicWallet = ethers.Wallet.fromMnemonic(data.ethWalletSeed);
log("wallet address: ", mnemonicWallet.address);

// Load the second account from a mnemonic
let path = "m/44'/60'/1'/0/0";
let secondMnemonicWallet = ethers.Wallet.fromMnemonic(data.ethWalletSeed, path);
log(
  "hd wallet address: ",
  secondMnemonicWallet.address,
  secondMnemonicWallet.privateKey
);

let path2 = "m/44'/60'/0'/0/1";
let wallet2 = ethers.Wallet.fromMnemonic(data.ethWalletSeed, path2);
log("wallet2: ", wallet2.address, wallet2.privateKey);

// infuraProvider.getBalance(mnemonicWallet.address).then(balance => {
//   let etherString = ethers.utils.formatEther(balance);
//   log("Balance: " + etherString);
// });

// infuraProvider.getBalance(secondMnemonicWallet.address).then(balance => {
//   let etherString = ethers.utils.formatEther(balance);
//   log("Balance2: " + etherString);
// });

// infuraProvider.getTransactionCount(mnemonicWallet.address).then(count => {
//   log("Count: " + count);
// });

// infuraProvider.getGasPrice().then(gasPrice => {
//   let gasPriceString = gasPrice.toString();
//   let etherString = ethers.utils.formatEther(gasPrice);
//   log("Current gas price: " + gasPriceString + " eth: " + etherString);
// });

// Получать все изменения баланса
infuraProvider.on(secondMnemonicWallet.address, balance => {
  log("New Balance: " + balance);
  if (balance.gt(0)) {
    log("positive balance");
    const result = infuraProvider.removeAllListeners(
      secondMnemonicWallet.address
    );
    log("removed listener: ");
  } else {
    log("zero balance");
  }
});

usdt_data = require("./usdt_data.js");

let contract = new ethers.Contract(
  usdt_data.usdtAddress,
  usdt_data.usdtAbi,
  infuraProvider
);

// Get USDT balance
(async () => {
  const nw = await secondMnemonicWallet.connect(infuraProvider);
  let contractWithSigner = contract.connect(nw);
  let currentValue = await contractWithSigner.balanceOf(
    secondMnemonicWallet.address
  );
  log("usdt balance: ", currentValue.value.toString());
})();

// получить баланс один раз
// infuraProvider.once(secondMnemonicWallet.address, balance => {
//   console.log("New Balance: " + balance);
// });

let etherscanProvider = new ethers.providers.EtherscanProvider();

// Getting the current Ethereum price
etherscanProvider.getEtherPrice().then(function(price) {
  console.log("Ether price in USD: " + price);
});

// (async () => {
//   // encrypt and decrypt wallet wtih a password
//   const password = "test";
//   const encrypted = await secondMnemonicWallet.encrypt(password);
//   log("encrypted: ", encrypted);
//   const new_wallet = await ethers.Wallet.fromEncryptedJson(encrypted, password);
//   log("unencrypted: ", encrypted);

//   // send from second wallet to the first
//   const nw = await new_wallet.connect(infuraProvider);
//   const balance_raw = await nw.getBalance();
//   const balance = await ethers.utils.formatEther(balance_raw).toString();
//   log("balance: ", balance);

//   if (balance_raw.isZero) {
//     log("balance is zero");
//   } else {
//     let gasPrice = await infuraProvider.getGasPrice();
//     let gasLimit = 21000;
//     let value = balance_raw.sub(gasPrice.mul(gasLimit));

//     const result = await nw.sendTransaction({
//       to: mnemonicWallet.address,
//       // value: ethers.utils.parseEther(balance),
//       gasLimit: gasLimit,
//       gasPrice: gasPrice,
//       value: value
//     });
//     log("result sending: ", result);
//   }
// })();

// (async () => {
//   await sendAll(mnemonicWallet, "0x1E6db7331f903eEc742525D08045059fc65BC48d");
// })();

async function sendAll(wallet_from, to) {
  // send from second wallet to the first
  const nw = await wallet_from.connect(infuraProvider);
  const balance_raw = await nw.getBalance();
  const balance = await ethers.utils.formatEther(balance_raw).toString();
  log("send all balance: ", balance);

  if (!balance_raw.gt(0)) {
    log("send all balance is zero");
  } else {
    let gasPrice = await infuraProvider.getGasPrice();
    let gasLimit = 21000;
    let value = balance_raw.sub(gasPrice.mul(gasLimit));

    const result = await nw.sendTransaction({
      to: to,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      value: value
    });
    log("result sending all: ", result.hash);
  }
}

// const { EthHdWallet } = require("eth-hd-wallet");
// const HDwallet = EthHdWallet.fromMnemonic(data.ethWalletPrivKey);
// log("HDwallet: ", HDwallet instanceof EthHdWallet);

// let transactionHash =
//   "0x1f6566109874c83fb2a6c3bf64185d08a92b3e67e2e3bd4832ee18ff76c2ce83";

// infuraProvider.getTransaction(transactionHash).then(transaction => {
//   log("tx: ", transaction);
// });

// infuraProvider.getTransactionReceipt(transactionHash).then(receipt => {
//   log("tx receipt:", receipt);
// });

// infuraProvider.resolveName("registrar.firefly.eth").then(function(address) {
//   log("Address: " + address);
//   // "0x6fC21092DA55B392b045eD78F4732bff3C580e2c"
// });

// let address = "0x6fC21092DA55B392b045eD78F4732bff3C580e2c";
// infuraProvider.lookupAddress(address).then(function(address) {
//   log("Name: " + address);
//   // "registrar.firefly.eth"
// });

// (async () => {
//   await sweep(mnemonicWallet.privateKey, "0x6BD3F0438A2291d4f667d2AeC3f3940d5BA669F3")
// })

// send all money from an account to another one
async function sweep(privateKey, newAddress) {
  let provider = ethers.getDefaultProvider();
  let wallet = new ethers.Wallet(privateKey, provider);
  let code = await provider.getCode(newAddress);
  if (code !== "0x") {
    throw new Error("Cannot sweep to a contract");
  }
  let balance = await wallet.getBalance();
  let gasPrice = await provider.getGasPrice();
  let gasLimit = 21000;
  let value = balance.sub(gasPrice.mul(gasLimit));

  let tx = await wallet.sendTransaction({
    gasLimit: gasLimit,
    gasPrice: gasPrice,
    to: newAddress,
    value: value
  });

  console.log("Sent in Transaction: " + tx.hash);
}

exports.generateWallet = function() {
  const account = web3_ws.eth.accounts.create();
  console.log("new ETH wallet: ", account.address);
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
