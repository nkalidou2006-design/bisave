// =========================================================
// BISAVE — données de démonstration + logique d'interface
// =========================================================

const clients = [
  { id: 'c1', name: 'Fatou Diop', phone: '77 123 45 67' },
  { id: 'c2', name: 'Moussa Ndiaye', phone: '78 234 56 78' },
  { id: 'c3', name: 'Awa Sow', phone: '76 345 67 89' },
  { id: 'c4', name: 'Khady Ndiaye', phone: '77 456 78 90' },
  { id: 'c5', name: 'Ibrahima Fall', phone: '70 567 89 01' },
  { id: 'c6', name: 'Ousmane Sy', phone: '78 678 90 12' },
];

const products = [
  { id: 'p1', name: 'Robe Bazin', price: 22500 },
  { id: 'p2', name: 'Parfum', price: 12500 },
  { id: 'p3', name: 'iPhone 13', price: 350000 },
  { id: 'p4', name: 'Sac à main', price: 18000 },
];

let actions = [
  { id: 'a1', clientId: 'c1', group: 'urgent', type: 'Demander paiement', amount: 45000, meta: null, done: false },
  { id: 'a2', clientId: 'c2', group: 'urgent', type: 'Relancer', amount: null, meta: 'Client intéressé · iPhone 13', done: false },
  { id: 'a3', clientId: 'c3', group: 'today', type: 'Préparer commande', amount: null, meta: '2x Bazin riche', done: false },
  { id: 'a4', clientId: 'c4', group: 'today', type: 'Demander paiement', amount: 12500, meta: null, done: false },
  { id: 'a5', clientId: 'c5', group: 'upcoming', type: 'Livrer', amount: null, meta: 'Commande confirmée · Ouakam', done: false },
  { id: 'a6', clientId: 'c6', group: 'upcoming', type: 'Relancer', amount: null, meta: 'Client intéressé · Parfum', done: false },
];

const groupMeta = {
  urgent:   { label: 'Urgent',    className: 'group--urgent' },
  today:    { label: "Aujourd'hui", className: 'group--today' },
  upcoming: { label: 'À venir',   className: 'group--upcoming' },
};

function clientById(id){ return clients.find(c => c.id === id); }
function fmtFCFA(n){ return n.toLocaleString('fr-FR').replace(/\u202f|,/g, '.') + ' FCFA'; }

