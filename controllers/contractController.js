// Управление контрактами
import contractModel from "../models/contractModel.js";
import server from "../server";

// блокчейны
const minter = require("../minter.js");
const bcoin = require("../bcoin.js");
const eth = require("../eth.js");

// курсы валют
const rates = require("../rates.js");
const data = require("../data.js");
const bot = require("../bot.js");
var sha256 = require("sha-256-js");
const utils = require("../utils.js");

// обменник на паузу
let _paused = false;

exports.paused = function() {
  return _paused;
};

exports.setPaused = function(newValue) {
  _paused = newValue;
};

// Возвращаем все данные по контракту по id
exports.getContract = (req, res) => {
  contractModel.findById(req.params.contractId, (err, contract) => {
    if (err) {
      res.send(err);
    }

    contract.receivingPrivKey = "";
    res.json(contract);
  });
};

// Возвращаем все завершенные контракты
exports.getAllContracts = (req, res) => {
  contractModel.find({ state: "completed" }, (err, contracts) => {
    if (err) {
      res.send(err);
    }

    res.json(contracts);
  });
};

function generateWallet(coin, callback) {
  console.log("generate new " + coin + " wallet");
  switch (coin) {
    case "BIP":
      const wallet = minter.generateWallet();
      callback({ address: wallet.address, private_key: wallet.priv_key });
      break;
    case "BTC":
      bcoin.generateReserveAddress(input_address => {
        callback({ address: input_address, private_key: "" });
      });
      break;
    case "ETH":
      const eth_wallet = eth.generateWallet();
      callback({
        address: eth_wallet.address,
        private_key: eth_wallet.priv_key
      });
      break;
    default:
      console.log("unknown coin " + coin);
      break;
  }
}

// Создаем новый контракт на обмен
exports.createContract = (req, res) => {
  const newContract = new contractModel(req.body);
  newContract.start_time = new Date();

  if (_paused) {
    newContract.message =
      "Exchange paused on maintenance. Please try again later";
    server.broadcast({ type: "error_contract", contract: newContract });
    return;
  }
  console.log("new contract: ", newContract);

  calculateContractPrice(newContract, contract => {
    generateWallet(contract.sell_coin, wallet => {
      contract.receivingAddress = wallet.address;
      contract.state = "waiting for payment";

      contract.hash = calculateContractHash(contract);

      contract.save((err, saved_contract) => {
        if (err) {
          res.send(err);
          console.log("error saving to db: ", err);
          bot.sendError("error saving to db: ", err);
          return;
        }

        res.json(contract); // возвращаем без ключа
        server.broadcast({ type: "new_contract", contract: contract });

        // восстанавливаем ключ и продолжаем
        contract.receivingPrivKey = wallet.private_key;
        startContract(contract);
      });
    });
  });
};

// Ждем платеж по контракту чтобы начать его исполнение
function startContract(contract) {
  console.log("process contract: ", contract);
  switch (contract.sell_coin) {
    case "BIP":
      minter.waitForBIPPayment(contract.receivingAddress, 1, trx => {
        if (trx) {
          console.log("got BIP payment: ", trx);
          contract.receivedCoins = trx.data.value;
          contract.state = "payment received";
          contract.fromAddress = trx.from;
          contract.incomingTx = trx.hash;
          saveContract(contract);

          // отправляем все бипы с транзитного адреса на основной
          minter.sendAllToReserve(
            contract.receivingAddress,
            contract.receivingPrivKey,
            result => {
              console.log("sent all to reserve: ", result);
            }
          );

          server.broadcast({ type: "got_payment", contract: contract });
          completeContract(contract);
        } else {
          console.log("timeout waiting for BIP payment");
          contract.state = "expired";
          contract.message = "Waiting time expired";
          saveContract(contract);
          server.broadcast({ type: "expired", contract: contract });
        }
      });
      break;
    case "BTC":
      console.log(
        "now wait for BTC payment to address ",
        contract.receivingAddress
      );
      // bcoin.waitForPayment(
      //   data.BTCReserveAccountName,
      //   contract.receivingAddress,
      //   (value, details) => {
      //     console.log("got BTC payment: ", details, "value: ", value);
      //     contract.state = "payment received";
      //     contract.receivedCoins = value;
      //     contract.fromAddress = details.inputs[0].address;
      //     contract.incomingTx = details.hash;
      //     saveContract(contract);
      //     server.broadcast({ type: "got_payment", contract: contract });
      //     completeContract(contract);
      //   }
      // );
      bcoin.addWatchAddress(contract.receivingAddress, (value, details) => {
        console.log("got BTC payment: ", details, "value: ", value);
        contract.state = "payment received";
        contract.receivedCoins = value;
        contract.fromAddress = details.inputs[0].address;
        contract.incomingTx = details.hash;
        saveContract(contract);
        server.broadcast({ type: "got_payment", contract: contract });
        completeContract(contract);
      });
      break;
    case "ETH":
      console.log("now wait for ETH payment...");
      eth.waitForPayment(contract.receivingAddress, 60, balance => {
        if (balance) {
          console.log("got ETH payment: ", balance);
          contract.receivedCoins = balance;
          contract.state = "payment received";
          contract.fromAddress = "";
          contract.incomingTx = "";
          saveContract(contract);
          eth.sendAllToReserve(contract.receivingPrivKey, () => {
            console.log("sent to reserve");
          });
          server.broadcast({ type: "got_payment", contract: contract });
          completeContract(contract);
        } else {
          console.log("timeout waiting for BIP payment");
          contract.state = "expired";
          contract.message = "Waiting time expired";
          saveContract(contract);
          server.broadcast({ type: "expired", contract: contract });
        }
      });
      break;
    default:
      contract.message = "Unknown payment token";
      server.broadcast({ type: "error_contract", contract: contract });
      break;
  }
}

