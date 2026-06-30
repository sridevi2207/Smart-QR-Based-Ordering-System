/* ── STATE ───────────────────────────────────────────────── */
let currentTable = 1;
let currentCat   = 'All';
let cart         = {}; // id -> { ...item, quantity }
let activeOrder  = null;
let kitchenAuthed = false;
let adminAuthed   = false;
let kitchenCurrentTab = 'Pending';
 
/* ── DATA ────────────────────────────────────── */
let MENU = [];
let ORDERS = [];
let TABLES = [1,2,3,4,5,6];

// API base URL
const API_BASE = '/api';

async function fetchMenu() {
  try {
    const res = await fetch(`${API_BASE}/menu`);
    MENU = await res.json();
    // Convert price to number just in case
    MENU.forEach(m => m.price = Number(m.price));
    if (document.getElementById('page-menu').classList.contains('active')) {
      renderMenu();
    }
    if (adminAuthed && document.getElementById('admin-dash').style.display === 'block') {
      renderAdminMenu();
    }
  } catch (err) {
    console.error('Error fetching menu:', err);
  }
}

async function fetchOrders() {
  try {
    const res = await fetch(`${API_BASE}/orders`);
    ORDERS = await res.json();
    ORDERS.forEach(o => o.total = Number(o.total));
    if (kitchenAuthed && document.getElementById('kitchen-dash').style.display === 'block') {
      renderKitchen();
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
  }
}

// Initial load
fetchMenu();
// Periodically fetch orders to keep UI in sync
setInterval(() => {
  if (kitchenAuthed) {
    fetchOrders();
  } else if (activeOrder) {
    // If we are a customer waiting for an order, poll to get status updates
    fetchOrders().then(() => {
      const updatedOrder = ORDERS.find(o => o.id === activeOrder.id);
      if (updatedOrder && updatedOrder.status !== activeOrder.status) {
        activeOrder.status = updatedOrder.status;
        const btn = document.getElementById('active-order-btn');
        if (btn) btn.textContent = `Active order · ${updatedOrder.status}`;
        showTracking(activeOrder);
      }
    });
  }
}, 5000);
 
/* ── PAGE ROUTING ────────────────────────────────────────── */
function showPage(name, pushState = true) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  window.scrollTo(0,0);
  
  if (pushState) {
    window.history.pushState({ page: name }, '', `#${name}`);
  }
}

window.addEventListener('popstate', (e) => {
  if (e.state && e.state.page) {
    showPage(e.state.page, false);
  } else {
    showPage('landing', false);
  }
});

// Set initial state on load so the first back navigation works correctly
window.history.replaceState({ page: 'landing' }, '', '#landing');
 
/* ── LANDING ─────────────────────────────────────────────── */
function openMenu(tableNum) {
  currentTable = tableNum;
  cart = {};
  showPage('menu');
  renderMenu();
  document.getElementById('menu-table-label').textContent = 'Table ' + tableNum;
  updateCartBar();
}
 
/* ── MENU ────────────────────────────────────────────────── */
function renderMenu() {
  const grid = document.getElementById('menu-grid');
  const items = currentCat === 'All' ? MENU : MENU.filter(i => i.category === currentCat);
  grid.innerHTML = items.map(it => menuCard(it)).join('');
}
 
function menuCard(it) {
  const inCart = cart[it.id];
  const controls = inCart
    ? `<div class="qty-stepper">
        <button class="btn-icon" onclick="decItem('${it.id}')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span class="qty-num">${inCart.quantity}</span>
        <button class="btn-icon filled" onclick="addItem('${it.id}')">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
       </div>`
    : `<button class="btn btn-primary btn-full btn-sm" onclick="addItem('${it.id}')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add to cart
       </button>`;
 
  return `<div class="menu-item-card">
    <div class="menu-img-wrap">
      <img src="${it.image_url}" alt="${it.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format'">
      <span class="img-badge left">${it.category}</span>
      <span class="img-badge right">
        <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${it.prep_time}m
      </span>
    </div>
    <div class="menu-item-body">
      <div class="menu-item-row">
        <div class="menu-item-name">${it.name}</div>
        <div class="menu-item-price">$${it.price.toFixed(2)}</div>
      </div>
      <p class="menu-item-desc">${it.description}</p>
      <div class="menu-item-footer">${controls}</div>
    </div>
  </div>`;
}
 
