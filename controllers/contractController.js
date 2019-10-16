import contractModel from "../models/contractModel.js";

const minter = require("../minter.js");
const bcoin = require("../bcoin.js");
const rates = require("../rates.js");
const data = require("../data.js");
const eth = require("../eth.js");

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

// Возвращаем все контракты
exports.getAllContracts = (req, res) => {
  contractModel.find({ state: "completed" }, (err, contracts) => {
    if (err) {
      res.send(err);
    }

    res.json(contracts);
  });
};

// Создаем новый контракт на обмен
exports.createContract = (req, res) => {
  const newContract = new contractModel(req.body);
  console.log("new contract: ", newContract);
  newContract.buy_amount = 0;
  newContract.btc_usd = rates.btc_price();
  newContract.eth_usd = rates.eth_price();
  newContract.bip_usd = rates.bip_price();

  if (newContract.sell_coin == "BIP") {
    console.log("generate BIP address to receive coins");
    const wallet = minter.generateWallet();
    console.log("wallet: ", wallet);
    newContract.receivingAddress = wallet.address;
    newContract.receivingPrivKey = wallet.priv_key;
    const priv_key = newContract.receivingPrivKey;
    newContract.state = "waiting for payment";

    newContract.save((err, contract) => {
      if (err) {
        res.send(err);
      }

      console.log("returning new contract: ", contract);
      newContract.receivingPrivKey = null; // прячем ключ
      res.json(newContract); // возвращаем без ключа

      // восстанавливаем ключ и продолжаем
      contract.receivingPrivKey = priv_key;
      startContract(contract);
    });
  } else {
    if (newContract.sell_coin == "BTC") {
      console.log("generating new BTC address to receive payment");
      bcoin.generateReserveAddress(input_address => {
        console.log("new address: ", input_address);
        newContract.receivingAddress = input_address;
        newContract.receivingPrivKey = "";
        newContract.state = "waiting for payment";

        newContract.save((err, contract) => {
          if (err) {
            res.send(err);
          }

          console.log("returning new contract: ", contract);
          res.json(contract);
          startContract(contract);
        });
      });
    } else {
      if (newContract.sell_coin == "ETH") {
        console.log("generating new ETH address to receive payment");
        const eth_wallet = eth.generateWallet();
        console.log("wallet: ", eth_wallet);
        newContract.receivingAddress = eth_wallet.address;
        newContract.receivingPrivKey = eth_wallet.priv_key;
        const priv_key = newContract.receivingPrivKey;
        newContract.state = "waiting for payment";

        newContract.save((err, contract) => {
          if (err) {
            res.send(err);
          }

          console.log("returning new contract: ", contract);
          newContract.receivingPrivKey = null; // прячем ключ
          res.json(newContract); // возвращаем без ключа

          // восстанавливаем ключ и продолжаем
          contract.receivingPrivKey = priv_key;
          startContract(contract);
        });
      }
    }
  }
};

