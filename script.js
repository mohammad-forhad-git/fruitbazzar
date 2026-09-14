// ==========================================
// ১. আপনার Google Sheet CSV লিংক নিচে বসান:
// ==========================================
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT0O4t6-bzj-7dMxEyerBlQl1uKVcKNe6c3VvKI8y_mvET40ECbtL57q_OXf-Jha3EBWdcYm0zW_H_6/pub?output=csv";

// ২. আপনার অর্ডার নেওয়ার WhatsApp নম্বর (বাংলাদেশি কোড 88 সহ):
const WHATSAPP_PHONE = "8801700000000";

// গুগল শিট অফলাইন থাকলে বা প্রথমবার টেস্টের জন্য ডিফল্ট ডাটা:
const DEFAULT_PRODUCTS = [
  { id: "1", name: "চাঁপাইনবাবগঞ্জের প্রিমিয়াম আম", category: "দেশি ফল", price: 180, old_price: 220, unit: "১ কেজি", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=400&q=80", badge: "সেরা পছন্দ", in_stock: true },
  { id: "2", name: "অস্ট্রেলিয়ান ফ্রেশ হানি আপেল", category: "আমদানিকৃত ফল", price: 360, old_price: 400, unit: "১ কেজি", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=400&q=80", badge: "১০% ছাড়", in_stock: true },
  { id: "3", name: "রসালো সাউথ আফ্রিকান মাল্টা", category: "আমদানিকৃত ফল", price: 260, old_price: 290, unit: "১ কেজি", image: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?auto=format&fit=crop&w=400&q=80", badge: "তাজা স্টক", in_stock: true },
  { id: "4", name: "মদিনার খাঁটি আজওয়া খেজুর", category: "খেজুর ও ড্রাই ফ্রুটস", price: 1150, old_price: 1350, unit: "১ কেজি", image: "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=400&q=80", badge: "প্রিমিয়াম", in_stock: true },
  { id: "5", name: "ফার্ম ফ্রেশ লাল ড্রাগন ফল", category: "দেশি ফল", price: 320, old_price: 350, unit: "১ কেজি", image: "https://images.unsplash.com/photo-1527325678964-54921661f888?auto=format&fit=crop&w=400&q=80", badge: "জনপ্রিয়", in_stock: true },
  { id: "6", name: "পারিবারিক গিফট ফ্রুট বক্স (মিক্সড)", category: "ফ্রুট বক্স / প্যাকেজ", price: 2100, old_price: 2400, unit: "১ প্যাকেজ", image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80", badge: "গিফট প্যাক", in_stock: true }
];

let allProducts = [];
let filteredProducts = [];
let activeCategory = 'all';
let cart = JSON.parse(localStorage.getItem('fruitbazar_cart')) || [];

document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  updateCartBadge();
});

// CSV Parser
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    if (!row || row.length < 2) continue;
    const obj = {};
    headers.forEach((h, index) => {
      obj[h] = row[index] ? row[index].trim().replace(/^"|"$/g, '') : '';
    });
    if (obj.name) {
      items.push({
        id: obj.id || String(i),
        name: obj.name,
        category: obj.category || 'সাধারণ',
        price: Number(obj.price) || 0,
        old_price: Number(obj.old_price) || 0,
        unit: obj.unit || '১ কেজি',
        image: obj.image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80',
        badge: obj.badge || '',
        in_stock: String(obj.in_stock).toLowerCase() !== 'false'
      });
    }
  }
  return items;
}

