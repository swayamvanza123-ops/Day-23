window.Sales = {
  all(){return Store.get("sales");},
  create(data){
    const p=Products.find(data.productId);if(!p)throw Error("Choose a valid product.");
    const qty=Number(data.quantity);if(!Number.isInteger(qty)||qty<1)throw Error("Quantity must be a whole number greater than zero.");
    if(qty>Number(p.stock))throw Error("Insufficient stock. Available quantity: "+p.stock);
    const discount=Number(data.discount)||0,subtotal=Number(p.price)*qty;
    if(discount<0||discount>subtotal)throw Error("Discount must be between 0 and the subtotal.");
    Products.adjust(p.id,-qty,"Sale to "+data.customer,"Sale");
    const sale={id:Store.id("INV"),invoice: "INV-"+Date.now().toString().slice(-7),productId:p.id,productName:p.name,customer:data.customer,phone:data.phone||"",quantity:qty,price:Number(p.price),subtotal,discount,total:subtotal-discount,date:data.date||new Date().toISOString().slice(0,10),createdAt:new Date().toISOString()};
    const a=this.all();a.unshift(sale);Store.set("sales",a);return sale;
  }
};