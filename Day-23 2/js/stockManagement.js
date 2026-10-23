window.StockManagement = {
  all(){return Store.get("stockHistory");},
  move(data){
    const qty=Number(data.quantity);if(!Number.isInteger(qty)||qty<1)throw Error("Enter a whole-number quantity greater than zero.");
    Products.adjust(data.productId,data.type==="Stock In"?qty:-qty,data.reason,data.type);
  }
};