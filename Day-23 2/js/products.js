window.Products = {
  all(){return Store.get("products");},
  save(items){Store.set("products",items);},
  find(id){return this.all().find(p=>p.id===id);},
  upsert(data){
    const items=this.all();
    if(data.id){const i=items.findIndex(p=>p.id===data.id);if(i<0)throw Error("Product not found.");items[i]={...items[i],...data};}
    else items.unshift({...data,id:Store.id("PR"),createdAt:new Date().toISOString()});
    this.save(items);
  },
  remove(id){
    if(Store.get("sales").some(s=>s.productId===id)) throw Error("This product has sales history and cannot be deleted.");
    this.save(this.all().filter(p=>p.id!==id));
  },
  status(p){return Number(p.stock)<=0?"Out of stock":Number(p.stock)<=Number(p.minStock||5)?"Low stock":"In stock";},
  adjust(id,delta,reason,type="Adjustment"){
    const items=this.all(),p=items.find(x=>x.id===id);
    if(!p)throw Error("Product not found.");
    const before=Number(p.stock),qty=Math.abs(Number(delta));
    const after=before+Number(delta);
    if(!Number.isFinite(qty)||qty<=0)throw Error("Quantity must be greater than zero.");
    if(after<0)throw Error("Not enough stock available.");
    p.stock=after;this.save(items);
    const history=Store.get("stockHistory");
    history.unshift({id:Store.id("SH"),productId:id,productName:p.name,type,quantity:qty,previous:before,updated:after,reason:reason||type,date:new Date().toISOString()});
    Store.set("stockHistory",history);
  }
};