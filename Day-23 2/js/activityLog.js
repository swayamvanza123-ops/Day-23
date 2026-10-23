/* Activity Log: browser-side activity history for the inventory demo. */
(() => {
  "use strict";
  const KEY = "day23_stockly_activity_log";
  const MAX_ITEMS = 250;

  function getAll() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function userInfo() {
    try {
      const user = window.Auth && window.Auth.current ? window.Auth.current() : null;
      if (user) return { name: user.name || user.email || "User", role: user.role || "User" };
    } catch (_) {}
    return { name: "Guest", role: "Guest" };
  }

  function add(action, details = "") {
    const user = userInfo();
    const entry = {
      id: "LOG-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
      timestamp: new Date().toISOString(),
      user: user.name,
      role: user.role,
      action: String(action || "Activity"),
      details: String(details || "")
    };
    const logs = getAll();
    logs.unshift(entry);
    try {
      localStorage.setItem(KEY, JSON.stringify(logs.slice(0, MAX_ITEMS)));
    } catch (error) {
      console.warn("Could not save activity log:", error);
    }
    document.dispatchEvent(new CustomEvent("activitylog:updated"));
    return entry;
  }

  function getRecent(limit = 50) {
    return getAll().slice(0, Math.max(0, Number(limit) || 0));
  }

  function clear() {
    localStorage.removeItem(KEY);
    document.dispatchEvent(new CustomEvent("activitylog:updated"));
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function renderTable(limit = 50) {
    const logs = getRecent(limit);
    if (!logs.length) {
      return '<div class="empty-state"><strong>No activity yet</strong>Activity will appear here as you use the app.</div>';
    }
    return `<div class="table-wrap"><table>
      <thead><tr><th>Date &amp; time</th><th>User</th><th>Role</th><th>Activity</th><th>Details</th></tr></thead>
      <tbody>${logs.map(log => {
        const date = new Date(log.timestamp);
        const time = Number.isNaN(date.getTime()) ? log.timestamp : date.toLocaleString();
        return `<tr>
          <td>${escapeHTML(time)}</td>
          <td><strong>${escapeHTML(log.user)}</strong></td>
          <td><span class="pill purple">${escapeHTML(log.role)}</span></td>
          <td>${escapeHTML(log.action)}</td>
          <td>${escapeHTML(log.details || "—")}</td>
        </tr>`;
      }).join("")}</tbody></table></div>`;
  }

  window.ActivityLog = { add, getAll, getRecent, clear, renderTable };

  // Automatically record common navigation and action button clicks.
  document.addEventListener("click", event => {
    const el = event.target.closest("button, a");
    if (!el) return;
    const label = (el.innerText || el.getAttribute("aria-label") || el.title || "").trim();
    if (el.id === "logoutButton" || el.id === "sidebarLogout" || /sign out|log out|logout/i.test(label)) {
      add("Sign out", "Sign-out control selected");
    } else if (el.dataset.page) {
      add("Navigation", "Opened " + el.dataset.page);
    } else if (el.dataset.action && el.dataset.action !== "close-modal") {
      add("Action", el.dataset.action.replace(/[-_]/g, " "));
    }
  });

  // Record one app-session opening when a logged-in user reaches index.html.
  const path = location.pathname.toLowerCase();
  if (!path.endsWith("login.html")) {
    const user = userInfo();
    if (user.role !== "Guest") {
      try {
        if (sessionStorage.getItem("day23_stockly_login_logged") !== "1") {
          add("Sign in", "Inventory workspace opened");
          sessionStorage.setItem("day23_stockly_login_logged", "1");
        }
      } catch (_) {
        add("Workspace opened", "Inventory workspace opened");
      }
    }
  }
})();
