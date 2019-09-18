import mongoose from 'mongoose'; 
import contract from '../models/contractModel.js';

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
    const newContract = new note(req.body);

    newContract.save((err, contract) => {
        if (err) {
            res.send(err);
        }

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