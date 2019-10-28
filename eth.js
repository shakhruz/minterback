// Взаимодействие с блокчейном Ethereum
const data = require("./data");
const log = require("ololog").configure({ time: true });
const ansi = require("ansicolor").nice;
const ethers = require("ethers");
const infuraId = "7a2c840b17db4133aa4a5450464f6de2";
const infuraSecret = "04a628a7841148ae85f675e774ad3a6a";
const infureEndpoint = "mainnet.infura.io/v3/7a2c840b17db4133aa4a5450464f6de2";

let infuraProvider = new ethers.providers.InfuraProvider("mainnet");
const wallet_reserve = ethers.Wallet.fromMnemonic(data.ethWalletSeed);

// Сгенерировать новый адрес и кошелек ETH
exports.generateWallet = function () {
  const wallet = ethers.Wallet.createRandom();
  return { address: wallet.address, priv_key: wallet.privateKey };
};

// Ждет приход денег на указанный адрес и вызывает callback
// изначально на балансе не должно быть денег, желательно использовать новый адрес
exports.waitForPayment = function (address, callback) {
  log("waiting for a payment on address " + address);
  infuraProvider.on(address, balance => {
    log("updated balance: " + balance + " on address: " + address);
    if (balance.gt(0)) {
      log("positive balance");
      callback(balance.toNumber());
      infuraProvider.removeAllListeners(address);
    }
  });
};

// Получаем все балансы адреса
exports.getBalance = function (address, callback) {
  log("get balance for address " + address);
  infuraProvider.getBalance(address).then(balance => {
    let etherString = ethers.utils.formatEther(balance);
    log("ETH Balance: " + etherString);
    callback(etherString);
  });
};

// Отправляем токены из резервного кошелька на адрес
exports.sendFromReserve = function (amount, address, callback) {
  log("send " + amount + " to " + address + " from reserve");
  sendETH(wallet_reserve, address, amount.toString(), callback);
};

// Отправляем все BIP токены что есть по адресу на разервный кошелек
exports.sendAllToReserve = function (priv_key, callback) {
  const wallet = new ethers.Wallet(priv_key, infuraProvider);
  sendAllFromWallet(wallet, wallet_reserve.address, callback);
};

// send some ETH from a wallet to an address
async function sendETH(fromWallet, toAddress, amountETHString, callback) {
  const nw = await fromWallet.connect(infuraProvider);
  const balance_raw = await nw.getBalance();
  const balance = ethers.utils.formatEther(balance_raw).toString();
  log("send ETH balance: ", balance);

  const amountETH = ethers.utils.parseEther(amountETHString);
  let gasPrice = await infuraProvider.getGasPrice();
  let gasLimit = 21000;
  let amountFull = amountETH.add(gasPrice.mul(gasLimit));

  if (balance_raw.gt(amountFull)) {
    const result = await nw.sendTransaction({
      to: toAddress,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      value: amountETH
    });
    log("result sending: ", result);
    callback(true, result);
  } else {
    log("not enough funds");
    callback(false, "not enough funds");
  }
}

// send all funds from a wallet to an address
async function sendAllFromWallet(wallet, toAddress, callback) {
  const balance_raw = await wallet.getBalance();

  if (!balance_raw.gt(0)) {
    log("balance is zero");
    callback(false, "balance is zero");
  } else {
    let gasPrice = await infuraProvider.getGasPrice();
    let gasLimit = 21000;
    let value = balance_raw.sub(gasPrice.mul(gasLimit));

    if (value.gt(0)) {
      const result = await wallet.sendTransaction({
        to: toAddress,
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        value: value
      });
      log("result sending eth: ", result);
      callback(true, result);
    } else {
      log("not enough funds for transfer fees");
      callback(false, "not enough funds for transfer fees");
    }
  }
}