function filterCat(cat, btn) {
  currentCat = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMenu();
}
 
function addItem(id) {
  const it = MENU.find(i => i.id === id);
  if (!it) return;
  cart[id] = cart[id] ? { ...cart[id], quantity: cart[id].quantity + 1 } : { ...it, quantity: 1 };
  renderMenu();
  updateCartBar();
}
 
function decItem(id) {
  if (!cart[id]) return;
  if (cart[id].quantity <= 1) { delete cart[id]; }
  else { cart[id] = { ...cart[id], quantity: cart[id].quantity - 1 }; }
  renderMenu();
  updateCartBar();
}
 
function removeItem(id) {
  delete cart[id];
  renderCart();
  updateCartBar();
}
 
function cartList() { return Object.values(cart); }
function totalQty() { return cartList().reduce((a,b)=>a+b.quantity,0); }
function subtotal() { return cartList().reduce((a,b)=>a+b.price*b.quantity,0); }
function maxPrep()  { return cartList().reduce((a,b)=>Math.max(a,b.prep_time||15),0); }
 
function updateCartBar() {
  const bar = document.getElementById('cart-bar');
  const qty = totalQty();
  if (qty > 0) {
    bar.classList.add('visible');
    document.getElementById('cart-bar-text').textContent = `${qty} ${qty===1?'item':'items'} · $${subtotal().toFixed(2)}`;
  } else {
    bar.classList.remove('visible');
  }
}
 
function openCart() {
  renderCart();
  document.getElementById('cart-overlay').classList.add('open');
}
 
function closeCartOutside(e) {
  if (e.target === document.getElementById('cart-overlay')) closeCart();
}
function closeCart() { document.getElementById('cart-overlay').classList.remove('open'); }
 
function renderCart() {
  const list = document.getElementById('cart-items-list');
  const items = cartList();
  list.innerHTML = items.map(i => `
    <div class="cart-item">
      <img src="${i.image_url}" alt="${i.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">$${(i.price*i.quantity).toFixed(2)}</div>
      </div>
      <div class="cart-item-controls">
        <button class="btn-icon" onclick="decItemCart('${i.id}')">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span style="font-size:14px;min-width:18px;text-align:center">${i.quantity}</span>
        <button class="btn-icon filled" onclick="addItemCart('${i.id}')">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button class="btn-icon" onclick="removeItem('${i.id}')" style="margin-left:2px">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>`).join('');
  document.getElementById('cart-qty-display').textContent = totalQty();
  document.getElementById('cart-prep-display').textContent = '~' + maxPrep() + ' min';
  document.getElementById('cart-total-display').textContent = '$' + subtotal().toFixed(2);
}
 
function addItemCart(id) { addItem(id); renderCart(); }
function decItemCart(id) { decItem(id); renderCart(); }
 
function clearCartAndClose() { cart = {}; renderMenu(); updateCartBar(); closeCart(); }
 
async function placeOrderDemo() {
  if (cartList().length === 0) return;
  const newOrder = {
    id: 'ord' + Date.now(),
    table_number: currentTable,
    status: 'Pending',
    total: subtotal(),
    ai_summary: 'Fresh order just in — process in the sequence listed.',
    items: cartList().map(i => ({ name: i.name, price: i.price, quantity: i.quantity, image_url: i.image_url })),
  };
  
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrder)
    });
    if(res.ok) {
      newOrder.created_at = new Date().toISOString();
      ORDERS.push(newOrder);
      activeOrder = newOrder;
      cart = {};
      renderMenu();
      updateCartBar();
      closeCart();
      showTracking(newOrder);
      showPage('tracking');
      // show active order banner
      document.getElementById('active-order-btn').style.display = 'inline-block';
      document.getElementById('active-order-btn').textContent = `Active order · ${newOrder.status}`;
    } else {
      alert("Error placing order.");
    }
  } catch(e) {
    console.error(e);
    alert("Error placing order.");
  }
}
 
