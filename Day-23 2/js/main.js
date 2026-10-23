
(() => {
    "use strict";

    const $ = (selector) => document.querySelector(selector);

    const pageNames = {
        dashboard: "Dashboard",
        products: "Products",
        categories: "Categories",
        suppliers: "Suppliers",
        sales: "Sales",
        stock: "Stock History",
        batches: "Product Batches",
        activity: "Activity Log"
    };

    let currentPage = "dashboard";
    let searchTerm = "";
    let filterValue = "";

    function notify(message, type = "success") {
        const area = $("#noticeArea");

        if (!area) {
            alert(message);
            return;
        }

        const notice = document.createElement("div");
        notice.className = `notice ${type}`;
        notice.textContent = message;
        area.appendChild(notice);

        setTimeout(() => notice.remove(), 3000);
    }

    function canEdit() {
        return window.Auth?.current()?.role === "Admin";
    }

    function safe(value) {
        return window.Store?.escape(String(value ?? "")) ??
            String(value ?? "").replace(/[&<>"']/g, char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[char]);
    }

    function money(value) {
        if (window.Store?.money) {
            return Store.money(Number(value) || 0);
        }

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    function heading(eyebrow, title, description, action = "") {
        return `
            <div class="page-heading">
                <div>
                    <span class="eyebrow">${safe(eyebrow)}</span>
                    <h1>${safe(title)}</h1>
                    <p>${safe(description)}</p>
                </div>
                ${action}
            </div>
        `;
    }

    function button(label, action, cls = "btn btn-primary") {
        return `
            <button type="button" class="${cls}"
                data-action="${safe(action)}">
                ${safe(label)}
            </button>
        `;
    }

    function toolbar(placeholder, extra = "") {
        return `
            <div class="toolbar">
                <div class="search-box">
                    <span class="search-symbol">⌕</span>
                    <input id="pageSearch"
                        value="${safe(searchTerm)}"
                        placeholder="${safe(placeholder)}"
                        aria-label="Search">
                </div>
                ${extra}
            </div>
        `;
    }

    function emptyRow(columns, message) {
        return `
            <tr>
                <td colspan="${columns}" class="empty-state">
                    ${safe(message)}
                </td>
            </tr>
        `;
    }

    function stat(label, value, symbol, color, description) {
        return `
            <div class="stat-card">
                <div class="stat-top">
                    <span class="stat-label">${safe(label)}</span>
                    <span class="stat-icon ${safe(color)}">
                        ${safe(symbol)}
                    </span>
                </div>
                <div class="stat-value">${value}</div>
                <div class="stat-foot">${safe(description)}</div>
            </div>
        `;
    }

    function statusPill(status) {
        const color = status === "In Stock" || status === "Valid"
            ? "green"
            : status === "Out of Stock" || status === "Expired"
                ? "red"
                : "orange";

        return `<span class="pill ${color}">${safe(status)}</span>`;
    }

    function productCell(product) {
        const image = product.image
            ? `<img src="${safe(product.image)}" alt=""
                    class="product-thumb">`
            : `<span class="product-thumb placeholder">▣</span>`;

        return `
            <div class="product-cell">
                ${image}
                <div>
                    <strong>${safe(product.name)}</strong>
                    <small>${safe(product.category)}</small>
                </div>
            </div>
        `;
    }

    function render() {
        const auth = window.Auth;

        if (!auth?.current()) {
            location.replace("login.html");
            return;
        }

        const user = auth.current();

        $("#userName").textContent = user.name || "User";
        $("#userRole").textContent =
            user.role === "Admin" ? "Administrator" : "Staff";
        $("#userAvatar").textContent =
            (user.name || "U").charAt(0).toUpperCase();

        $("#todayLabel").textContent =
            new Date().toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short"
            });

        $("#pageCrumb").textContent =
            pageNames[currentPage] || "Dashboard";

        document.querySelectorAll(".nav-link[data-page]")
            .forEach(link => {
                link.classList.toggle(
                    "active",
                    link.dataset.page === currentPage
                );

                link.classList.toggle(
                    "hide",
                    !auth.allowed(currentPage) ||
                    !auth.allowed(link.dataset.page)
                );
            });

        const renderers = {
            dashboard: () => Dashboard.render(),
            products: renderProducts,
            categories: renderCategories,
            suppliers: renderSuppliers,
            sales: renderSales,
            stock: renderStock,
            batches: renderBatches,
            activity: renderActivity
        };

        const content = $("#pageContent");

        if (!content) {
            console.error("Missing #pageContent in index.html");
            return;
        }

        if (!auth.allowed(currentPage)) {
            content.innerHTML = `
                <section class="panel">
                    <h2>Access restricted</h2>
                    <p>You do not have permission to view this page.</p>
                    ${button("Back to Dashboard", "go-dashboard")}
                </section>
            `;
            return;
        }

        try {
            const renderer = renderers[currentPage];

            if (!renderer) {
                content.innerHTML = "<p>Page not found.</p>";
                return;
            }

            content.innerHTML = renderer();

            const search = $("#pageSearch");

            if (search) {
                search.addEventListener("input", event => {
                    const position = event.target.selectionStart;
                    searchTerm = event.target.value;
                    render();

                    const next = $("#pageSearch");

                    if (next) {
                        next.focus();
                        next.setSelectionRange(position, position);
                    }
                });
            }
        } catch (error) {
            console.error("Page rendering error:", error);

            content.innerHTML = `
                <section class="panel">
                    <h2>Unable to load this page</h2>
                    <p>Check the browser console and required JavaScript files.</p>
                    ${button("Try Again", "refresh-page")}
                </section>
            `;
        }
    }

    function renderProducts() {
        const rows = Products.all().filter(product =>
            [
                product.name,
                product.category,
                product.supplier,
                product.id
            ].join(" ").toLowerCase().includes(searchTerm.toLowerCase())
        );

        const action = canEdit()
            ? button("＋ Add Product", "add-product")
            : "";

        return heading(
            "CATALOGUE",
            "Products",
            "Manage products, prices and inventory.",
            action
        ) + `
            <section class="panel">
                <div class="panel-head">
                    <h3>Product Inventory</h3>
                    <span class="pill purple">${rows.length} products</span>
                </div>
                <div class="panel-body">
                    ${toolbar("Search products...")}
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Supplier</th>
                                    <th>Price</th>
                                    <th>Cost</th>
                                    <th>Stock</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(product => `
                                    <tr>
                                        <td>${productCell(product)}</td>
                                        <td>${safe(product.supplier || "—")}</td>
                                        <td>${money(product.price)}</td>
                                        <td>${money(product.cost)}</td>
                                        <td>${Number(product.stock) || 0}</td>
                                        <td>${statusPill(Products.status(product))}</td>
                                        <td>
                                            ${canEdit() ? `
                                                <div class="actions">
                                                    <button class="action-btn"
                                                        data-action="edit-product"
                                                        data-id="${safe(product.id)}">
                                                        Edit
                                                    </button>
                                                    <button class="action-btn"
                                                        data-action="delete-product"
                                                        data-id="${safe(product.id)}">
                                                        Delete
                                                    </button>
                                                </div>
                                            ` : "View only"}
                                        </td>
                                    </tr>
                                `).join("") || emptyRow(7, "No products found")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    function renderCategories() {
        const rows = Categories.all().filter(category =>
            `${category.name} ${category.description || ""}`
                .toLowerCase().includes(searchTerm.toLowerCase())
        );

        return heading(
            "ORGANIZATION",
            "Categories",
            "Organize your inventory by category.",
            canEdit() ? button("＋ Add Category", "add-category") : ""
        ) + `
            <section class="panel">
                <div class="panel-head">
                    <h3>All Categories</h3>
                    <span class="pill purple">${rows.length} categories</span>
                </div>
                <div class="panel-body">
                    ${toolbar("Search categories...")}
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Description</th>
                                    <th>Products</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(category => `
                                    <tr>
                                        <td><strong>${safe(category.name)}</strong></td>
                                        <td>${safe(category.description || "—")}</td>
                                        <td>${Products.all().filter(
                                            p => p.category === category.name
                                        ).length}</td>
                                        <td>${canEdit() ? `
                                            <div class="actions">
                                                <button class="action-btn"
                                                    data-action="edit-category"
                                                    data-id="${safe(category.id)}">Edit</button>
                                                <button class="action-btn"
                                                    data-action="delete-category"
                                                    data-id="${safe(category.id)}">Delete</button>
                                            </div>
                                        ` : "View only"}</td>
                                    </tr>
                                `).join("") || emptyRow(4, "No categories found")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    function renderSuppliers() {
        const rows = Suppliers.all().filter(supplier =>
            [
                supplier.name,
                supplier.company,
                supplier.phone,
                supplier.email
            ].join(" ").toLowerCase().includes(searchTerm.toLowerCase())
        );

        return heading(
            "PARTNERS",
            "Suppliers",
            "Manage supplier contact information.",
            canEdit() ? button("＋ Add Supplier", "add-supplier") : ""
        ) + `
            <section class="panel">
                <div class="panel-head">
                    <h3>Supplier Directory</h3>
                    <span class="pill purple">${rows.length} suppliers</span>
                </div>
                <div class="panel-body">
                    ${toolbar("Search suppliers...")}
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th><th>Company</th><th>Phone</th>
                                    <th>Email</th><th>Address</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(s => `
                                    <tr>
                                        <td>${safe(s.name)}</td>
                                        <td>${safe(s.company)}</td>
                                        <td>${safe(s.phone)}</td>
                                        <td>${safe(s.email)}</td>
                                        <td>${safe(s.address || "—")}</td>
                                        <td>${canEdit() ? `
                                            <div class="actions">
                                                <button class="action-btn"
                                                    data-action="edit-supplier"
                                                    data-id="${safe(s.id)}">Edit</button>
                                                <button class="action-btn"
                                                    data-action="delete-supplier"
                                                    data-id="${safe(s.id)}">Delete</button>
                                            </div>
                                        ` : "View only"}</td>
                                    </tr>
                                `).join("") || emptyRow(6, "No suppliers found")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    function renderSales() {
        const allSales = Sales.all();

        const rows = allSales.filter(sale =>
            [sale.invoice, sale.customer, sale.productName]
                .join(" ").toLowerCase().includes(searchTerm.toLowerCase())
        );

        return heading(
            "REVENUE",
            "Sales",
            "Create invoices and track sales.",
            canEdit() ? button("＋ New Sale", "add-sale") : ""
        ) + `
            <div class="stats-grid">
                ${stat("Total Invoices", allSales.length, "▤", "purple", "Recorded sales")}
                ${stat("Total Revenue", money(allSales.reduce((sum, s) => sum + Number(s.total || 0), 0)), "₹", "green", "After discounts")}
                ${stat("Total Discounts", money(allSales.reduce((sum, s) => sum + Number(s.discount || 0), 0)), "%", "orange", "Discounts applied")}
            </div>
            <section class="panel">
                <div class="panel-head"><h3>Sales Invoices</h3></div>
                <div class="panel-body">
                    ${toolbar("Search invoice or customer...")}
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Invoice</th><th>Date</th><th>Customer</th>
                                    <th>Product</th><th>Quantity</th>
                                    <th>Subtotal</th><th>Discount</th><th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(s => `
                                    <tr>
                                        <td>${safe(s.invoice)}</td>
                                        <td>${safe(s.date)}</td>
                                        <td>${safe(s.customer)}</td>
                                        <td>${safe(s.productName)}</td>
                                        <td>${Number(s.quantity) || 0}</td>
                                        <td>${money(s.subtotal)}</td>
                                        <td>${money(s.discount)}</td>
                                        <td><strong>${money(s.total)}</strong></td>
                                    </tr>
                                `).join("") || emptyRow(8, "No sales recorded")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    function renderStock() {
        const rows = StockManagement.all().filter(item =>
            [item.productName, item.type, item.reason]
                .join(" ").toLowerCase().includes(searchTerm.toLowerCase()) &&
            (!filterValue || item.type === filterValue)
        );

        const options = ["Stock In", "Stock Out", "Sale", "Adjustment"];

        return heading(
            "INVENTORY FLOW",
            "Stock History",
            "Track stock additions and reductions.",
            canEdit() ? button("＋ Stock Movement", "add-stock") : ""
        ) + `
            <section class="panel">
                <div class="panel-head"><h3>Movement Log</h3></div>
                <div class="panel-body">
                    ${toolbar("Search product or reason", `
                        <select id="stockFilter" aria-label="Filter movement">
                            <option value="">All movements</option>
                            ${options.map(option => `
                                <option value="${option}"
                                    ${filterValue === option ? "selected" : ""}>
                                    ${option}
                                </option>
                            `).join("")}
                        </select>
                    `)}
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th><th>Movement</th><th>Quantity</th>
                                    <th>Previous</th><th>Updated</th><th>Reason</th><th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(s => `
                                    <tr>
                                        <td>${safe(s.productName)}</td>
                                        <td>${safe(s.type)}</td>
                                        <td>${Number(s.quantity) || 0}</td>
                                        <td>${Number(s.previous) || 0}</td>
                                        <td>${Number(s.updated) || 0}</td>
                                        <td>${safe(s.reason || "—")}</td>
                                        <td>${safe(s.date)}</td>
                                    </tr>
                                `).join("") || emptyRow(7, "No stock movements found")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    function renderBatches() {
        const rows = Batches.all().filter(batch => {
            const product = Products.find(batch.productId);

            return [
                batch.batchNo,
                product?.name,
                batch.expiryDate
            ].join(" ").toLowerCase().includes(searchTerm.toLowerCase());
        });

        return heading(
            "TRACEABILITY",
            "Product Batches",
            "Track batch numbers, manufacture dates and expiry.",
            canEdit() ? button("＋ Add Batch", "add-batch") : ""
        ) + `
            <section class="panel">
                <div class="panel-head"><h3>Batch Register</h3></div>
                <div class="panel-body">
                    ${toolbar("Search batch or product...")}
                    <div class="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Batch</th><th>Product</th><th>Manufactured</th>
                                    <th>Expiry</th><th>Quantity</th><th>Unit Cost</th>
                                    <th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(batch => {
                                    const product = Products.find(batch.productId);
                                    const status = Batches.expiryStatus(batch);

                                    return `
                                        <tr>
                                            <td>${safe(batch.batchNo)}</td>
                                            <td>${safe(product?.name || "Deleted product")}</td>
                                            <td>${safe(batch.manufacturingDate)}</td>
                                            <td>${safe(batch.expiryDate)}</td>
                                            <td>${Number(batch.quantity) || 0}</td>
                                            <td>${money(batch.purchasePrice)}</td>
                                            <td>${statusPill(status)}</td>
                                            <td>${canEdit() ? `
                                                <div class="actions">
                                                    <button class="action-btn"
                                                        data-action="edit-batch"
                                                        data-id="${safe(batch.id)}">Edit</button>
                                                    <button class="action-btn"
                                                        data-action="delete-batch"
                                                        data-id="${safe(batch.id)}">Delete</button>
                                                </div>
                                            ` : "View only"}</td>
                                        </tr>
                                    `;
                                }).join("") || emptyRow(8, "No batches found")}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        `;
    }

    function renderActivity() {
        const logs = ActivityLog.getLogs();

        return heading(
            "AUDIT TRAIL",
            "Activity Log",
            "Review recent actions.",
            button("Refresh Log", "refresh-activity", "btn btn-secondary")
        ) + `
            <section class="panel">
                <div class="panel-head">
                    <h3>Recent Activity</h3>
                    <span class="pill purple">${logs.length} events</span>
                </div>
                <div class="panel-body">
                    ${ActivityLog.renderTable()}
                </div>
            </section>
        `;
    }

    function openModal(title, body, onSave) {
        const root = $("#modalRoot");

        if (!root) {
            notify("Missing #modalRoot in index.html.", "error");
            return;
        }

        root.innerHTML = `
            <div class="modal-backdrop" data-action="close-modal">
                <section class="modal" role="dialog" aria-modal="true">
                    <div class="modal-head">
                        <h2>${safe(title)}</h2>
                        <button class="modal-close" type="button"
                            data-action="close-modal">×</button>
                    </div>
                    <form id="modalForm">
                        <div class="modal-body">${body}</div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" type="button"
                                data-action="close-modal">Cancel</button>
                            <button class="btn btn-primary" type="submit">Save</button>
                        </div>
                    </form>
                </section>
            </div>
        `;

        $("#modalForm").addEventListener("submit", async event => {
            event.preventDefault();

            try {
                await onSave(new FormData(event.currentTarget));
                root.innerHTML = "";
                render();
                notify("Saved successfully.");
            } catch (error) {
                const errorElement = $("#modalError");

                if (errorElement) {
                    errorElement.textContent = error.message;
                } else {
                    notify(error.message || "Unable to save.", "error");
                }
            }
        });
    }

    function field(label, name, value = "", type = "text", required = true, extra = "") {
        return `
            <div class="form-field">
                <label>${safe(label)}${required ? " *" : ""}</label>
                <input class="field" name="${safe(name)}"
                    type="${safe(type)}" value="${safe(value)}"
                    ${required ? "required" : ""} ${extra}>
            </div>
        `;
    }

    function selectField(label, name, options, value, required = true) {
        return `
            <div class="form-field">
                <label>${safe(label)}${required ? " *" : ""}</label>
                <select class="field" name="${safe(name)}"
                    ${required ? "required" : ""}>
                    ${options.map(option => `
                        <option value="${safe(option.value)}"
                            ${String(option.value) === String(value) ? "selected" : ""}>
                            ${safe(option.label)}
                        </option>
                    `).join("")}
                </select>
            </div>
        `;
    }

    function textArea(label, name, value = "", required = false) {
        return `
            <div class="form-field full">
                <label>${safe(label)}${required ? " *" : ""}</label>
                <textarea class="field" name="${safe(name)}"
                    rows="3" ${required ? "required" : ""}>${safe(value)}</textarea>
            </div>
        `;
    }

    const errorBox = '<div id="modalError" class="form-message"></div>';

    function productModal(id = null) {
        const product = id
            ? Products.find(id)
            : {
                name: "",
                category: Categories.all()[0]?.name || "",
                price: "",
                cost: "",
                stock: 0,
                minStock: 5,
                supplier: "",
                description: "",
                image: ""
            };

        if (!product) {
            notify("Product not found.", "error");
            return;
        }

        const categoryOptions = Categories.all().map(c => ({
            value: c.name,
            label: c.name
        }));

        const supplierOptions = [
            { value: "", label: "No supplier" },
            ...Suppliers.all().map(s => ({
                value: s.company,
                label: s.company
            }))
        ];

        openModal(
            id ? "Edit Product" : "Add Product",
            `<div class="form-grid">
                ${field("Product Name", "name", product.name)}
                ${selectField("Category", "category", categoryOptions, product.category)}
                ${field("Selling Price (₹)", "price", product.price, "number", true, 'min="0.01" step="0.01"')}
                ${field("Purchase Cost (₹)", "cost", product.cost, "number", true, 'min="0" step="0.01"')}
                ${field("Available Quantity", "stock", product.stock, "number", true, 'min="0" step="1"')}
                ${field("Minimum Stock", "minStock", product.minStock, "number", true, 'min="0" step="1"')}
                ${selectField("Supplier", "supplier", supplierOptions, product.supplier || "", false)}
                ${field("Product Image", "imageFile", "", "file", false, 'accept="image/png,image/jpeg,image/webp"')}
                ${textArea("Description", "description", product.description || "")}
                <div class="form-field full">
                    <div class="image-preview" id="imagePreview">
                        ${product.image ? `<img src="${safe(product.image)}" alt="Preview">` : "Image preview"}
                    </div>
                </div>
                ${errorBox}
            </div>`,
            async fd => {
                const name = fd.get("name").trim();
                const price = Number(fd.get("price"));
                const cost = Number(fd.get("cost"));
                const stock = Number(fd.get("stock"));
                const minStock = Number(fd.get("minStock"));

                if (name.length < 2) {
                    throw new Error("Product name must have at least 2 characters.");
                }

                if (!categoryOptions.length) {
                    throw new Error("Add a category before creating a product.");
                }

                if (
                    !Number.isFinite(price) || price <= 0 ||
                    !Number.isFinite(cost) || cost < 0 ||
                    !Number.isInteger(stock) || stock < 0 ||
                    !Number.isInteger(minStock) || minStock < 0
                ) {
                    throw new Error("Enter valid price, cost and whole-number stock.");
                }

                let image = product.image || "";
                const file = fd.get("imageFile");

                if (file?.size) {
                    if (file.size > 900000) {
                        throw new Error("Choose an image smaller than 900 KB.");
                    }

                    image = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () => reject(new Error("Image could not be read."));
                        reader.readAsDataURL(file);
                    });
                }

                Products.upsert({
                    ...(id ? { id } : {}),
                    name,
                    category: fd.get("category"),
                    price,
                    cost,
                    stock,
                    minStock,
                    supplier: fd.get("supplier"),
                    description: fd.get("description").trim(),
                    image
                });
            }
        );

        const fileInput = $("#modalForm [name='imageFile']");

        fileInput?.addEventListener("change", () => {
            const file = fileInput.files?.[0];

            if (!file) return;

            if (file.size > 900000) {
                notify("Image must be smaller than 900 KB.", "error");
                fileInput.value = "";
                return;
            }

            const reader = new FileReader();

            reader.onload = () => {
                const preview = $("#imagePreview");

                if (preview) {
                    preview.innerHTML = `<img src="${reader.result}" alt="Image preview">`;
                }
            };

            reader.readAsDataURL(file);
        });
    }

    function categoryModal(id = null) {
        const category = id
            ? Categories.all().find(c => String(c.id) === String(id))
            : { name: "", description: "" };

        if (!category) {
            notify("Category not found.", "error");
            return;
        }

        openModal(
            id ? "Edit Category" : "Add Category",
            `<div class="form-grid">
                ${field("Category Name", "name", category.name)}
                ${textArea("Description", "description", category.description || "")}
                ${errorBox}
            </div>`,
            fd => {
                const name = fd.get("name").trim();

                if (name.length < 2) {
                    throw new Error("Category name must have at least 2 characters.");
                }

                Categories.upsert({
                    ...(id ? { id } : {}),
                    name,
                    description: fd.get("description").trim()
                });
            }
        );
    }// In the file where ActivityLog is defined:
class ActivityLog {
    // Ensure 'static' is present if calling as ActivityLog.getLogs()
    static getLogs() {
        // ... logic to return logs
        return []; 
    }
}

// In main.js (the calling code):
async function renderActivity() {
    try {
        const logs = ActivityLog.getLogs(); // Now this will work
        // ... rest of your rendering logic
    } catch (error) {
        console.error("Page rendering error:", error);
        // ... your error UI logic
    }
}

    function supplierModal(id = null) {
        const supplier = id
            ? Suppliers.all().find(s => String(s.id) === String(id))
            : { name: "", company: "", phone: "", email: "", address: "" };

        if (!supplier) {
            notify("Supplier not found.", "error");
            return;
        }

        openModal(
            id ? "Edit Supplier" : "Add Supplier",
            `<div class="form-grid">
                ${field("Contact Name", "name", supplier.name)}
                ${field("Company Name", "company", supplier.company)}
                ${field("Phone Number", "phone", supplier.phone, "tel", true, 'pattern="[0-9+() -]{7,18}"')}
                ${field("Email Address", "email", supplier.email, "email")}
                ${textArea("Address", "address", supplier.address || "")}
                ${errorBox}
            </div>`,
            fd => {
                const data = {
                    ...(id ? { id } : {}),
                    name: fd.get("name").trim(),
                    company: fd.get("company").trim(),
                    phone: fd.get("phone").trim(),
                    email: fd.get("email").trim(),
                    address: fd.get("address").trim()
                };

                if (!data.name || !data.company || !data.phone || !data.email) {
                    throw new Error("Complete all required supplier fields.");
                }

                Suppliers.upsert(data);
            }
        );
    }

    function saleModal() {
        const options = Products.all()
            .filter(p => Number(p.stock) > 0)
            .map(p => ({
                value: p.id,
                label: `${p.name} — ${p.stock} in stock — ${money(p.price)}`
            }));

        if (!options.length) {
            notify("No products have available stock.", "error");
            return;
        }

        openModal(
            "Create Sales Invoice",
            `<div class="form-grid">
                ${field("Customer Name", "customer")}
                ${field("Customer Phone", "phone", "", "tel", false)}
                ${selectField("Product", "productId", options, options[0].value)}
                ${field("Quantity", "quantity", 1, "number", true, 'min="1" step="1"')}
                ${field("Discount (₹)", "discount", 0, "number", true, 'min="0" step="0.01"')}
                ${field("Sale Date", "date", new Date().toLocaleDateString("en-CA"), "date")}
                ${textArea("Notes", "notes", "", false)}
                <div class="form-field full inline-note" id="saleCalc"></div>
                ${errorBox}
            </div>`,
            fd => {
                const saleDate = fd.get("date");

                if (!saleDate) {
                    throw new Error("Please select the sale date.");
                }

                const sale = Sales.create({
                    customer: fd.get("customer").trim(),
                    phone: fd.get("phone").trim(),
                    productId: fd.get("productId"),
                    quantity: fd.get("quantity"),
                    discount: fd.get("discount"),
                    date: saleDate
                });

                notify(`Invoice ${sale.invoice} created.`);
            }
        );

        const updateCalculation = () => {
            const form = $("#modalForm");

            if (!form) return;

            const product = Products.find(form.elements.productId.value);
            const quantity = Number(form.elements.quantity.value) || 0;
            const discount = Number(form.elements.discount.value) || 0;
            const subtotal = (Number(product?.price) || 0) * quantity;
            const finalAmount = Math.max(0, subtotal - discount);
            const output = $("#saleCalc");

            if (output) {
                output.textContent =
                    `Price: ${money(product?.price)} · Subtotal: ${money(subtotal)} · Total: ${money(finalAmount)} · Available: ${product?.stock || 0}`;
            }
        };

        ["productId", "quantity", "discount"].forEach(name => {
            $("#modalForm").elements[name]?.addEventListener("input", updateCalculation);
            $("#modalForm").elements[name]?.addEventListener("change", updateCalculation);
        });

        updateCalculation();
    }

    function stockModal() {
        const options = Products.all().map(p => ({
            value: p.id,
            label: `${p.name} (${p.stock} available)`
        }));

        if (!options.length) {
            notify("Add a product first.", "error");
            return;
        }

        openModal(
            "Record Stock Movement",
            `<div class="form-grid">
                ${selectField("Product", "productId", options, options[0].value)}
                ${selectField("Movement Type", "type", [
                    { value: "Stock In", label: "Stock In — add stock" },
                    { value: "Stock Out", label: "Stock Out — remove stock" }
                ], "Stock In")}
                ${field("Quantity", "quantity", 1, "number", true, 'min="1" step="1"')}
                ${field("Reason", "reason")}
                ${errorBox}
            </div>`,
            fd => StockManagement.move({
                productId: fd.get("productId"),
                type: fd.get("type"),
                quantity: fd.get("quantity"),
                reason: fd.get("reason").trim()
            })
        );
    }

    function batchModal(id = null) {
        const batch = id
            ? Batches.all().find(b => String(b.id) === String(id))
            : {
                batchNo: "",
                productId: Products.all()[0]?.id || "",
                manufacturingDate: "",
                expiryDate: "",
                quantity: 1,
                purchasePrice: 0
            };

        if (!batch) {
            notify("Batch not found.", "error");
            return;
        }

        const options = Products.all().map(p => ({
            value: p.id,
            label: p.name
        }));

        if (!options.length) {
            notify("Add a product before creating a batch.", "error");
            return;
        }

        openModal(
            id ? "Edit Batch" : "Add Batch",
            `<div class="form-grid">
                ${field("Batch Number", "batchNo", batch.batchNo)}
                ${selectField("Product", "productId", options, batch.productId)}
                ${field("Manufacturing Date", "manufacturingDate", batch.manufacturingDate, "date")}
                ${field("Expiry Date", "expiryDate", batch.expiryDate, "date")}
                ${field("Quantity", "quantity", batch.quantity, "number", true, 'min="0" step="1"')}
                ${field("Purchase Price per Unit (₹)", "purchasePrice", batch.purchasePrice, "number", true, 'min="0" step="0.01"')}
                ${errorBox}
            </div>`,
            fd => {
                const data = {
                    ...(id ? { id } : {}),
                    batchNo: fd.get("batchNo").trim(),
                    productId: fd.get("productId"),
                    manufacturingDate: fd.get("manufacturingDate"),
                    expiryDate: fd.get("expiryDate"),
                    quantity: Number(fd.get("quantity")),
                    purchasePrice: Number(fd.get("purchasePrice"))
                };

                if (!data.batchNo) {
                    throw new Error("Batch number is required.");
                }

                if (
                    !Number.isInteger(data.quantity) ||
                    data.quantity < 0 ||
                    !Number.isFinite(data.purchasePrice) ||
                    data.purchasePrice < 0
                ) {
                    throw new Error("Enter valid quantity and purchase price.");
                }

                if (
                    data.manufacturingDate &&
                    data.expiryDate &&
                    data.expiryDate < data.manufacturingDate
                ) {
                    throw new Error("Expiry date cannot be before manufacturing date.");
                }

                Batches.upsert(data);
            }
        );
    }

    function confirmDelete(kind, id) {
        if (!canEdit()) {
            notify("Only Admin users can delete records.", "error");
            return;
        }

        if (!confirm("Are you sure you want to delete this record?")) {
            return;
        }

        try {
            const methods = {
                product: () => Products.remove(id),
                category: () => Categories.remove(id),
                supplier: () => Suppliers.remove(id),
                batch: () => Batches.remove(id)
            };

            if (!methods[kind]) {
                throw new Error("Unsupported record type.");
            }

            methods[kind]();
            render();
            notify("Record deleted.");
        } catch (error) {
            notify(error.message || "Could not delete record.", "error");
        }
    }

    document.addEventListener("click", event => {
        const pageButton = event.target.closest("[data-page]");

        if (pageButton) {
            event.preventDefault();

            const page = pageButton.dataset.page;

            if (!Auth.allowed(page)) {
                notify("You do not have access to that page.", "error");
                return;
            }

            currentPage = page;
            searchTerm = "";
            filterValue = "";
            $("#sidebar")?.classList.remove("open");
            render();
            return;
        }

        const element = event.target.closest("[data-action]");

        if (!element) return;

        const action = element.dataset.action;
        const id = element.dataset.id;

        if (action === "close-modal") {
            if (
                element.classList.contains("modal-backdrop") ||
                element.classList.contains("modal-close") ||
                element.type === "button"
            ) {
                $("#modalRoot").innerHTML = "";
            }
            return;
        }

        if (action === "go-dashboard") {
            currentPage = "dashboard";
            render();
            return;
        }

        if (action === "refresh-page") {
            render();
            return;
        }

        if (action === "add-product" && canEdit()) productModal();
        if (action === "edit-product" && canEdit()) productModal(id);
        if (action === "delete-product") confirmDelete("product", id);

        if (action === "add-category" && canEdit()) categoryModal();
        if (action === "edit-category" && canEdit()) categoryModal(id);
        if (action === "delete-category") confirmDelete("category", id);

        if (action === "add-supplier" && canEdit()) supplierModal();
        if (action === "edit-supplier" && canEdit()) supplierModal(id);
        if (action === "delete-supplier") confirmDelete("supplier", id);

        if (action === "add-sale" && canEdit()) saleModal();
        if (action === "add-stock" && canEdit()) stockModal();
        if (action === "add-batch" && canEdit()) batchModal();
        if (action === "edit-batch" && canEdit()) batchModal(id);
        if (action === "delete-batch") confirmDelete("batch", id);

        if (action === "refresh-activity") {
            render();
            notify("Activity log refreshed.");
        }
    });

    document.addEventListener("change", event => {
        if (event.target.id === "stockFilter") {
            filterValue = event.target.value;
            render();
        }
    });

    $("#sideNav")?.addEventListener("click", event => {
        if (event.target.closest(".nav-link")) {
            $("#sidebar")?.classList.remove("open");
        }
    });

    $("#menuToggle")?.addEventListener("click", () => {
        $("#sidebar")?.classList.toggle("open");
    });

    $("#logoutButton")?.addEventListener("click", () => Auth.logout());
    $("#sidebarLogout")?.addEventListener("click", () => Auth.logout());

    try {
        Store.init();

        if (!Auth.current()) {
            location.replace("login.html");
            return;
        }

        render();
    } catch (error) {
        console.error("Inventory initialization failed:", error);

        const content = $("#pageContent");

        if (content) {
            content.innerHTML = `
                <section class="panel">
                    <h2>Application could not start</h2>
                    <p>Check that all JavaScript files are linked in index.html
                    and that storage.js and auth.js load before main.js.</p>
                </section>
            `;
        }
    }
})();

