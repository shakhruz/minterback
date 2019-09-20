const rates = require('../rates.js')

exports.getAllRates = (req, res) => {
    const btc_price = rates.btc_price() * (1/rates.bip_price())

    console.log("btc price: ", btc_price)
    const btc_buy = btc_price - btc_price * rates.spread
    const btc_sell = btc_price + btc_price * rates.spread

    const usdt_price  = 1/ rates.bip_price()
    console.log("usdt_price: ", usdt_price)

    const usdt_buy = usdt_price - usdt_price * rates.spread
    const usdt_sell = usdt_price + usdt_price * rates.spread

    const allRates = {
        rates: [
            {coin: "BIP", buy: 1, sell: 1, reserve: 50000},
            {coin: "BTC", buy: btc_buy, sell: btc_sell, reserve: 10},
            {coin: "USDT", buy: usdt_buy, sell: usdt_sell, reserve: 10000}
        ]
    }
    res.json(allRates);    
};

exports.getAllCoins = (req, res) => {
    const allCoins = {
        coins: ["BIP", "BTC", "USDT"]
    }
    res.json(allCoins);
};

exports.usd_price = (req, res) => {
    const result = {btc_usd: rates.btc_price(), bip_usd: rates.bip_price()}

    res.json(result);
}