// Fetch from Google Sheet
async function fetchProducts() {
  const loadingEl = document.getElementById('loadingState');
  const countStatus = document.getElementById('productCountStatus');

  try {
    if (GOOGLE_SHEET_CSV_URL && !GOOGLE_SHEET_CSV_URL.includes('SAMPLE-KEY')) {
      const response = await fetch(GOOGLE_SHEET_CSV_URL);
      // এভাবে পরিবর্তন করুন (ক্যাশ এড়াতে):
      const response = await fetch(`${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`);
      const csvText = await response.text();
      const parsedData = parseCSV(csvText);

      if (parsedData.length > 0) {
        allProducts = parsedData;
        countStatus.innerText = `${allProducts.length}টি তাজা ফল লাইভ`;
      } else { throw new Error('Empty Sheet'); }
    } else {
      allProducts = DEFAULT_PRODUCTS;
      countStatus.innerText = `ডেমো ডাটা (${allProducts.length}টি পণ্য)`;
    }
  } catch (err) {
    allProducts = DEFAULT_PRODUCTS;
    countStatus.innerText = `অফলাইন ডাটা (${allProducts.length}টি পণ্য)`;
  } finally {
    loadingEl.style.display = 'none';
    filteredProducts = [...allProducts];
    renderProducts();
  }
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '';

  filteredProducts.forEach(item => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div>
        <div class="product-thumb-wrap">
          <img src="${item.image}" alt="${item.name}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=400&q=80'">
          ${item.badge ? `<span class="badge-tag">${item.badge}</span>` : ''}
        </div>
        <div class="product-info">
          <span class="product-cat">${item.category}</span>
          <h3 class="product-name">${item.name}</h3>
          <div class="product-unit">${item.unit}</div>
          <div class="product-price-box">
            <span class="current-price">৳ ${item.price}</span>
            ${item.old_price ? `<span class="old-price">৳ ${item.old_price}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="product-actions">
        <button class="btn-order-now" onclick="addToCart('${item.id}')">
          <i class="fa-solid fa-cart-plus"></i> অর্ডার করুন
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Category & Search
function filterCategory(cat, btn) {
  activeCategory = cat;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  applyFilters();
}
function handleSearch() { applyFilters(document.getElementById('searchInput').value.trim().toLowerCase()); }
function handleMobileSearch() { applyFilters(document.getElementById('mobileSearchInput').value.trim().toLowerCase()); }

function applyFilters(searchQuery = '') {
  filteredProducts = allProducts.filter(item => {
    const matchesCat = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery) || item.category.toLowerCase().includes(searchQuery);
    return matchesCat && matchesSearch;
  });
  renderProducts();
}

// Cart Actions
function addToCart(productId) {
  const p = allProducts.find(x => String(x.id) === String(productId));
  if (!p) return;
  const exist = cart.find(x => String(x.id) === String(productId));
  if (exist) { exist.qty += 1; }
  else { cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, unit: p.unit, qty: 1 }); }
  saveCart();
  updateCartBadge();
  showToast(`"${p.name}" ব্যাগে যোগ হয়েছে!`);
  openCartModal();
}

function changeQty(id, delta) {
  const item = cart.find(x => String(x.id) === String(id));
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(x => String(x.id) !== String(id));
  saveCart();
  renderCartDrawer();
  updateCartBadge();
}

function removeFromCart(id) {
  cart = cart.filter(x => String(x.id) !== String(id));
  saveCart();
  renderCartDrawer();
  updateCartBadge();
}

function saveCart() { localStorage.setItem('fruitbazar_cart', JSON.stringify(cart)); }
function updateCartBadge() { document.getElementById('cartCount').innerText = cart.reduce((s, i) => s + i.qty, 0); }

function openCartModal() { document.getElementById('cartModalOverlay').classList.add('active'); renderCartDrawer(); }
function closeCartModal(e) {
  if (!e || e.target.id === 'cartModalOverlay' || e.target.classList.contains('close-btn')) {
    document.getElementById('cartModalOverlay').classList.remove('active');
  }
}

function renderCartDrawer() {
  const list = document.getElementById('cartItemList');
  const totalPriceEl = document.getElementById('cartTotalPrice');
  list.innerHTML = '';

  if (cart.length === 0) {
    list.innerHTML = `<p style="text-align:center; color:#6b7280; padding:40px 0;">আপনার ব্যাগ খালি।</p>`;
    totalPriceEl.innerText = '৳ ০';
    return;
  }

  let total = 0;
  cart.forEach(i => {
    const sub = i.price * i.qty;
    total += sub;
    list.innerHTML += `
      <div class="cart-item">
        <img src="${i.image}">
        <div class="cart-item-details">
          <div class="cart-item-title">${i.name}</div>
          <div class="cart-item-price">৳ ${i.price} (${i.unit})</div>
          <div style="margin-top:4px;">
            <button class="qty-btn" onclick="changeQty('${i.id}', -1)">-</button>
            <span style="font-size:13px; font-weight:bold; margin:0 6px;">${i.qty}</span>
            <button class="qty-btn" onclick="changeQty('${i.id}', 1)">+</button>
          </div>
        </div>
        <button class="cart-remove-btn" onclick="removeFromCart('${i.id}')"><i class="fa-solid fa-trash-can"></i></button>
      </div>`;
  });
  totalPriceEl.innerText = `৳ ${total}`;
}

// WhatsApp Checkout
function checkoutWhatsApp() {
  if (cart.length === 0) return alert('ব্যাগ খালি!');
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();

  if (!name || !phone || !address) return alert('নাম, মোবাইল ও ঠিকানা পূরণ করুন।');

  let total = 0, itemsText = '';
  cart.forEach((i, idx) => {
    const sub = i.price * i.qty;
    total += sub;
    itemsText += `${idx+1}. ${i.name} (${i.qty} x ৳${i.price}) = ৳${sub}\n`;
  });

  const msg = `*অর্ডার ফর্ম: FruitBazar*\n\n` +
    `*গ্রাহক:* ${name}\n` +
    `*মোবাইল:* ${phone}\n` +
    `*ঠিকানা:* ${address}\n\n` +
    `*পণ্যের তালিকা:*\n${itemsText}\n` +
    `*মোট বিল:* ৳ ${total} (ডেলিভারি চার্জ প্রযোজ্য)\n` +
    `পদ্ধতি: ক্যাশ অন ডেলিভারি (COD)`;

  window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(msg)}`, '_blank');
}

function checkoutDirect() {
  if (cart.length === 0) return alert('ব্যাগ খালি!');
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  if (!name || !phone || !address) return alert('সব তথ্য পূরণ করুন।');

  alert(`ধন্যবাদ ${name}! অর্ডার রিসিভ হয়েছে। আমাদের টিম খুব দ্রুত ${phone} নম্বরে যোগাযোগ করবে।`);
  cart = [];
  saveCart();
  updateCartBadge();
  closeCartModal();
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
