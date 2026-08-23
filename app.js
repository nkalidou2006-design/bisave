// =========================================================
// BISAVE — logique partagée (démo front-end, sans backend)
// =========================================================

// ---------- DONNEES ----------
// Aucune donnée de démonstration : l'app démarre vide, prête pour
// de vrais clients, produits et commandes.
let clients = [];
let products = [];

const CLIENTS_KEY = 'bisave_clients';
const PRODUCTS_KEY = 'bisave_products';
const STORAGE_KEY = 'bisave_actions';

function loadClients(){
  const saved = sessionStorage.getItem(CLIENTS_KEY);
  clients = saved ? JSON.parse(saved) : [];
  return clients;
}
function saveClients(){ sessionStorage.setItem(CLIENTS_KEY, JSON.stringify(clients)); }

function loadProducts(){
  const saved = sessionStorage.getItem(PRODUCTS_KEY);
  products = saved ? JSON.parse(saved) : [];
  return products;
}
function saveProducts(){ sessionStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); }

function loadActions(){
  const saved = sessionStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}
function saveActions(actions){ sessionStorage.setItem(STORAGE_KEY, JSON.stringify(actions)); }

function clientById(id){ return clients.find(c => c.id === id); }
function fmtFCFA(n){ return n.toLocaleString('fr-FR').replace(/\u202f|,/g, '.') + ' FCFA'; }

const groupMeta = {
  urgent:   { label: 'Urgent' },
  today:    { label: "Aujourd'hui" },
  upcoming: { label: 'À venir' },
};

// =========================================================
// PAGES AUTH (login.html / signup.html) — démonstration
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm){
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // Démonstration : aucune vérification réelle pour l'instant
      // (sera remplacé par une vraie authentification Supabase)
      window.location.href = 'index.html';
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm){
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const shop = document.getElementById('signup-shop').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const phone = document.getElementById('signup-phone').value.trim();
      const password = document.getElementById('signup-password').value;
      const errorBox = document.getElementById('form-error');

      if (!shop || !email || !phone || password.length < 8){
        errorBox.classList.add('is-visible');
        return;
      }
      errorBox.classList.remove('is-visible');
      window.location.href = 'index.html';
    });
  }
});

