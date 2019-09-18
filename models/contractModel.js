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
        type: Double,
        required: ""
    },
    buy_amount: {
        type: Double,
        required: ""
    },
    fromAddress: {
        type: String,
        required: ""
    },
    toAddress: {
        type: String,
        required: ""
    },
    incomingTx: {
        type: String,
        required: ""
    },
    outgoingTx: {
        type: String,
        required: ""
    },
    state: {
        type: String,
        default: "new"
    },
    hash: {
        type: String,
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
