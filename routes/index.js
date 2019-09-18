import contract from '../controllers/contractController';

export default (app) => {
    app.route('/contracts')
        .get(contract.getAllContracts)
        .post(contract.createContract);

    app.route('/contract/:contractId')
        .get(contract.getContract)
        .put(contract.updateContract)
        .delete(contract.deleteContract);
};