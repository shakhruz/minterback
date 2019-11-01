// Получение и хранение курсов валют
import server from "./server";

const eth = require("./eth.js");
const data = require("./data.js");
const cc = require("cryptocompare");

const minterApiUrl = "https://explorer-api.apps.minter.network/api/";

cc.setApiKey(data.compareKey);

// Спрэд - разница между базовой ценой и ценой покупки и ценой продажи 0.01 - 1%
let _spread = { BTC: 0.05, ETH: 0.05, USDT: 0.05 };
exports.spread = _spread;

let _btc_usd = 0;
let _bip_usd = 0;
let _eth_usd = 0;

let auto_update = true;

exports.setAutoUpdate = function(newValue) {
  auto_update = newValue;
};

exports.setBIPPrice = function(newPrice) {
  console.log("set bip price to: ", newPrice);
  _bip_usd = newPrice;
};

exports.setSpread = function(btc_spread, eth_spread) {
  _spread = { BTC: btc_spread, ETH: eth_spread, USDT: _spread.USDT };
};

exports.setBTCSpread = function(btc_spread) {
  _spread = { BTC: btc_spread, ETH: _spread.ETH, USDT: _spread.USDT };
};

exports.setETHSpread = function(eth_spread) {
  _spread = { BTC: _spread.BTC, ETH: eth_spread, USDT: _spread.USDT };
};

exports.getSpreads = function() {
  return {
    btc_spread: _spread.BTC,
    eth_spread: _spread.ETH,
    usdt_spread: _spread.USDT
  };
};

// Как часто будем обновлять курсы - 1000 - 1 сек
const updateRatesInterval = 60 * 1000;

// Обновить все курсы (BTC,BIP,ETH)
function updateRates(callback) {
  // Базовая рыночная цена BIP токена
  fetch(`${minterApiUrl}v1/status`)
    .then(res => res.json())
    .then(json => {
      // console.log("market data: ", json)
      if (json.data) {
        _bip_usd = json.data.bipPriceUsd;

        cc.priceMulti(["BTC", "ETH"], ["USD"])
          .then(prices => {
            console.log(prices);
            _btc_usd = prices.BTC.USD;
            _eth_usd = prices.ETH.USD;
            callback(_btc_usd, _bip_usd, _eth_usd);
            server.broadcast({
              type: "usdPrices",
              btc_usd: _btc_usd,
              eth_usd: _eth_usd,
              bip_usd: _bip_usd
            });

            broadcastBipPrices();
          })
          .catch(console.error);
      }
    });
}

exports.getBIPPrices = function() {
  return calcBIPPrices();
};

function calcBIPPrices() {
  const btc_price = _btc_usd / _bip_usd;
  const btc_buy = btc_price - btc_price * _spread.BTC;
  const btc_sell = btc_price + btc_price * _spread.BTC;
  console.log(`btc price: ${btc_price} buy: ${btc_buy} sell: ${btc_sell}`);

  const eth_price = _eth_usd / _bip_usd;
  const eth_buy = eth_price - eth_price * _spread.ETH;
  const eth_sell = eth_price + eth_price * _spread.ETH;
  console.log(`eth price: ${eth_price} buy: ${eth_buy} sell: ${eth_sell}`);

  const usdt_price = 1 / _bip_usd;
  const usdt_buy = usdt_price - usdt_price * _spread.USDT;
  const usdt_sell = usdt_price + usdt_price * _spread.USDT;
  console.log(`usdt price: ${usdt_price} buy: ${usdt_buy} sell: ${usdt_sell}`);

  return {
    type: "bipPrices",
    BTC: {
      market: btc_price,
      buy: btc_buy,
      sell: btc_sell,
      spread: _spread.BTC
    },
    ETH: {
      market: eth_price,
      buy: eth_buy,
      sell: eth_sell,
      spread: _spread.ETH
    },
    USDT: {
      market: usdt_price,
      buy: usdt_buy,
      sell: usdt_sell,
      spread: _spread.USDT
    }
  };
}

function broadcastBipPrices() {
  const bipPrices = calcBIPPrices();
  server.broadcast(bipPrices);
}

// обновить котировки в первый раз
updateRates((btc_price, bip_price, eth_price) => {
  console.log(
    "btc price:",
    btc_price,
    "bip price: ",
    bip_price,
    "eth price: ",
    eth_price
  );
});

// обновлять котировки регулярно
setInterval(() => {
  if (auto_update) {
    updateRates((btc_price, bip_price, eth_price) => {
      // console.log(
      //   "btc price:",
      //   btc_price,
      //   "bip price: ",
      //   bip_price,
      //   "eth price: ",
      //   eth_price
      // );
    });
  }
}, updateRatesInterval);

// Цена BIP/USD
exports.bip_price = function() {
  return _bip_usd;
};

// Цена BTC/USD
exports.btc_price = function() {
  return _btc_usd;
};

// Цена BTC/USD
exports.eth_price = function() {
  return _eth_usd;
};

// Обновить все курсы
exports.getRates = function(callback) {
  updateRates(callback);
};

exports.getUSDPrices = function() {
  return {
    btc_usd: _btc_usd,
    bip_usd: _bip_usd,
    eth_usd: _eth_usd
  };
};
