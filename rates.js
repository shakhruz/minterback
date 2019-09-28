const btc_rate_api = "https://blockchain.info/ticker";
const minterApiUrl = "https://explorer-api.apps.minter.network/api/";

exports.spread = 0.05;

let _btc_usd = 0;
let _bip_usd_price = 0;
const updateRatesInterval = 5000;

function updateRates(callback) {
  fetch(`${minterApiUrl}v1/status`)
    .then(res => res.json())
    .then(json => {
      // console.log("market data: ", json)
      if (json.data) {
        _bip_usd_price = json.data.bipPriceUsd;

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

exports.bip_price = function() {
  return _bip_usd_price;
};

exports.btc_price = function() {
  return _btc_usd;
};

exports.getRates = function(callback) {
  updateRates(callback);
};
