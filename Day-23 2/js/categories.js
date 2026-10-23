window.Categories = {
  all(){return Store.get("categories");},
  upsert(data){const a=this.all();if(data.id){const i=a.findIndex(x=>x.id===data.id);if(i<0)throw Error("Category not found.");a[i]={...a[i],...data};}else{if(a.some(x=>x.name.toLowerCase()===data.name.toLowerCase()))throw Error("That category already exists.");a.unshift({...data,id:Store.id("CA")});}Store.set("categories",a);},
  remove(id){const c=this.all().find(x=>x.id===id);if(c&&Products.all().some(p=>p.category===c.name))throw Error("This category is assigned to a product. Move those products first.");Store.set("categories",this.all().filter(x=>x.id!==id));}
};