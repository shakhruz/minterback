import mongoose from 'mongoose'; 
import contractModel from '../models/contractModel.js';

const minter = require('../minter.js')

exports.getContract = (req, res) => {
    contractModel.findById(req.params.contractId, (err, contract) => {
        if (err) {
            res.send(err);
        }

        res.json(contract);
    });
};

exports.getAllContracts = (req, res) => {
    contractModel.find({}, (err, contracts) => {
        if (err) {
            res.send(err);
        }

        res.json(contracts);
    });
};

exports.createContract = (req, res) => {
    console.log("got req: ", req)
    const newContract = new contractModel(req.body);
    console.log("new contract: ", newContract)

    if (newContract.sell_coin == "BIP") {
        console.log("generate BIP address to receive coins")
        const wallet = minter.generateWallet()
        newContract.receivingAddress = wallet.address
        newContract.receivingPrivKey = wallet.priv_key
        newContract.state = "waiting for payment"
    }

    newContract.save((err, contract) => {
        if (err) {
            res.send(err);
        }

        console.log("returning new contract: ", contract)

        contract.receivingPrivKey = null // прячем ключ
        res.json(contract);
        processContract(contract)
    });
};

function processContract(contract) {
    minter.waitForBIPPayment(contract.receivingAddress, (trx) => {
        console.log("got BIP payment: ", trx)
        contract.receivedCoins = trx.data.value * 1000
        // TODO сделать собственный расчет получаемых битков и текущего курса
        // this.btc_to_send = this.bip_received / this.bip_btc_buy_price * 100000000 
        contract.state = "payment received"
        contract.fromAddress = trx.from
        contractPaid(contract)
    })
}

function contractPaid(contract) {
    mongoose.set('useFindAndModify', false);
    console.log('contract paid: ', contract)
    contractModel.findOneAndUpdate({
        _id: contract.contractId
    }, contract,
        (err, contract) => {
            if (err) {
                console.log(err);
            }

            console.log("completed updating contract: ", contract);
        }
    );
}

exports.updateContract = (req, res) => {
    contractModel.findOneAndUpdate({
        _id: req.params.contractId
    }, req.body,
        (err, contract) => {
            if (err) {
                res.send(err);
            }

            res.json(contract);
        });
};

exports.deleteContract = (req, res) => {
    contractModel.remove({
        _id: req.params.contractId
    }, (err) => {
        if (err) {
            res.send(err);
        }

        res.json({
            message: `contract ${req.params.contractId} successfully deleted`
        });
    });
};