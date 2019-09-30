const rates = require("../rates.js");
const minter = require("../minter.js");
const data = require("../data.js");
const bcoin = require("../bcoin.js");
const eth = require("../eth.js");

// Возвращает все курсы валют
exports.getAllRates = (req, res) => {
  const btc_price = rates.btc_price() * (1 / rates.bip_price());
  const btc_buy = btc_price - btc_price * rates.spread;
  const btc_sell = btc_price + btc_price * rates.spread;
  console.log(`btc price: ${btc_price} buy: ${btc_buy} sell: ${btc_sell}`);

  const eth_price = rates.eth_price() * (1 / rates.bip_price());
  const eth_buy = eth_price - eth_price * rates.spread;
  const eth_sell = eth_price + eth_price * rates.spread;
  console.log(`eth price: ${eth_price} buy: ${eth_buy} sell: ${eth_sell}`);

  const usdt_price = 1 / rates.bip_price();
  const usdt_buy = usdt_price - usdt_price * rates.spread;
  const usdt_sell = usdt_price + usdt_price * rates.spread;
  console.log(`usdt price: ${usdt_price} buy: ${usdt_buy} sell: ${usdt_sell}`);

  minter.getBIPBalance(data.BIPReserveAddress, BIPBalance => {
    bcoin.getBalance(data.BTCReserveAccountName, BTCBalance => {
      eth.getBalance(data.ethAddress, ETHBalance => {
        const allRates = {
          rates: [
            { coin: "BIP", buy: 1, sell: 1, reserve: BIPBalance },
            { coin: "BTC", buy: btc_buy, sell: btc_sell, reserve: BTCBalance },
            { coin: "ETH", buy: eth_buy, sell: eth_sell, reserve: ETHBalance },
            { coin: "USDT", buy: usdt_buy, sell: usdt_sell, reserve: 0 }
          ]
        };
        res.json(allRates);
      });
    });
  });
};

// Возвращает все возможные токены для обмена
exports.getAllCoins = (req, res) => {
  const allCoins = {
    coins: ["BIP", "BTC", "ETH"]
  };
  res.json(allCoins);
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
