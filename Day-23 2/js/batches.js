window.Batches = {
  all(){return Store.get("batches");},
  upsert(data){const a=this.all();if(a.some(b=>b.batchNo.toLowerCase()===data.batchNo.toLowerCase()&&b.id!==data.id))throw Error("Batch number already exists.");if(data.expiryDate&&data.manufacturingDate&&data.expiryDate<data.manufacturingDate)throw Error("Expiry date must be after manufacturing date.");if(data.id){const i=a.findIndex(x=>x.id===data.id);if(i<0)throw Error("Batch not found.");a[i]={...a[i],...data};}else a.unshift({...data,id:Store.id("BA"),createdAt:new Date().toISOString()});Store.set("batches",a);},
  remove(id){Store.set("batches",this.all().filter(b=>b.id!==id));},
  expiryStatus(b){if(!b.expiryDate)return "No expiry";const days=(new Date(b.expiryDate+"T00:00:00")-new Date())/86400000;if(days<0)return "Expired";if(days<60)return "Expiring soon";return "Valid";}
};