const rates = require("../rates.js");
const minter = require("../minter.js");
const data = require("../data.js");
const bcoin = require("../bcoin.js");
const eth = require("../eth.js");

// Возвращает все курсы валют
exports.getAllRates = (req, res) => {
  const btc_price = rates.btc_price() / rates.bip_price();
  const btc_buy = btc_price - btc_price * rates.spread["BTC"];
  const btc_sell = btc_price + btc_price * rates.spread["BTC"];
  console.log(`btc price: ${btc_price} buy: ${btc_buy} sell: ${btc_sell}`);

  const eth_price = rates.eth_price() / rates.bip_price();
  const eth_buy = eth_price - eth_price * rates.spread["ETH"];
  const eth_sell = eth_price + eth_price * rates.spread["ETH"];
  console.log(`eth price: ${eth_price} buy: ${eth_buy} sell: ${eth_sell}`);

  const usdt_price = 1 / rates.bip_price();
  const usdt_buy = usdt_price - usdt_price * rates.spread["USDT"];
  const usdt_sell = usdt_price + usdt_price * rates.spread["USDT"];
  console.log(`usdt price: ${usdt_price} buy: ${usdt_buy} sell: ${usdt_sell}`);

  const bipPrices = {
    BTC: {
      market: btc_price,
      buy: btc_buy,
      sell: btc_sell,
      spread: rates.spread["BTC"]
    },
    ETH: {
      market: eth_price,
      buy: eth_buy,
      sell: eth_sell,
      spread: rates.spread["ETH"]
    },
    USDT: {
      market: usdt_price,
      buy: usdt_buy,
      sell: usdt_sell,
      spread: rates.spread["USDT"]
    }
  };
  res.json(bipPrices);
};

// Возвращает все возможные токены для обмена
exports.getAllCoins = (req, res) => {
  const allCoins = {
    coins: ["BIP", "BTC", "ETH"]
  };
  res.json(allCoins);
};

// Возвращает все возможные токены для обмена
exports.getReserveBalances = (req, res) => {
  minter.getBIPBalance(data.BIPReserveAddress, BIPBalance => {
    bcoin.getBalance(data.BTCReserveAccountName, BTCBalance => {
      eth.getBalance(data.ethAddress, ETHBalance => {
        const balances = {
          BIP: BIPBalance,
          BTC: BTCBalance,
          ETH: ETHBalance,
          USDT: 0
        };
        res.json(balances);
      });
    });
  });
};

// Возвращает курсы по отношению к доллару
exports.usd_price = (req, res) => {
  const result = {
    btc_usd: rates.btc_price(),
    bip_usd: rates.bip_price(),
    eth_usd: rates.eth_price()
  };

  res.json(result);
};
