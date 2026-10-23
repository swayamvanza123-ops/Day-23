(() => {
  const PREFIX = "day23_stockly_";
  const sample = {
    products: [
      {id:"PR-1001",name:"Dell Inspiron Laptop",category:"Electronics",price:52000,cost:44500,stock:18,minStock:5,supplier:"Tech World",description:"Reliable laptop for office and study.",image:"",createdAt:new Date().toISOString()},
      {id:"PR-1002",name:"Wireless Mouse",category:"Accessories",price:799,cost:420,stock:42,minStock:10,supplier:"Gadget Supply",description:"Comfortable wireless optical mouse.",image:"",createdAt:new Date().toISOString()},
      {id:"PR-1003",name:"Mechanical Keyboard",category:"Accessories",price:2499,cost:1500,stock:8,minStock:10,supplier:"Gadget Supply",description:"Mechanical keyboard with tactile keys.",image:"",createdAt:new Date().toISOString()},
      {id:"PR-1004",name:"LED Monitor 24 inch",category:"Electronics",price:11999,cost:9200,stock:4,minStock:5,supplier:"Tech World",description:"Full HD monitor for productivity.",image:"",createdAt:new Date().toISOString()},
      {id:"PR-1005",name:"Office Chair",category:"Furniture",price:6499,cost:4100,stock:13,minStock:4,supplier:"Comfort Furnishers",description:"Ergonomic chair with adjustable height.",image:"",createdAt:new Date().toISOString()}
    ],
    categories: [
      {id:"CA-1",name:"Electronics",description:"Computers and electronic devices"},
      {id:"CA-2",name:"Accessories",description:"Computer and device accessories"},
      {id:"CA-3",name:"Furniture",description:"Office and workspace furniture"}
    ],
    suppliers: [
      {id:"SU-1",name:"Aarav Patel",company:"Tech World",phone:"9876543210",email:"sales@techworld.example",address:"Ahmedabad, Gujarat"},
      {id:"SU-2",name:"Riya Shah",company:"Gadget Supply",phone:"9876501234",email:"hello@gadgets.example",address:"Surat, Gujarat"},
      {id:"SU-3",name:"Karan Mehta",company:"Comfort Furnishers",phone:"9898012345",email:"orders@comfort.example",address:"Vadodara, Gujarat"}
    ],
    sales: [],
    stockHistory: [],
    batches: [
      {id:"BA-1001",productId:"PR-1001",batchNo:"LAP-2026-A",manufacturingDate:"2026-01-10",expiryDate:"2029-01-10",quantity:18,purchasePrice:44500,createdAt:new Date().toISOString()},
      {id:"BA-1002",productId:"PR-1003",batchNo:"KEY-2026-B",manufacturingDate:"2026-03-01",expiryDate:"2028-03-01",quantity:8,purchasePrice:1500,createdAt:new Date().toISOString()}
    ]
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  window.Store = {
    get(key) {
      try {
        const raw = localStorage.getItem(PREFIX + key);
        if (raw !== null) return JSON.parse(raw);
      } catch (e) { console.warn("Could not read saved data", e); }
      return clone(sample[key] || []);
    },
    set(key, value) {
      try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
      catch (e) { alert("Could not save data. Your browser storage may be full."); return false; }
    },
    id(prefix) { return prefix + "-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,5).toUpperCase(); },
    money(value) { return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(value)||0); },
    date(value) { if(!value) return "—"; const d=new Date(value+"T00:00:00"); return Number.isNaN(d.getTime())?value:d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); },
    escape(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); },
    init() { Object.keys(sample).forEach(k=>{if(localStorage.getItem(PREFIX+k)===null)this.set(k,sample[k]);}); }
  };
})();