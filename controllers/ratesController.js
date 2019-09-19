exports.getAllRates = (req, res) => {
    const allRates = {
        rates: [
            {coin: "BTC", buy: 104624, sell: 115637, reserve: 10},
            {coin: "USDT", buy: 10.44, sell: 11.54, reserve: 10000}
        ]
    }
    res.json(allRates);
};