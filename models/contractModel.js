// Контракт для обмена

import mongoose, { Schema } from "mongoose";

const ContractScheme = new Schema({
  // какой токен клиент хочет продать
  sell_coin: {
    type: String,
    required: ""
  },
  // какой токен клиент хочет купить
  buy_coin: {
    type: String,
    required: ""
  },
  // начало сделки
  start_time: {
    type: Date,
    default: new Date()
  },
  // момент завершения сделки
  end_time: {
    type: Date,
    default: null
  },
  // сколько клиент хочет продать
  sell_amount: {
    type: Number,
    required: ""
  },
  // сколько клиент должен бы купить согласно заявке
  buy_amount: {
    type: Number
  },
  // сколько клиент купит согласно расчету при приеме заявки
  calc_amount: {
    type: Number
  },
  // сколько реально будет выплачено клиенту после получения оплаты
  send_amount: {
    type: Number
  },
  // с какого адреса пришел платеж (не всегда будет указан)
  fromAddress: {
    type: String
  },
  // на какой адрес должен придти платеж (транзитный аккаунт)
  receivingAddress: {
    type: String
  },
  // приватный ключ от транзитного аккаунта
  receivingPrivKey: {
    type: String,
    default: ""
  },
  // кол-во полученных коинов на обмен
  receivedCoins: {
    type: Number
  },
  // адрес для отправки купленных токенов
  toAddress: {
    type: String
  },
  // хэш транзакции с входящим платежом
  incomingTx: {
    type: String
  },
  // хэш транзакции с исходящим платежом
  outgoingTx: {
    type: String
  },
  // ссылка на обозреватель с исходящей транзакцией
  outgoingTxLink: {
    type: String
  },
  // состояние контракта
  state: {
    type: String,
    default: "new"
  },
  // хэш контракта
  hash: {
    type: String
  },
  // стоимость исходящей транзакции в токенах
  fee_sat: {
    type: Number
  },
  // стоимость исходящей транзакции по курсу в usd
  fee_usd: {
    type: Number
  },
  // сообщение об ошибке
  message: {
    type: String
  },
  // сколько buy_coin даем за один sell_coin
  price: {
    type: Number
  }
});

export default mongoose.model("Contract", ContractScheme);
