import mongoose from 'mongoose'; 
import contract from '../models/contractModel.js';

const minter = require('../minter.js')

exports.getContract = (req, res) => {
    contract.findById(req.params.contractId, (err, contract) => {
        if (err) {
            res.send(err);
        }

        res.json(contract);
    });
};

exports.getAllContracts = (req, res) => {
    contract.find({}, (err, contracts) => {
        if (err) {
            res.send(err);
        }

        res.json(contracts);
    });
};

exports.createContract = (req, res) => {
    console.log("got req: ", req)
    const newContract = new contract(req.body);
    console.log("new contract: ", newContract)

    // if (newContract.sell_coin == "BIP") {
    //     console.log("generate BIP address to receive coins")
    //     const wallet = minter.generateWallet()
    //     newContract.receivingAddress = wallet.address
    //     newContract.receivingPrivKey = receivingPrivKey
    // }

    newContract.save((err, contract) => {
        if (err) {
            res.send(err);
        }

        console.log("returning new contract: ", contract)

        res.json(contract);
    });
};

exports.updateContract = (req, res) => {
    note.findOneAndUpdate({
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
    contract.remove({
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