// ---------- RENDU DE LA LISTE DU JOUR ----------
function renderGroups(){
  const container = document.getElementById('groups');
  const emptyState = document.getElementById('empty-state');
  container.innerHTML = '';

  const order = ['urgent', 'today', 'upcoming'];
  const pending = actions.filter(a => !a.done);

  document.getElementById('hero-count').textContent = pending.length;
  document.getElementById('hero-sub').style.display = pending.length ? '' : 'none';

  if (pending.length === 0){
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  order.forEach(key => {
    const items = actions.filter(a => a.group === key);
    if (items.length === 0) return;

    const group = document.createElement('section');
    group.className = `group ${groupMeta[key].className}`;

    const header = document.createElement('div');
    header.className = 'group__header';
    header.innerHTML = `
      <span class="group__dot"></span>
      <span class="group__label">${groupMeta[key].label}</span>
      <span class="group__count">${items.filter(i=>!i.done).length}</span>
    `;
    group.appendChild(header);

    const cards = document.createElement('div');
    cards.className = 'cards';

    items.forEach(action => {
      const client = clientById(action.clientId);
      const card = document.createElement('div');
      card.className = `card${action.done ? ' is-done' : ''}`;
      card.innerHTML = `
        <div class="card__body">
          <div class="card__name">${client.name}</div>
          <div class="card__action">${action.type}</div>
          ${action.meta ? `<div class="card__meta">${action.meta}</div>` : ''}
          ${action.amount ? `<div class="card__amount">${fmtFCFA(action.amount)}</div>` : ''}
        </div>
        <button class="check${action.done ? ' is-checked' : ''}" aria-label="Marquer comme fait">✓</button>
      `;
      card.querySelector('.check').addEventListener('click', () => {
        action.done = !action.done;
        renderGroups();
      });
      cards.appendChild(card);
    });

    group.appendChild(cards);
    container.appendChild(group);
  });
}

function setHeroDate(){
  const el = document.getElementById('hero-date');
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const s = fmt.format(d);
  el.textContent = s.charAt(0).toUpperCase() + s.slice(1);
}

// =========================================================
// FORMULAIRE D'AJOUT DE COMMANDE (4 étapes)
// =========================================================
const sheetBackdrop = document.getElementById('sheet-backdrop');
let currentStep = 1;
let draft = { clientId: null, newClient: null, productId: null, customProduct: null, qty: 1, note: '' };

function openSheet(){
  currentStep = 1;
  draft = { clientId: null, newClient: null, productId: null, customProduct: null, qty: 1, note: '' };
  document.getElementById('client-search').value = '';
  document.getElementById('new-client-form').hidden = true;
  document.getElementById('new-client-name').value = '';
  document.getElementById('new-client-phone').value = '';
  document.getElementById('custom-product-form').hidden = true;
  document.getElementById('custom-product-name').value = '';
  document.getElementById('custom-product-price').value = '';
  document.getElementById('recap-note').value = '';
  renderClientList('');
  renderProductGrid();
  updateQty(1);
  goToStep(1);
  sheetBackdrop.hidden = false;
}
function closeSheet(){ sheetBackdrop.hidden = true; }

document.getElementById('open-add-order').addEventListener('click', openSheet);
document.getElementById('sheet-close').addEventListener('click', closeSheet);
sheetBackdrop.addEventListener('click', (e) => { if (e.target === sheetBackdrop) closeSheet(); });

function goToStep(n){
  currentStep = n;
  document.querySelectorAll('.step').forEach(p => {
    p.hidden = Number(p.dataset.stepPanel) !== n;
  });
  document.querySelectorAll('.step-dot').forEach(dot => {
    const s = Number(dot.dataset.step);
    dot.classList.toggle('is-active', s === n);
    dot.classList.toggle('is-done', s < n);
  });
  document.getElementById('step-back').hidden = n === 1;
  document.getElementById('step-next').textContent = n === 4 ? 'Enregistrer' : 'Continuer';
  if (n === 4) fillRecap();
}

// ---- Etape 1 : client ----
function renderClientList(query){
  const list = document.getElementById('client-list');
  list.innerHTML = '';
  const q = query.trim().toLowerCase();
  const filtered = q
    ? clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q))
    : clients.slice(0, 4);

  filtered.forEach(c => {
    const btn = document.createElement('button');
    btn.className = `client-item${draft.clientId === c.id ? ' is-selected' : ''}`;
    btn.innerHTML = `<span class="client-item__name">${c.name}</span><span class="client-item__phone">${c.phone}</span>`;
    btn.addEventListener('click', () => {
      draft.clientId = c.id;
      draft.newClient = null;
      document.getElementById('new-client-form').hidden = true;
      renderClientList(document.getElementById('client-search').value);
    });
    list.appendChild(btn);
  });
}
document.getElementById('client-search').addEventListener('input', (e) => renderClientList(e.target.value));
document.getElementById('show-new-client').addEventListener('click', () => {
  const form = document.getElementById('new-client-form');
  form.hidden = !form.hidden;
});

// ---- Etape 2 : produit ----
function renderProductGrid(){
  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';
  products.forEach(p => {
    const btn = document.createElement('button');
    btn.className = `product-item${draft.productId === p.id ? ' is-selected' : ''}`;
    btn.innerHTML = `<div class="product-item__name">${p.name}</div><div class="product-item__price">${fmtFCFA(p.price)}</div>`;
    btn.addEventListener('click', () => {
      draft.productId = p.id;
      draft.customProduct = null;
      document.getElementById('custom-product-form').hidden = true;
      renderProductGrid();
      updateTotal();
    });
    grid.appendChild(btn);
  });
}
document.getElementById('show-custom-product').addEventListener('click', () => {
  const form = document.getElementById('custom-product-form');
  form.hidden = !form.hidden;
});