// Ждем платеж по контракт чтобы начать его исполнение
function startContract(contract) {
  console.log("process contract: ", contract);
  if (contract.sell_coin == "BIP") {
    minter.waitForBIPPayment(contract.receivingAddress, trx => {
      console.log("got BIP payment: ", trx);
      contract.receivedCoins = trx.data.value;
      contract.state = "payment received";
      contract.fromAddress = trx.from;
      contract.incomingTx = trx.hash;
      saveContract(contract);
      sendAllBIPToReserve(contract);
      completeContract(contract);
    });
  } else {
    if (contract.sell_coin == "BTC") {
      console.log(
        "now wait for BTC payment to address ",
        contract.receivingAddress
      );
      bcoin.waitForPayment(
        data.BTCReserveAccountName,
        contract.receivingAddress,
        (value, details) => {
          console.log("got BTC payment: ", details, "value: ", value);
          contract.state = "payment received";
          contract.receivedCoins = value;
          contract.fromAddress = details.inputs[0].address;
          contract.incomingTx = details.hash;
          saveContract(contract);
          completeContract(contract);
        }
      );
    } else {
      if (contract.sell_coin == "ETH") {
        console.log("now wait for ETH payment...");
        eth.waitForPayment(contract.receivingAddress, balance => {
          console.log("got ETH payment: ", balance);
          contract.receivedCoins = balance;
          contract.state = "payment received";
          contract.fromAddress = "";
          contract.incomingTx = "";
          saveContract(contract);
          eth.sendAllToReserve(contract.receivingPrivKey, () => {
            console.log("sent to reserve");
          });
          completeContract(contract);
        });
      } else {
        console.log(
          "принимаем только BIP, BTC, ETH",
          contract.sell_coin,
          " не умеем"
        );
      }
    }
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

// Исполнить контракт
function completeContract(contract) {
  console.log("complete contract...");
  if (contract.buy_coin == "BTC") {
    // отправляем BTC
    rates.getRates((btc_price, bip_price, eth_price) => {
      btc_price = btc_price * (1 / bip_price);

      console.log("btc price: ", btc_price);
      const btc_sell = btc_price + btc_price * rates.spread;
      console.log("btc buy: ", btc_sell);

      contract.send_amount = Math.trunc(
        (contract.receivedCoins / btc_sell) * 100000000
      );

      contract.price = btc_sell;

      console.log(
        `надо отправить ${contract.send_amount}sat на адрес ${contract.toAddress}`
      );
      contract.state = "sending";
      saveContract(contract);
      bcoin.sendFromReserve(
        contract.send_amount,
        contract.toAddress,
        (result, arg) => {
          if (result) {
            console.log("successfuly sent bcoin: ", arg.hash);
            contract.state = "completed";
            contract.outgoingTx = arg.hash;
            contract.fee_sat = arg.fee;
          } else {
            console.log("error sending bcoin: ", arg);
            contract.state = "error";
            contract.message = arg;
          }
          saveContract(contract);
        }
      );
    });
  } else {
    if (contract.buy_coin == "BIP") {
      console.log("sending BIP");
      rates.getRates((btc_price, bip_price, eth_price) => {
        if (contract.sell_coin == "BTC") {
          console.log("считаем сколько BIP нужно выплатить за полученные BTC");
          btc_price = btc_price * (1 / bip_price);

          console.log("btc price: ", btc_price);
          const btc_buy = btc_price - btc_price * rates.spread;
          console.log("btc buy: ", btc_buy);

          contract.send_amount = Math.trunc(
            (contract.receivedCoins * btc_buy) / 100000000
          );

          contract.price = btc_buy;
        } else {
          if (contract.sell_coin == "ETH") {
            console.log(
              "считаем сколько BIP нужно выплатить за полученные ETH"
            );
            eth_price = eth_price * (1 / eth_price);
            console.log("eth price: ", eth_price);
            const eth_buy = eth_price - eth_price * rates.spread;
            console.log("eth buy: ", eth_buy);

            contract.send_amount = Math.trunc(
              (contract.receivedCoins * eth_buy) / 1000000000000000000
            );

            contract.price = eth_buy;
          } else {
            console.log("не могу посчитать сколько выплатить BIP...");
          }
        }

        console.log("send_amount: ", contract.send_amount);
        console.log(
          `надо отправить ${contract.send_amount} BIP на адрес ${contract.toAddress}`
        );
        contract.state = "sending";
        saveContract(contract);
        minter.sendFromReserve(
          contract.send_amount,
          contract.toAddress,
          (result, arg) => {
            if (result) {
              console.log("successfuly sent BIP: ", arg);
              contract.state = "completed";
              contract.outgoingTx = arg;
              contract.fee_sat = 0.01;
            } else {
              console.log("error sending BIP: ", arg);
              contract.state = "error";
              contract.message = arg;
            }
            saveContract(contract);
          }
        );
      });
    } else {
      if (contract.buy_coin == "ETH") {
        console.log("sending ETH");
        rates.getRates((btc_price, bip_price, eth_price) => {
          eth_price = eth_price * (1 / bip_price);

          console.log("eth price: ", eth_price);
          const eth_buy = eth_price - eth_price * rates.spread;
          console.log("eth buy: ", eth_buy);

          contract.send_amount = contract.receivedCoins / eth_buy;
          contract.price = eth_buy;

          console.log("send_amount: ", contract.send_amount);
          console.log(
            `надо отправить ${contract.send_amount} ETH на адрес ${contract.toAddress}`
          );
          contract.state = "sending";
          saveContract(contract);
          eth.sendFromReserve(
            contract.send_amount,
            contract.toAddress,
            (result, arg) => {
              if (result) {
                console.log("successfuly sent ETH: ", arg);
                contract.state = "completed";
                contract.outgoingTx = arg;
                contract.fee_sat = 0.01; // TODO get real fee
              } else {
                console.log("error sending ETH: ", arg);
                contract.state = "error";
                contract.message = arg;
              }
              saveContract(contract);
            }
          );
        });
      } else {
        console.log(
          "не могу исполнить контракт, непонятно что покупать: ",
          contract.buy_coin
        );
      }
    }
  }
}

function sendAllBIPToReserve(contract) {
  console.log(
    "sending all BIP to reserve account from ",
    contract.receivingAddress,
    contract.receivingPrivKey
  );
  minter.sendAllToReserve(
    contract.receivingAddress,
    contract.receivingPrivKey,
    result => {
      console.log("sent all to reserve: ", result);
    }
  );
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
