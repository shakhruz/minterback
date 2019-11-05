// Взаимодействие с Minter блокчейном
const fetch = require("node-fetch");
const minterWallet = require("minterjs-wallet");
const minterLib = require("minter-js-sdk");

// адрес сервиса API для Minter
const bip_api_url = "https://explorer-api.apps.minter.network/api/";
const data = require("./data.js");

import { walletFromMnemonic } from "minterjs-wallet";
const wallet_reserve = walletFromMnemonic(data.BIPReserveMnemonic);

// Сгенерировать новый адрес и кошелек минтер
exports.generateWallet = function() {
  const wallet = minterWallet.generateWallet();
  const address = wallet.getAddressString();
  const priv_key = wallet.getPrivateKeyString();
  return { address: address, priv_key: priv_key };
};

// Ждет приход денег на указанный адрес и вызывает callback
exports.waitForBIPPayment = function(address, waitMinutes, callback) {
  console.log("waiting for a payment on address " + address);
  let tries = waitMinutes * 60;
  let interval = setInterval(() => {
    console.log("checking trxs on address " + address);
    fetch(`${bip_api_url}v1/addresses/${address}/transactions`)
      .then(res => res.json())
      .then(json => {
        const data = json.data;
        if (data.length > 0) {
          console.log("есть транзакции: ", data.length);
          for (let trx of data) {
            if (trx.data.coin == "BIP" && trx.data.to == address) {
              console.log(
                `совпало: ${trx.data.value} ${trx.data.coin} fee: ${trx.fee} from: ${trx.from}  to ${trx.data.to}`
              );
              clearInterval(interval);
              callback(trx);
            }
          }
        }
      });

    tries -= 1;
    if (tries < 1) {
      callback(false);
      clearInterval(interval);
    }
  }, 1000);
};

// Получаем все балансы адреса
exports.getBalances = function(address, callback) {
  console.log("get balance for address " + address);
  fetch(`${bip_api_url}v1/addresses/${address}`)
    .then(res => res.json())
    .then(json => {
      if (json.data && json.data.balances) {
        callback(json.data.balances);
      }
    });
};

// Возвращает баланс BIP токенов по адресу
exports.getBIPBalance = function(address, callback) {
  console.log("get BIP balance for " + address);
  this.getBalances(address, balances => {
    let bipBalance = 0;
    if (balances.length > 0) {
      for (let b of balances) {
        if (b.coin == "BIP") bipBalance = Number(b.amount);
      }
      callback(bipBalance);
    }
  });
};

// Отправляем токены из резервного кошелька на адрес
exports.sendFromReserve = function(amount, address, callback) {
  console.log("send ", amount, " to ", address);
  sendBIP(wallet_reserve.getPrivateKeyString(), address, amount, callback);
};

// Отправляем все BIP токены что есть по адресу на разервный кошелек
exports.sendAllToReserve = function(from, priv_key, callback) {
  this.getBIPBalance(from, balance_bip => {
    if (balance_bip > 0.01) {
      balance_bip -= 0.01;
      const to = wallet_reserve.getAddressString();
      console.log("send ", balance_bip, " to ", to);
      sendBIP(priv_key, to, balance_bip, result => {
        callback(result);
      });
    }
  });
};

// Отправляем BIP токены на адрес используя приватный ключ
function sendBIP(privateKey, to, value, callback) {
  let amount = Number(value);
  console.log("send " + amount + "BIP " + " to " + to);
  const minterSDK = new minterLib.Minter({
    chainId: 1,
    apiType: "node",
    baseURL: "https://api.minter.stakeholder.space"
  });
  const txParams = new minterLib.SendTxParams({
    privateKey: privateKey,
    chainId: 1,
    address: to,
    amount: amount,
    coinSymbol: "BIP",
    feeCoinSymbol: "BIP",
    gasPrice: 1
  });

  minterSDK
    .postTx(txParams)
    .then(txHash => {
      callback(true, txHash);
    })
    .catch(error => {
      const errMessage = error.response.data.error;
      console.log(errMessage);
      callback(false, errMessage);
    });
}
