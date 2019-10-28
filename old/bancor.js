let total_supply = 0,
  reserved_token = 0,
  price = 0,
  crr = 0,
  transaction_price = 0;

function out_data() {
  console.log(
    `total_supply: ${total_supply}, reserved_token: ${reserved_token}, price: ${price}`
  );
}

function init(initial_reserve, rate, _crr) {
  total_supply = initial_reserve * rate;
  reserved_token = total_supply * _crr;
  price = reserved_token / (total_supply * _crr);
  crr = _crr;
  transaction_price = 0;
}

function issue_by_reserve_token(amount) {
  let smart_token_amount =
    total_supply * ((1 + amount / reserved_token) ** crr - 1);
  reserved_token = reserved_token + amount;
  total_supply = total_supply + smart_token_amount;
  price = reserved_token / (total_supply * crr);
  return smart_token_amount;
}

function destroy_by_reserve_token(amount) {
  smart_token_amount =
    reserved_token * (1 - (1 - amount / total_supply) ** (1 / crr));
  reserved_token = reserved_token - smart_token_amount;
  total_supply = total_supply - amount;
  price = reserved_token / (total_supply * crr);
  return smart_token_amount;
}

function issue_by_smart_token(amount) {
  //   transaction_price =
  //     reserved_token * ((amount / total_supply + 1) ** (1 / crr) - 1);
  //   console.log("tr price: ", transaction_price);
  //   total_supply = total_supply + amount;
  //   reserved_token = reserved_token + transaction_price;
  //   price = reserved_token / (total_supply * crr);
  //   return transaction_price;

  // transaction_price = @reserved_token * ((((amount / @total_supply) + 1) ** (1 /@crr)) - 1)
  let a = amount / total_supply;
  a = a + 1;
  let b = 1 / crr;
  let c = a ** b;
  transaction_price = reserved_token * (c - 1);
  console.log("a: ", a, "c: ", c - 1, " b: ", b);
  console.log("tr price: ", transaction_price);
  total_supply = total_supply + amount;
  reserved_token = reserved_token + transaction_price;
  price = reserved_token / (total_supply * crr);
  return transaction_price;
}

function destroy_by_smart_token(amount) {
  //   transaction_price =
  //     reserved_token * (1 - (1 - amount / total_supply) ** (1 / crr));
  //   total_supply = total_supply - amount;
  //   reserved_token = reserved_token - transaction_price;
  //   price = reserved_token / (total_supply * crr);
  //     return transaction_price;
  let a = amount / total_supply;
  transaction_price = reserved_token * (1 - (1 - a) ** (1 / crr));
  total_supply = total_supply - amount;
  reserved_token = reserved_token - transaction_price;
  price = reserved_token / (total_supply * crr);
  transaction_price;
}

// issue / destroy by reserve token
console.log("issue / destroy by reserve token");
init(300000, 1, 0.2);
out_data();
console.log("issue by reserve token: 300", issue_by_reserve_token(300));
out_data();
console.log("issue by reserve token: 700", issue_by_reserve_token(700));
out_data();
console.log("issue by reserve token: 1302", destroy_by_reserve_token(1302));
out_data();
console.log("issue by reserve token: 100", issue_by_reserve_token(100));
out_data();

// issue / destroy by smart token
console.log("\nissue / destroy by smart token");
init(300000, 1, 0.2);
out_data();
console.log("issue by smart token: 50", issue_by_smart_token(50));
out_data();
console.log("issue by smart token: 100", issue_by_smart_token(100));
out_data();
console.log("issue by smart token: 100", destroy_by_smart_token(100));
out_data();
console.log("issue by smart token: 50", destroy_by_smart_token(50));
out_data();
