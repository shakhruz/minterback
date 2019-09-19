import mongoose, {
    Schema
} from 'mongoose';

const ContractScheme = new Schema({
    sell_coin: {
        type: String,
        required: ""
    },
    buy_coin: {
        type: String,
        required: ""
    },
    date: {
        type: Date,
        default: new Date
    },
    sell_amount: {
        type: Number,
        required: ""
    },
    buy_amount: {
        type: Number,
        required: ""
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
    }
});

export default mongoose.model('Contract', ContractScheme);