// Рассчитываем стоимость покупки контракта
function calculateContractPrice(contract, callback) {
  console.log("calculate contract...", contract);
  rates.getRates((btc, bip, eth) => {
    const bipPrices = rates.getBIPPrices();
    let price = 0;

    switch (contract.sell_coin) {
      case "BTC":
        price = bipPrices.BTC.buy;
        break;
      case "ETH":
        price = bipPrices.ETH.buy;
        break;
      case "BIP":
        switch (contract.buy_coin) {
          case "BTC":
            price = 1 / bipPrices.BTC.sell;
            break;
          case "ETH":
            price = 1 / bipPrices.ETH.sell;
            break;
        }
    }
    const buy_amount = contract.sell_amount * price;
    contract.calc_amount = utils.formatAmount(buy_amount, contract.buy_coin);
    contract.price = price;

    callback(contract);
  });
}

// Рассчитываем стоимость покупки контракта
function amountToSend(contract) {
  const send_amount = utils.formatAmount(
    contract.receivedCoins * contract.price,
    contract.buy_coin
  );
  console.log(" send amount: ", contract.send_amount, " ", contract.buy_coin);
  return send_amount;
}

// Исполнить контракт
function completeContract(contract) {
  contract.send_amount = amountToSend(contract);
  console.log("complete contract...", contract);

  switch (contract.buy_coin) {
    case "BTC":
      // отправляем BTC
      console.log(
        `надо отправить ${contract.send_amount}sat на адрес ${contract.toAddress}`
      );
      contract.state = "sending";
      saveContract(contract);
      bcoin.sendFromReserve(
        contract.send_amount,
        contract.toAddress,
        (result, arg) => {
          сontract.end_time = new Date();
          if (result) {
            console.log("successfuly sent bcoin: ", arg.hash);
            contract.state = "completed";
            contract.outgoingTx = arg.hash;
            contract.outgoingTxLink = "https://blockchain.info/tx/" + arh.hash;
            contract.fee_sat = arg.fee;
            server.broadcast({
              type: "completed_contract",
              contract: contract
            });
          } else {
            console.log("error sending bcoin: ", arg);
            contract.state = "error";
            contract.message = arg;
            server.broadcast({ type: "error_contract", contract: contract });
          }
          saveContract(contract);
        }
      );
      break;
    case "ETH":
      console.log(
        `надо отправить ${contract.send_amount} ETH на адрес ${contract.toAddress}`
      );
      contract.state = "sending";
      saveContract(contract);
      eth.sendFromReserve(
        contract.send_amount,
        contract.toAddress,
        (result, arg) => {
          сontract.end_time = new Date();
          if (result) {
            console.log("successfuly sent ETH: ", arg);
            contract.state = "completed";
            contract.outgoingTx = arg;
            contract.outgoingTxLink =
              "https://explorer.minter.network/transactions/" + arg;
            contract.fee_sat = 0.01; // TODO get real fee
            server.broadcast({
              type: "completed_contract",
              contract: contract
            });
          } else {
            console.log("error sending ETH: ", arg);
            contract.state = "error";
            contract.message = arg;
            server.broadcast({ type: "error_contract", contract: contract });
          }
          saveContract(contract);
        }
      );
      break;
    case "BIP":
      console.log(
        `надо отправить ${contract.send_amount} BIP на адрес ${contract.toAddress}`
      );
      contract.state = "sending";
      saveContract(contract);
      minter.sendFromReserve(
        contract.send_amount,
        contract.toAddress,
        (result, arg) => {
          сontract.end_time = new Date();
          if (result) {
            console.log("successfuly sent BIP: ", arg);
            contract.state = "completed";
            contract.outgoingTx = arg;
            contract.outgoingTxLink =
              "https://explorer.minter.network/transactions/" + arg;
            contract.fee_sat = 0.01;
            server.broadcast({
              type: "completed_contract",
              contract: contract
            });
          } else {
            console.log("error sending BIP: ", arg);
            contract.state = "error";
            contract.message = arg;
            server.broadcast({ type: "error_contract", contract: contract });
          }
          saveContract(contract);
        }
      );
      break;
    default:
      console.log("непонятно что покупать: ", contract.buy_coin);
      contract.message = "Unknown token to buy";
      сontract.end_time = new Date();
      server.broadcast({ type: "error_contract", contract: contract });
      break;
  }
}

// Сохранить контракт в базе данных
function saveContract(contract) {
  console.log("save contract: ", contract);
  contractModel.updateOne({ _id: contract._id }, contract, (err, contract) => {
    if (err) {
      console.log(err);
    }

    console.log("completed updating contract: ", contract);
  });
}

// Рассчитывает хэш контракта по его данным
function calculateContractHash(contract) {
  let data =
    contract.sell_coin +
    contract.buy_coin +
    contract.start_time +
    contract.sell_amount +
    contract.dest_address +
    contract.receivingAddress;
  return sha256(data);
}

// exports.updateContract = (req, res) => {
//   contractModel.findOneAndUpdate(
//     {
//       _id: req.params.contractId
//     },
//     req.body,
//     (err, contract) => {
//       if (err) {
//         res.send(err);
//       }

//       res.json(contract);
//     }
//   );
// };

// exports.deleteContract = (req, res) => {
//   contractModel.remove(
//     {
//       _id: req.params.contractId
//     },
//     err => {
//       if (err) {
//         res.send(err);
//       }

//       res.json({
//         message: `contract ${req.params.contractId} successfully deleted`
//       });
//     }
//   );
// };