/* ── TRACKING ────────────────────────────────────────────── */
function showTracking(order) {
  const statusMap = { Pending:'Order received', Preparing:'Cooking now…', Ready:'Your meal is ready!', Cancelled:'Order cancelled' };
  document.getElementById('tracking-meta').textContent = `Table ${order.table_number} · Order`;
  document.getElementById('tracking-title').textContent = statusMap[order.status] || order.status;
  document.getElementById('tracking-status-badge').textContent = order.status;
  document.getElementById('tracking-status-badge').className = 'badge badge-' + order.status.toLowerCase();
 
  // AI brief
  const briefBox = document.getElementById('ai-brief-box');
  if (order.ai_summary) {
    briefBox.style.display = 'flex';
    document.getElementById('ai-brief-text').textContent = order.ai_summary;
  } else { briefBox.style.display = 'none'; }
 
  // Progress
  const steps = ['Pending','Preparing','Ready'];
  const idx   = steps.indexOf(order.status);
  steps.forEach((s,i) => {
    const circle = document.getElementById('step-' + s.toLowerCase());
    const label  = circle ? circle.nextElementSibling : null;
    if (!circle) return;
    if (i <= idx) { circle.classList.add('done'); if(label) label.classList.add('done'); }
    else           { circle.classList.remove('done'); if(label) label.classList.remove('done'); }
  });
  const pct = idx === 0 ? 0 : idx === 1 ? 50 : 100;
  document.getElementById('progress-bar').style.width = pct + '%';
 
  // Locked
  document.getElementById('locked-notice').style.display = (order.status !== 'Pending') ? 'flex' : 'none';
 
  // Items
  document.getElementById('tracking-items-list').innerHTML = order.items.map(i => `
    <div class="order-item">
      ${i.image_url ? `<img src="${i.image_url}" alt="${i.name}" onerror="this.style.display='none'">` : ''}
      <div class="order-item-info" style="flex:1;min-width:0">
        <div class="order-item-name">${i.name}</div>
        <div class="order-item-sub">$${i.price.toFixed(2)} × ${i.quantity}</div>
      </div>
      <div class="order-item-total">$${(i.price*i.quantity).toFixed(2)}</div>
    </div>`).join('');
 
  document.getElementById('tracking-total').textContent = '$' + order.total.toFixed(2);
}
 
/* ── KITCHEN ─────────────────────────────────────────────── */
function kitchenLogin() {
  const pw = document.getElementById('kitchen-pw').value;
  if (pw === 'demo' || pw === 'kitchen' || pw === 'admin') {
    kitchenAuthed = true;
    document.getElementById('kitchen-auth').style.display = 'none';
    document.getElementById('kitchen-dash').style.display = 'block';
    fetchOrders(); // Initial fetch
    renderKitchen();
  } else {
    document.getElementById('kitchen-err').style.display = 'block';
  }
}
function kitchenLogout() {
  kitchenAuthed = false;
  document.getElementById('kitchen-dash').style.display = 'none';
  document.getElementById('kitchen-auth').style.display = 'flex';
  document.getElementById('kitchen-pw').value = '';
  document.getElementById('kitchen-err').style.display = 'none';
  showPage('landing');
}
 
function switchKitchenTab(tab, btn) {
  kitchenCurrentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderKitchen();
}
 
