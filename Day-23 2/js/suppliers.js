window.Suppliers = {
  all(){return Store.get("suppliers");},
  upsert(data){const a=this.all();if(data.id){const i=a.findIndex(x=>x.id===data.id);if(i<0)throw Error("Supplier not found.");a[i]={...a[i],...data};}else{if(a.some(x=>x.email.toLowerCase()===data.email.toLowerCase()))throw Error("That email is already registered.");a.unshift({...data,id:Store.id("SU")});}Store.set("suppliers",a);},
  remove(id){const s=this.all().find(x=>x.id===id);if(s&&Products.all().some(p=>p.supplier===s.company))throw Error("This supplier is linked to a product. Change the product supplier first.");Store.set("suppliers",this.all().filter(x=>x.id!==id));}
};