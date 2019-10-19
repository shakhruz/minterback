import contract from "../controllers/contractController";
import rates from "../controllers/ratesController";

export default app => {
  app
    .route("/contracts")
    .get(contract.getAllContracts)
    .post(contract.createContract);

  app.route("/contract/:contractId").get(contract.getContract);
  // .put(contract.updateContract)
  // .delete(contract.deleteContract);

  app.route("/rates").get(rates.getAllRates);

  app.route("/coins").get(rates.getAllCoins);
  app.route("/balances").get(rates.getReserveBalances);

  app.route("/usd_price").get(rates.usd_price);
};
