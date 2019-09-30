const rates = require("../rates.js");
const minter = require("../minter.js");
const data = require("../data.js");
const bcoin = require("../bcoin.js");

// Возвращает все курсы валют
exports.getAllRates = (req, res) => {
  const btc_price = rates.btc_price() * (1 / rates.bip_price());

  console.log("btc price: ", btc_price);
  const btc_buy = btc_price - btc_price * rates.spread;
  const btc_sell = btc_price + btc_price * rates.spread;

  const usdt_price = 1 / rates.bip_price();
  console.log("usdt_price: ", usdt_price);

  const usdt_buy = usdt_price - usdt_price * rates.spread;
  const usdt_sell = usdt_price + usdt_price * rates.spread;

  minter.getBIPBalance(data.BIPReserveAddress, BIPBalance => {
    bcoin.getBalance(data.BTCReserveAccountName, BTCBalance => {
      const allRates = {
        rates: [
          { coin: "BIP", buy: 1, sell: 1, reserve: BIPBalance },
          { coin: "BTC", buy: btc_buy, sell: btc_sell, reserve: BTCBalance },
          { coin: "USDT", buy: usdt_buy, sell: usdt_sell, reserve: 0 }
        ]
      };
      res.json(allRates);
    });
  });
};

// Возвращает все возможные токены для обмена
exports.getAllCoins = (req, res) => {
  const allCoins = {
    coins: ["BIP", "BTC", "USDT"]
  };
  res.json(allCoins);
};

// Возвращает курсы по отношению к доллару
exports.usd_price = (req, res) => {
  const result = { btc_usd: rates.btc_price(), bip_usd: rates.bip_price() };

  res.json(result);
};
