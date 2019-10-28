# minterback
Бэкенд для обменника

=== 1. Установка ===

#1 BCOIN
для запуска необходимо  установить bcoin - ноду для биткоина
https://bcoin.io/guides/vps-setup.html

#установить node-gyp
npm install -g node-gyp

#Install bcoin
sudo apt-get install build-essential python
git clone https://github.com/bcoin-org/bcoin
cd bcoin
npm install -g
npm install -g bclient

#2 установить модули 
cd minterback
npm install

Настройка:
data.js включает настройки:
BTCReserveAccountName: "minterx" - название резервного аккаунта в bcoin
BIPReserveAddress: "Mxf57713dff2d77817208081f60ad6d83bf26cd3c9" - адрес резервного аккаунта BIP
BIPReserveMnemonic: "..." - мнемоника для доступа к резервному аккаунту bitcoin
ethWalletPrivKey: "..." - приватный ключ от резервного аккаунта в ETH
ethWalletSeed: "..." - мнемоника для доступа к резервному аккаунта в ETH
ethAddress: "0xb016d2ab1c2018902c9da2714c8cf38c52a24f6a" - адрес аккаунта в ETH
minterbackurl: "http://localhost:8080" - адрес сервера, с которого разрешен достук к бэкенду
compareKey: - API ключ от сервиса cryptocompare 
bcoin_key: API ключ от доступа к локальной bcoin ноде
bcoin_admin_token: API ключ администратора от bcoin ноды

=== 2. Запуск ===
#3 запуск
npm start

что делает бэкенд:
1. HTTP REST API:
запускает api http сервер на localhost:3333, который отвечает:
GET /contracts - все контракты
POST /contracts - создать новый контракт

GET /contract/:contractID - информация о конкретном контракте
GET /rates - все курсы валют

{"BTC":{"market":396691.9491525424,"buy":376857.35169491527,"sell":416526.5466101695,"spread":0.05},"ETH":{"market":7724.576271186442,"buy":7338.34745762712,"sell":8110.805084745763,"spread":0.05},"USDT":{"market":42.37288135593221,"buy":40.2542372881356,"sell":44.49152542372882,"spread":0.05}}

GET /coins - список продаваемых монет

{"coins":["BIP","BTC","ETH"]}

GET /balances - балансы резевных счетов

{"BIP":185.803,"BTC":0,"ETH":"0.0","USDT":0}

GET /usd_price - курсы валют по отношению к доллару

{"btc_usd":9364.94,"bip_usd":0.0232,"eth_usd":182.27}

2. Websocket сервер:
запускается на порту 9090

отправляет следующие события:

* обновления курсов к доллару

{
    type: "usdPrices",
    btc_usd: _btc_usd,
    eth_usd: _eth_usd,
    bip_usd: _bip_usd
}

* обновления к курсу BIP:

{
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
}

* новый контракт:
{ type: "new_contract", contract: newContract }

* платеж по контракту получен:
{ type: "got_payment", contract: contract }

* контракт исполнен:
{
    type: "completed_contract",
    contract: contract
}
* произошла ошибки при исполнении контракта
{ type: "error_contract", contract }


=== 3. Структура и содержание сервера ===

------
server.js - запуск http сервера и ws сервера
app.js - код для http сервера
rates.js - получение курсов валют каждые X сек и отправка обновленного курса через ws
controllers/contractsController.js - работа с контрактом по обмену - создание, прием оплаты, исполнение
controllers/ratesController.js - расчет и выдача курсов валют
models/contractModel - модель хранения данных в бд монго
routes/index.js - пути для доступа

------
bcoin.js - методы для работы с bitcoin блокчейном:

* waitForPayment(wallet_id, input_address, callback)
ожидает входящий платеж, вызывает callback(value, trx_details) value - сколько получено (в сатошах),
trx_details - подробно о транзакции

* sendFromReserve(value, to, callback)
отправить из резервного аккаунта на адрес to
value - кол-во в сатошах
callback(result, details)
если транзакция прошла - result = true, details {hash: хэш транзакции, fee: стоимость транзакции в сат}

* getBalance(wallet_id, callback) - вызывает callback(balance_sat) и передает баланс в сатошах
* addBTCWallet(wallet_id, callback) - создает новый кошелек в bitcoin
* checkWallet(wallet_id, callback) - создает кошелек если его еще нет
* send(wallet_id, value_sat, to, rate, callback) - отправить битокины с кошелька wallet_id, на адрес to, value_sat - сколько отправить в сатошах, 
rate - комиссия на перевод

* sendFast(wallet_id, value_sat, to, callback) - отправить биткоины с средней стоимостью транзакции

-------
eth.js

* generateWallet - возвращает новый аккаунт { address: адрес, priv_key: приватный ключ }
* waitForPayment(address, callback) - вызывает callback когда баланс на указанном адресе будет положительной, вызывает callback(balance) 
с балансом по адресу 
* getBalance(address, callback) возвращает баланс в WEI
* sendFromReserve(amount, address, callback) - отправить из резервного счета ETH в кол-во amount на address. callback(result, details) 
result - true если успешно, false если неудачно. details будет содержать строку с ошибкой если неудачно 
* sendETH(fromWallet, toAddress, amountETHString, callback) - отправить ETH из кошелька на адрес
* sendAllToReserve(priv_key, callback) - отравить все что есть на счету на резервный счет

--------
minter.js

* generateWallet - возвращает новый аккаунт { address: адрес, priv_key: приватный ключ }
* waitForBIPPayment(address, callback) - ждет поступления денег в течение 60 минут на счет и вызывает callback(trx) где trx это детали транзакции или false если деньги не пришли
* getBIPBalance(address, callback) - вызывает callback(balance) с балансом по адресу
* sendFromReserve(amount, address, callback) - отправить с резервного счета
* sendAllToReserve(from, priv_key, callback) - отправить все со счета на резервный
* sendBIP(privateKey, to, value, callback) - отправить BIP

-------
controllers/contractController.js

getContract - возвращает один контракт
getAllContracts - возвращает все завершенные контракты
createContract - создает новый контракт
saveContract - сохраняет контракт в базе
startContract - запускает контракт, ждет оплату
completeContract - исполняет контракт (отправляет обещанные токены)