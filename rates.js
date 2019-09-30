// Получение и хранение курсов валют
//
//

const btc_rate_api = "https://blockchain.info/ticker";
const minterApiUrl = "https://explorer-api.apps.minter.network/api/";

// Спрэд - разница между базовой ценой и ценой покупки и ценой продажи 0.01 - 1%
exports.spread = 0.05;

let _btc_usd = 0;
let _bip_usd_price = 0;

// Как часто будем обновлять курсы - 1000 - 1 сек
const updateRatesInterval = 10000;

// Обновить все курсы (BTC,BIP,ETH)
function updateRates(callback) {
  // Базовая рыночная цена BIP токена
  fetch(`${minterApiUrl}v1/status`)
    .then(res => res.json())
    .then(json => {
      // console.log("market data: ", json)
      if (json.data) {
        _bip_usd_price = json.data.bipPriceUsd;

        // Курс BTC/USD от blockchain.com
        fetch(btc_rate_api)
          .then(res => res.json())
          .then(json => {
            //   console.log("btc rate: ", json.USD.last)
            _btc_usd = json.USD.last;
            callback(_btc_usd, _bip_usd_price);
          })
          .catch(console.error);
      }
    });
}

// обновить котировки в первый раз
updateRates((btc_price, bip_price) => {
  console.log("btc price:", btc_price, "bip price: ", bip_price);
});

// обновлять котировки регулярно
setInterval(() => {
  updateRates((btc_price, bip_price) => {
    console.log("btc price:", btc_price, "bip price: ", bip_price);
  });
}, updateRatesInterval);

// Цена BIP/USD
exports.bip_price = function() {
  return _bip_usd_price;
};

// Цена BTC/USD
exports.btc_price = function() {
  return _btc_usd;
};

// Обновить все курсы
exports.getRates = function(callback) {
  updateRates(callback);
};