function renderKitchen() {
  const tabs = ['Pending','Preparing','Ready','Completed'];
  tabs.forEach(t => {
    const cnt = ORDERS.filter(o => o.status === t).length;
    const el  = document.getElementById('cnt-' + t.toLowerCase());
    if (el) el.textContent = cnt;
  });
 
  const filtered = ORDERS.filter(o => o.status === kitchenCurrentTab);
  const grid = document.getElementById('kitchen-grid');
  const empty = document.getElementById('kitchen-empty');
 
  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    document.getElementById('kitchen-empty-title').textContent = 'No ' + kitchenCurrentTab.toLowerCase() + ' orders';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = filtered.map(o => kitchenCard(o)).join('');
  }
}
 
function kitchenCard(o) {
  const t = new Date(o.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  let actionBtn = '';
  if      (o.status === 'Pending')   actionBtn = `<button class="btn btn-secondary btn-full" onclick="advanceOrder('${o.id}','Preparing')"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:6px"><path d="M12 2a7 7 0 017 7c0 4.97-7 13-7 13S5 13.97 5 9a7 7 0 017-7z"/></svg>Start preparing</button>`;
  else if (o.status === 'Preparing') actionBtn = `<button class="btn btn-success btn-full" onclick="advanceOrder('${o.id}','Ready')"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="margin-right:6px"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>Mark ready</button>`;
  else if (o.status === 'Ready')     actionBtn = `<button class="btn btn-outline btn-full" onclick="advanceOrder('${o.id}','Completed')">Mark completed</button>`;
  else actionBtn = `<span style="font-size:12px;color:var(--muted)">Order completed.</span>`;
 
  const aiBrief = o.ai_summary ? `<div class="k-ai-brief"><svg width="16" height="16" fill="none" stroke="#E85D04" stroke-width="2" viewBox="0 0 24 24" style="flex-shrink:0"><path d="M5 3l14 9-14 9V3z"/></svg><span>${o.ai_summary}</span></div>` : '';
 
  return `<div class="k-order-card ${o.status.toLowerCase()}">
    <div class="k-card-top">
      <div>
        <div class="k-order-id">Order #${o.id.slice(-6)}</div>
        <div class="k-table-num">Table ${o.table_number}</div>
      </div>
      <span class="badge badge-${o.status.toLowerCase()}">${o.status}</span>
    </div>
    ${aiBrief}
    <ul class="k-items">
      ${o.items.map(i=>`<li><span><span class="k-item-qty">×${i.quantity}</span> <span class="k-item-name">${i.name}</span></span><span class="k-item-price">$${(i.price*i.quantity).toFixed(2)}</span></li>`).join('')}
    </ul>
    <div class="k-card-foot">
      <span class="k-time">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        ${t}
      </span>
      <span class="k-total">$${o.total.toFixed(2)}</span>
    </div>
    ${actionBtn}
  </div>`;
}
 
async function advanceOrder(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if(res.ok) {
      const o = ORDERS.find(x => x.id === id);
      if (o) { 
        o.status = newStatus; 
        renderKitchen(); 
        
        // Update active order badge if it matches
        if (activeOrder && activeOrder.id === id) {
          activeOrder.status = newStatus;
          const btn = document.getElementById('active-order-btn');
          if (btn) btn.textContent = `Active order · ${newStatus}`;
          
          // Always update the tracking UI so it's correct when they go back to it
          showTracking(activeOrder);
        }
      }
    }
  } catch(e) {
    console.error(e);
  }
}
 
/* ── ADMIN ───────────────────────────────────────────────── */
function adminLogin() {
  const pw = document.getElementById('admin-pw').value;
  if (pw === 'admin' || pw === 'demo') {
    adminAuthed = true;
    document.getElementById('admin-auth').style.display = 'none';
    document.getElementById('admin-dash').style.display = 'block';
    renderAdminMenu();
    renderQRGrid();
  } else {
    document.getElementById('admin-err').style.display = 'block';
  }
}
function adminLogout() {
  adminAuthed = false;
  document.getElementById('admin-dash').style.display = 'none';
  document.getElementById('admin-auth').style.display = 'flex';
  document.getElementById('admin-pw').value = '';
  document.getElementById('admin-err').style.display = 'none';
  showPage('landing');
}
 
function switchAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('admin-tab-menu').style.display = tab==='menu' ? 'block' : 'none';
  document.getElementById('admin-tab-qr').style.display   = tab==='qr'   ? 'block' : 'none';
}
 
function renderAdminMenu() {
  document.getElementById('admin-menu-count').textContent = MENU.length;
  document.getElementById('admin-menu-list').innerHTML = MENU.map(it => `
    <div class="admin-menu-card">
      <img src="${it.image_url}" alt="${it.name}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200'">
      <div class="admin-menu-card-body">
        <div class="admin-menu-card-top">
          <div class="admin-menu-name">${it.name}</div>
          <div class="admin-menu-price">$${it.price.toFixed(2)}</div>
        </div>
        <div class="admin-menu-meta">${it.category} · ${it.prep_time}m</div>
        <div class="admin-menu-desc">${it.description}</div>
        <button class="admin-menu-del" onclick="adminDeleteItem('${it.id}')">
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          Remove
        </button>
      </div>
    </div>`).join('');
}
 
async function adminAddItem() {
  const name  = document.getElementById('af-name').value.trim();
  const price = parseFloat(document.getElementById('af-price').value);
  const prep  = parseInt(document.getElementById('af-prep').value) || 15;
  const cat   = document.getElementById('af-cat').value;
  const img   = document.getElementById('af-img').value.trim();
  const desc  = document.getElementById('af-desc').value.trim();
  if (!name || !price || !img) { alert('Please fill Name, Price and Image URL.'); return; }
  
  const newItem = { id:'m'+Date.now(), name, category:cat, price, prep_time:prep, description:desc, image_url:img };
  
  try {
    const res = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    });
    if(res.ok) {
      MENU.push(newItem);
      renderAdminMenu();
      document.getElementById('af-name').value = '';
      document.getElementById('af-price').value = '';
      document.getElementById('af-img').value = '';
      document.getElementById('af-desc').value = '';
      document.getElementById('af-prep').value = 15;
    } else {
      alert("Error adding item");
    }
  } catch(e) {
    console.error(e);
  }
}
 
async function adminDeleteItem(id) {
  if (!confirm('Delete this menu item?')) return;
  try {
    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'DELETE'
    });
    if(res.ok) {
      const idx = MENU.findIndex(i => i.id === id);
      if (idx !== -1) { MENU.splice(idx,1); renderAdminMenu(); }
    }
  } catch(e) {
    console.error(e);
  }
}
 
/* QR codes */
function renderQRGrid() {
  document.getElementById('qr-grid').innerHTML = TABLES.map(n => qrCard(n)).join('');
}
 
function qrCard(n) {
  // If accessing via localhost on phone, ensure the URL uses your computer's local IP address, not 'localhost'
  const url = window.location.origin + window.location.pathname + '?table=' + n;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&color=2C1E16&bgcolor=FDFBF7`;
  
  return `<div class="qr-card">
    <div class="qr-lbl">Table</div>
    <div class="qr-num">${n}</div>
    <div class="qr-code-wrap" style="padding:0; overflow:hidden;">
      <img src="${qrImageUrl}" width="160" height="160" alt="QR Code for Table ${n}" style="display:block; border-radius:inherit;">
    </div>
    <div class="qr-url">${url}</div>
    <div class="qr-btns">
      <button class="btn btn-outline" style="flex:1;font-size:13px" onclick="openMenu(${n})">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Preview
      </button>
      <button class="btn btn-primary" style="flex:1;font-size:13px" onclick="window.open('${qrImageUrl}', '_blank')">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download
      </button>
    </div>
  </div>`;
}
 
/* Fake SVG generator removed as we are now using a real QR Code API */