// =========================================================
// TABLEAU DE BORD (index.html)
// =========================================================
function renderDashboard(){
  const actions = loadActions();
  const container = document.getElementById('groups');
  const emptyState = document.getElementById('empty-state');
  container.innerHTML = '';

  const order = ['urgent', 'today', 'upcoming'];
  const pending = actions.filter(a => !a.done);

  const urgentCount = actions.filter(a => a.group === 'urgent' && !a.done).length;
  const todayCount = actions.filter(a => a.group === 'today' && !a.done).length;
  const amountTotal = actions.filter(a => !a.done && a.amount).reduce((sum, a) => sum + a.amount, 0);

  document.getElementById('kpi-urgent').textContent = urgentCount;
  document.getElementById('kpi-today').textContent = todayCount;
  document.getElementById('kpi-amount').textContent = fmtFCFA(amountTotal);

  if (pending.length === 0){
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  order.forEach(key => {
    const items = actions.filter(a => a.group === key);
    if (items.length === 0) return;

    const group = document.createElement('section');
    group.className = `group group--${key}`;
    group.innerHTML = `
      <div class="group__header">
        <span class="group__dot"></span>
        <span class="group__label">${groupMeta[key].label}</span>
        <span class="group__count">${items.filter(i=>!i.done).length}</span>
      </div>
      <div class="table"></div>
    `;
    const table = group.querySelector('.table');

    items.forEach(action => {
      const client = clientById(action.clientId);
      const row = document.createElement('div');
      row.className = `row${action.done ? ' is-done' : ''}`;
      row.innerHTML = `
        <span class="row__tag"></span>
        <div class="row__body">
          <div class="row__name">${client.name}</div>
          <div class="row__action">${action.type}</div>
          ${action.meta ? `<div class="row__meta">${action.meta}</div>` : ''}
        </div>
        ${action.amount ? `<div class="row__amount">${fmtFCFA(action.amount)}</div>` : ''}
        <button class="row__check${action.done ? ' is-checked' : ''}" aria-label="Marquer comme fait">✓</button>
      `;
      row.querySelector('.row__check').addEventListener('click', () => {
        action.done = !action.done;
        saveActions(actions);
        renderDashboard();
      });
      table.appendChild(row);
    });

    container.appendChild(group);
  });
}

// =========================================================
// ASSISTANT NOUVELLE COMMANDE (nouvelle-commande.html)
// =========================================================
function initOrderWizard(){
  loadClients();
  loadProducts();
  let currentStep = 1;
  let draft = { clientId: null, newClient: null, productId: null, customProduct: null, qty: 1, note: '' };

  function currentUnitPrice(){
    if (draft.productId) return products.find(p => p.id === draft.productId).price;
    if (draft.customProduct) return draft.customProduct.price || 0;
    return 0;
  }

  function renderClientList(query){
    const list = document.getElementById('client-list');
    list.innerHTML = '';

    if (clients.length === 0){
      list.innerHTML = '<p style="font-size:13px;color:var(--muted);margin:4px 0 0;">Aucun client encore enregistré — crée le premier ci-dessous.</p>';
      return;
    }

    const q = query.trim().toLowerCase();
    const filtered = q
      ? clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      : clients.slice(0, 4);

    filtered.forEach(c => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `pick${draft.clientId === c.id ? ' is-selected' : ''}`;
      btn.innerHTML = `<span class="pick__name">${c.name}</span><span class="pick__meta">${c.phone}</span>`;
      btn.addEventListener('click', () => {
        draft.clientId = c.id;
        draft.newClient = null;
        document.getElementById('new-client-form').style.display = 'none';
        renderClientList(document.getElementById('client-search').value);
      });
      list.appendChild(btn);
    });
  }

  function renderProductGrid(){
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '';

    if (products.length === 0){
      grid.innerHTML = '<p style="font-size:13px;color:var(--muted);margin:0;grid-column:1/-1;">Aucun produit encore ajouté — utilise "+ Produit hors liste" ci-dessous.</p>';
      return;
    }

    products.forEach(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `product-item${draft.productId === p.id ? ' is-selected' : ''}`;
      btn.innerHTML = `<div class="product-item__name">${p.name}</div><div class="product-item__price">${fmtFCFA(p.price)}</div>`;
      btn.addEventListener('click', () => {
        draft.productId = p.id;
        draft.customProduct = null;
        document.getElementById('custom-product-form').style.display = 'none';
        renderProductGrid();
        updateTotal();
      });
      grid.appendChild(btn);
    });
  }

  function updateQty(n){
    draft.qty = Math.max(1, n);
    document.getElementById('qty-value').textContent = draft.qty;
    updateTotal();
  }
  function updateTotal(){
    document.getElementById('total-value').textContent = fmtFCFA(currentUnitPrice() * draft.qty);
  }

  function fillRecap(){
    const clientLabel = draft.clientId ? clientById(draft.clientId).name : (draft.newClient ? draft.newClient.name : '—');
    const productLabel = draft.productId ? products.find(p => p.id === draft.productId).name : (draft.customProduct ? draft.customProduct.name : '—');
    document.getElementById('recap-client').textContent = clientLabel;
    document.getElementById('recap-product').textContent = productLabel;
    document.getElementById('recap-qty').textContent = draft.qty;
    document.getElementById('recap-total').textContent = fmtFCFA(currentUnitPrice() * draft.qty);
  }

  function goToStep(n){
    currentStep = n;
    document.querySelectorAll('.wizard__panel').forEach(p => p.classList.toggle('is-active', Number(p.dataset.panel) === n));
    document.querySelectorAll('.wizard__step').forEach(s => {
      const sn = Number(s.dataset.step);
      s.classList.toggle('is-active', sn === n);
      s.classList.toggle('is-done', sn < n);
    });
    document.getElementById('step-back').disabled = n === 1;
    document.getElementById('step-next').textContent = n === 4 ? 'Enregistrer' : 'Continuer';
    if (n === 4) fillRecap();
  }

  document.getElementById('client-search').addEventListener('input', (e) => renderClientList(e.target.value));
  document.getElementById('show-new-client').addEventListener('click', () => {
    const form = document.getElementById('new-client-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('show-custom-product').addEventListener('click', () => {
    const form = document.getElementById('custom-product-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('qty-minus').addEventListener('click', () => updateQty(draft.qty - 1));
  document.getElementById('qty-plus').addEventListener('click', () => updateQty(draft.qty + 1));

  document.getElementById('step-back').addEventListener('click', () => { if (currentStep > 1) goToStep(currentStep - 1); });
  document.getElementById('step-next').addEventListener('click', () => {
    if (currentStep === 1){
      const nameField = document.getElementById('new-client-name');
      const phoneField = document.getElementById('new-client-phone');
      if (document.getElementById('new-client-form').style.display === 'block' && nameField.value.trim()){
        draft.newClient = { name: nameField.value.trim(), phone: phoneField.value.trim() };
        draft.clientId = null;
      }
      if (!draft.clientId && !draft.newClient){ nameField.focus(); return; }
      goToStep(2);
    } else if (currentStep === 2){
      const nameField = document.getElementById('custom-product-name');
      const priceField = document.getElementById('custom-product-price');
      if (document.getElementById('custom-product-form').style.display === 'block' && nameField.value.trim()){
        draft.customProduct = { name: nameField.value.trim(), price: Number(priceField.value) || 0 };
        draft.productId = null;
      }
      if (!draft.productId && !draft.customProduct){ nameField.focus(); return; }
      updateTotal();
      goToStep(3);
    } else if (currentStep === 3){
      goToStep(4);
    } else if (currentStep === 4){
      saveOrder();
    }
  });

  function saveOrder(){
    const actions = loadActions();
    let clientId = draft.clientId;

    if (!clientId){
      const newId = 'c' + (clients.length + 1) + '_' + Date.now();
      clients.push({ id: newId, name: draft.newClient.name, phone: draft.newClient.phone || '—' });
      saveClients();
      clientId = newId;
    }

    actions.unshift({
      id: 'a' + (actions.length + 1),
      clientId,
      group: 'today',
      type: 'Livrer',
      amount: currentUnitPrice() * draft.qty,
      meta: document.getElementById('recap-note').value.trim() || 'Nouvelle commande',
      done: false,
    });
    saveActions(actions);

    window.location.href = 'index.html';
  }

  renderClientList('');
  renderProductGrid();
  goToStep(1);
}
