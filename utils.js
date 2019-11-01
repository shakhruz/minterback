// Возвращает форматированное кол-во токенов
function formatAmount(amount, coin) {
  if (!amount) return 0;
  switch (coin) {
    case "BIP":
      amount = Number(Math.trunc(amount * 10000) / 10000);
      break;
    case "BTC":
      amount = Number(amount.toFixed(8));
      break;
    case "USDT":
      amount = Number(amount.toFixed(4));
      break;
    case "USD":
      amount = Number(amount.toFixed(2));
      break;
    case "ETH":
      amount = Number(amount.toFixed(6));
      break;
    default:
      amount = Number(amount.toFixed(2));
  }
  return amount;
}

module.exports = {
  formatAmount
};
