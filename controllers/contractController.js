import contractModel from '../models/contractModel.js';

const minter = require('../minter.js')
const bcoin = require('../bcoin.js')
const rates = require('../rates.js')
const data = require('../data.js')

exports.getContract = (req, res) => {
    contractModel.findById(req.params.contractId, (err, contract) => {
        if (err) {
            res.send(err);
        }

        contract.receivingPrivKey = ''
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
        console.log("wallet: ", wallet)
        newContract.receivingAddress = wallet.address
        newContract.receivingPrivKey = wallet.priv_key
        newContract.state = "waiting for payment"

        newContract.save((err, contract) => {
            if (err) {
                res.send(err);
            }
    
            console.log("returning new contract: ", contract)
    
            contract.receivingPrivKey = null // прячем ключ
            newContract.receivingPrivKey = ''
            res.json(contract);
            processContract(contract)
        });
    } else {
        if (newContract.sell_coin == "BTC") {
            console.log("generating new BTC address to receive payment");
            bcoin.generateReserveAddress((input_address)=>{
                console.log("new address: ", input_address);
                newContract.receivingAddress = input_address
                newContract.receivingPrivKey = ''
                newContract.state = "waiting for payment"

                newContract.save((err, contract) => {
                    if (err) {
                        res.send(err);
                    }
            
                    console.log("returning new contract: ", contract)
            
                    contract.receivingPrivKey = null // прячем ключ
                    newContract.receivingPrivKey = ''
                    res.json(contract);
                    processContract(contract)
                });                
            })
        }
    }


};

function processContract(contract) {
    if (contract.sell_coin == "BIP") {
        minter.waitForBIPPayment(contract.receivingAddress, (trx) => {
            console.log("got BIP payment: ", trx)
            contract.receivedCoins = trx.data.value * 2000
            contract.state = "payment received"
            contract.fromAddress = trx.from
            contract.incomingTx = trx.hash
            saveContract(contract)
            completeContract(contract)    
        })    
    } else {
        if (contract.sell_coin == "BTC") {
            console.log("now wait for BTC payment to address ", contract.receivingAddress)
            bcoin.waitForPayment(data.BTCReserveAccountName, contract.receivingAddress, (value, details)=>{
                console.log("got BTC payment: ", details, "value: ", value)
                contract.state = "payment received"
                contract.receivedCoins = value
                contract.fromAddress = details.inputs[0].address
                contract.incomingTx = details.hash
                saveContract(contract)
                completeContract(contract)        
            })
        } else {
            console.log("принимаем только BIP, ", contract.sell_coin, " не умеем")
        }
    }
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
    console.log("complete contract...")
    if (contract.buy_coin == "BTC") {
        // отправляем BTC
        rates.getRates((btc_price, bip_price) => {
            // contract.send_amount = Math.trunc((contract.receivedCoins * bip_price / btc_price))
            // console.log("send_amount без спрэда: ", contract.send_amount)
            // console.log("спрэд: ", (contract.send_amount * rates.spread))
            // contract.send_amount  = Math.trunc(contract.send_amount - (contract.send_amount * rates.spread))
            // console.log("buy amount с вычетом спрэда: ", contract.send_amount)
            btc_price = btc_price * (1/bip_price)

            console.log("btc price: ", btc_price)
            const btc_sell = btc_price + btc_price * rates.spread
            console.log("btc buy: ", btc_sell)
            
            contract.send_amount = Math.trunc(contract.receivedCoins / btc_sell * 100000000)
            
            console.log(`надо отправить ${contract.send_amount}sat на адрес ${contract.toAddress}`)
            contract.state = "sending"
            saveContract(contract)
            bcoin.sendFromReserve(contract.send_amount, contract.toAddress, (result, arg) => {
                if (result) {
                    console.log("successfuly sent bcoin: ", arg.hash)
                    contract.state = "completed"
                    contract.outgoingTx = arg.hash
                    contract.fee_sat = arg.fee
                } else {
                    console.log("error sending bcoin: ", arg)
                    contract.state = "error"
                    contract.message = arg
                }
                saveContract(contract)
            })
        })
    } else {
        if (contract.buy_coin == "BIP") {
            console.log("sending BIP")
            rates.getRates((btc_price, bip_price) => {
                btc_price = btc_price * (1/bip_price)

                console.log("btc price: ", btc_price)
                const btc_buy = btc_price - btc_price * rates.spread
                console.log("btc buy: ", btc_buy)
                
                contract.send_amount = Math.trunc(contract.receivedCoins * btc_buy / 100000000)
                console.log("send_amount: ", contract.send_amount)
                console.log(`надо отправить ${contract.send_amount} BIP на адрес ${contract.toAddress}`)
                contract.state = "sending"
                saveContract(contract)
                minter.sendFromReserve(contract.send_amount, contract.toAddress, (result, arg) => {
                    if (result) {
                        console.log("successfuly sent BIP: ", arg)
                        contract.state = "completed"
                        contract.outgoingTx = arg
                        contract.fee_sat = 0.01
                    } else {
                        console.log("error sending bcoin: ", arg)
                        contract.state = "error"
                        contract.message = arg
                    }
                    saveContract(contract)
                })
            })    
        }
        console.log("не могу исполнить контракт, непонятно что покупать: ", contract.buy_coin)
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