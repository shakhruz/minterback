// Контракт для обмена

import mongoose, { Schema } from "mongoose";

const ContractScheme = new Schema({
  sell_coin: {
    type: String,
    required: ""
  },
  buy_coin: {
    type: String
  },
  date: {
    type: Date,
    default: new Date()
  },
  sell_amount: {
    type: Number,
    required: ""
  },
  buy_amount: {
    type: Number,
    required: ""
  },
  send_amount: {
    type: Number
  },
  fromAddress: {
    type: String
  },
  receivingAddress: {
    type: String
  },
  receivingPrivKey: {
    type: String
  },
  receivedCoins: {
    type: Number
  },
  toAddress: {
    type: String
  },
  incomingTx: {
    type: String
  },
  outgoingTx: {
    type: String
  },
  outgoingTxLink: {
    type: String
  },
  state: {
    type: String,
    default: "new"
  },
  hash: {
    type: String
  },
  fee_sat: {
    type: Number
  },
  fee_usd: {
    type: Number
  },
  rate: {
    type: Number
  },
  message: {
    type: String
  },
  rates: {
    btc_usd: {
      type: Number
    },
    eth_usd: {
      type: Number
    },
    bip_usd: {
      type: Number
    }
  },
  spreads: {
    btc_spread: { type: Number },
    eth_spread: { type: Number },
  },
  price: {
    type: Number
  }
});

export default mongoose.model("Contract", ContractScheme);
