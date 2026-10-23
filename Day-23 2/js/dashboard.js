window.Dashboard = {
  render(){
    const products=Products.all(),suppliers=Suppliers.all(),sales=Sales.all(),batches=Batches.all();
    const stock=products.reduce((n,p)=>n+Number(p.stock||0),0);
    const value=products.reduce((n,p)=>n+Number(p.price||0)*Number(p.stock||0),0);
    const low=products.filter(p=>Number(p.stock)<=Number(p.minStock||5));
    const month=new Date().toISOString().slice(0,7);
    const revenue=sales.filter(s=>s.date.slice(0,7)===month).reduce((n,s)=>n+s.total,0);
    const recent=products.slice(0,5);
    return `<div class="page-heading"><div><span class="eyebrow">OVERVIEW</span><h1>Good to see you, ${Store.escape(Auth.current()?.name?.split(" ")[0]||"there")} 👋</h1><p>Here is what's happening with your inventory today.</p></div><button class="btn btn-primary" data-action="add-product">＋ Add product</button></div>
    <div class="stats-grid">
      ${stat("Total products",products.length,"▣","purple","Unique items in your catalogue")}
      ${stat("Total stock units",stock,"▤","green","Units currently on hand")}
      ${stat("Inventory value",Store.money(value),"₹","purple","Retail value of current stock")}
      ${stat("Low-stock items",low.length,"!","orange","At or below minimum quantity")}
    </div>
    <div class="content-grid">
      <section class="panel"><div class="panel-head"><div><h3>Recent products</h3><p>Your latest inventory overview</p></div><button class="text-button" data-page="products">View all →</button></div>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Stock</th><th>Price</th><th>Status</th></tr></thead><tbody>${recent.map(p=>`<tr><td>${productCell(p)}</td><td>${p.stock}</td><td>${Store.money(p.price)}</td><td>${statusPill(Products.status(p))}</td></tr>`).join("")||emptyRow(4,"No products yet")}</tbody></table></div></section>
      <section class="panel"><div class="panel-head"><div><h3>Stock attention</h3><p>Items that may need a reorder</p></div><span class="pill orange">${low.length} items</span></div><div class="panel-body">${low.length?`<div class="mini-list">${low.slice(0,6).map(p=>`<div class="mini-row"><div class="stat-icon orange">!</div><div class="mini-row-main"><strong>${Store.escape(p.name)}</strong><small>${Store.escape(p.category)} · minimum ${p.minStock||5}</small></div><span class="pill ${p.stock<=0?"red":"orange"}">${p.stock} left</span></div>`).join("")}</div>`:`<div class="empty-state"><strong>Everything looks healthy</strong>No low-stock products right now.</div>`}</div></section>
    </div>
    <div class="stats-grid secondary-stats">
      ${stat("Suppliers",suppliers.length,"♧","green","Supplier contacts saved")}
      ${stat("Sales this month",Store.money(revenue),"↗","purple","After discounts")}
      ${stat("Sales invoices",sales.length,"▤","orange","All recorded sales")}
      ${stat("Batch records",batches.length,"▦","green","Tracked product batches")}
    </div>`;
  }
};
function stat(label,value,icon,color,foot){return `<div class="stat-card"><div class="stat-top"><span class="stat-label">${label}</span><span class="stat-icon ${color}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-foot">${foot}</div></div>`;}
function productCell(p){return `<div class="product-cell">${p.image?`<img class="product-thumb" src="${p.image}" alt="">`:`<div class="product-thumb product-thumb-placeholder">▣</div>`}<div><strong>${Store.escape(p.name)}</strong><small>${Store.escape(p.id)} · ${Store.escape(p.category)}</small></div></div>`;}
function statusPill(status){const c=status==="In stock"?"green":status==="Low stock"?"orange":"red";return `<span class="pill ${c}">${status}</span>`;}
function emptyRow(n,msg){return `<tr><td colspan="${n}"><div class="empty-state"><strong>${msg}</strong>Use the action above to add your first record.</div></td></tr>`;}