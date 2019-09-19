import mongoose from 'mongoose'; 
import contractModel from '../models/contractModel.js';

const minter = require('../minter.js')
const bcoin = require('../bcoin.js')
const rates = require('../rates.js')

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
        contract.state = "payment received"
        contract.fromAddress = trx.from
        contract.incomingTx = trx.hash
        saveContract(contract)
        completeContract(contract)    
    })
}

function saveContract(contract) {
    console.log('contract paid: ', contract)
    contractModel.updateOne({_id: contract._id}, contract,
        (err, contract) => {
            if (err) {
                console.log(err);
            }

            console.log("completed updating contract: ", contract);
        }
    );
}

// Исполнить контракт
function completeContract(contract) {
    if (contract.buy_coin == "BTC") {
        // отправляем BTC
        rates.getRates((btc_price, bip_price) => {
            contract.buy_amount = Math.trunc((contract.receivedCoins * bip_price / btc_price) * 100000000)
            console.log(`надо отправить ${contract.buy_amount}sat на адрес ${contract.toAddress}`)
            contract.state = "sending"
            saveContract(contract)
            bcoin.sendFromReserve(contract.buy_amount, contract.toAddress, (result, arg) => {
                if (result) {
                    console.log("successfuly sent bcoin: ", arg.hash)
                    contract.state = "completed"
                    contract.outgoingTx = arg.hash
                    contract.fee_sat = arg.fee
                } else {
                    console.log("error sending bcoin: ", arg)
                    contract.state = "error"
                }
                saveContract(contract)
            })
        })
    } else {
        console.log("не могу исполнить контракт, непотяно что покупать: ", contract.buy_coin)
    }
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