// ---- Etape 3 : quantité ----
function currentUnitPrice(){
  if (draft.productId) return products.find(p => p.id === draft.productId).price;
  if (draft.customProduct) return draft.customProduct.price || 0;
  return 0;
}
function updateQty(n){
  draft.qty = Math.max(1, n);
  document.getElementById('qty-value').textContent = draft.qty;
  updateTotal();
}
function updateTotal(){
  const total = currentUnitPrice() * draft.qty;
  document.getElementById('total-value').textContent = fmtFCFA(total);
}
document.getElementById('qty-minus').addEventListener('click', () => updateQty(draft.qty - 1));
document.getElementById('qty-plus').addEventListener('click', () => updateQty(draft.qty + 1));

// ---- Etape 4 : récap ----
function fillRecap(){
  const clientLabel = draft.clientId ? clientById(draft.clientId).name : (draft.newClient ? draft.newClient.name : '—');
  const productLabel = draft.productId ? products.find(p => p.id === draft.productId).name : (draft.customProduct ? draft.customProduct.name : '—');
  document.getElementById('recap-client').textContent = clientLabel;
  document.getElementById('recap-product').textContent = productLabel;
  document.getElementById('recap-qty').textContent = draft.qty;
  document.getElementById('recap-total').textContent = fmtFCFA(currentUnitPrice() * draft.qty);
}

// ---- Navigation ----
document.getElementById('step-back').addEventListener('click', () => {
  if (currentStep > 1) goToStep(currentStep - 1);
});
document.getElementById('step-next').addEventListener('click', () => {
  if (currentStep === 1){
    const nameField = document.getElementById('new-client-name');
    const phoneField = document.getElementById('new-client-phone');
    if (!document.getElementById('new-client-form').hidden && nameField.value.trim()){
      draft.newClient = { name: nameField.value.trim(), phone: phoneField.value.trim() };
      draft.clientId = null;
    }
    if (!draft.clientId && !draft.newClient){
      nameField.focus();
      return;
    }
    goToStep(2);
  } else if (currentStep === 2){
    const nameField = document.getElementById('custom-product-name');
    const priceField = document.getElementById('custom-product-price');
    if (!document.getElementById('custom-product-form').hidden && nameField.value.trim()){
      draft.customProduct = { name: nameField.value.trim(), price: Number(priceField.value) || 0 };
      draft.productId = null;
    }
    if (!draft.productId && !draft.customProduct){
      nameField.focus();
      return;
    }
    updateTotal();
    goToStep(3);
  } else if (currentStep === 3){
    goToStep(4);
  } else if (currentStep === 4){
    saveOrder();
  }
});

function saveOrder(){
  const clientName = draft.clientId ? clientById(draft.clientId).name : draft.newClient.name;
  let clientId = draft.clientId;

  if (!clientId){
    const newId = 'c' + (clients.length + 1);
    clients.push({ id: newId, name: draft.newClient.name, phone: draft.newClient.phone || '—' });
    clientId = newId;
  }

  actions.unshift({
    id: 'a' + (actions.length + 1),
    clientId,
    group: 'today',
    type: 'Livrer',
    amount: currentUnitPrice() * draft.qty,
    meta: draft.note ? draft.note : 'Nouvelle commande',
    done: false,
  });

  closeSheet();
  renderGroups();
  showToast(`Commande de ${clientName} enregistrée`);
}

// ---- Toast ----
let toastTimer;
function showToast(text){
  const toast = document.getElementById('toast');
  document.getElementById('toast-text').textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
}

// ---- Init ----
setHeroDate();
renderGroups();
