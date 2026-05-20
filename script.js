// ===== FLAVOR DATA =====
const flavors = [
  { name:"Strawberry Swirl", desc:"Beautiful strawberry and cheesecake swirl.", price:2.00, scoop:"scoop-strawberry", cat:["all","classics"], img:"assets/strawberry_scoop.png" },
  { name:"Salted Caramel", desc:"Beautiful flair caramel with salted caramel.", price:2.00, scoop:"scoop-caramel", cat:["all","classics"], img:"assets/caramel_scoop.png" },
  { name:"Dark Chocolate", desc:"Chocolate velvet richness with taste and chocolate.", price:2.00, scoop:"scoop-chocolate", cat:["all","classics"], img:"assets/DARK CHOCOLATE.png" },
  { name:"Vanilla Bean", desc:"Classic and rich, a timeless favorite.", price:2.00, scoop:"scoop-vanilla", cat:["all","classics"], img:"assets/VANILLA BEAN.png" },
  { name:"Mango Sorbet", desc:"Fresh, tropical mango sorbet.", price:2.00, scoop:"scoop-mango", cat:["all","vegan"], img:"assets/MANGO SORBET.png" },
  { name:"Mint Choc Chip", desc:"Cool mint with chocolate chip pieces.", price:2.50, scoop:"scoop-mint", cat:["all","classics"], img:"assets/MINT CHOC CHIP.png" },
  { name:"Blueberry Bliss", desc:"Sweet blueberry cream sensation.", price:2.00, scoop:"scoop-blueberry", cat:["all","vegan"], img:"assets/BLUEBERRY BLISS.png" },
  { name:"Pistachio Dream", desc:"Rich pistachio with roasted nut pieces.", price:3.00, scoop:"scoop-pistachio", cat:["all"], img:"assets/PISTACHIO DREAM.png" },
  { name:"Bubblegum Pop", desc:"Fun pink bubblegum burst of flavor.", price:2.50, scoop:"scoop-bubblegum", cat:["all"], img:"assets/BUBBLEGUM POP.png" },
  { name:"Coffee Crunch", desc:"Bold espresso with toffee crunch.", price:3.00, scoop:"scoop-coffee", cat:["all","classics"], img:"assets/COFFEE CRUNCH.png" },
  { name:"Lavender Dream", desc:"Delicate floral lavender cream.", price:3.00, scoop:"scoop-lavender", cat:["all"], img:"assets/LAVENDER DREAM.png" },
  { name:"Spiced Pumpkin", desc:"Warm autumn spices and pumpkin.", price:3.00, scoop:"scoop-pumpkin", cat:["all"], img:"assets/SPICED PUMPKIN.png" },
  { name:"Coconut Cloud", desc:"Creamy tropical coconut bliss.", price:2.50, scoop:"scoop-coconut", cat:["all","vegan"], img:"assets/COCONUT CLOUD.png" },
  { name:"Black Mango", desc:"Dark chocolate meets mango twist.", price:3.50, scoop:"scoop-blackmango", cat:["all"], img:"assets/BLACK MANGO.png" }
];

// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem('scoops_cart')) || [];
let selectedScoops = [];
let selectedToppings = [];

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  renderCarousel();
  renderShopGrid('all');
  renderBuilderScoops();
  initScrollAnimations();
  initNavbarScroll();
  initSprinkles();
  updateCart(); // Load saved cart
  initAuth(); // Initialize auth state
});

// ===== AUTH UI =====
let loginFromCheckout = false;

function initAuth() {
  const user = JSON.parse(localStorage.getItem('scoops_user'));
  const loginNav = document.getElementById('nav-auth-login');
  const profileNav = document.getElementById('nav-auth-profile');
  
  if (user) {
    if (loginNav) loginNav.style.display = 'none';
    if (profileNav) {
      profileNav.style.display = 'block';
      const sidebarName = document.getElementById('profile-sidebar-name');
      const mainName = document.getElementById('profile-main-name');
      const mainPhone = document.getElementById('profile-main-phone');
      
      if (sidebarName) sidebarName.textContent = user.name;
      if (mainName) mainName.textContent = user.name;
      if (mainPhone) mainPhone.textContent = user.phone;
      
      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      const navInitial = document.getElementById('nav-avatar-initial');
      const profileInitial = document.getElementById('profile-avatar-initial');
      if (navInitial) navInitial.textContent = initial;
      if (profileInitial) profileInitial.textContent = initial;
    }
  } else {
    if (loginNav) loginNav.style.display = 'block';
    if (profileNav) profileNav.style.display = 'none';
  }
}

function openLoginModal(fromCheckout = false) {
  loginFromCheckout = fromCheckout;
  const loginModal = document.getElementById('login-modal');
  if (loginModal) loginModal.classList.add('active');
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-sidebar').classList.remove('open');
}

function logout() {
  localStorage.removeItem('scoops_user');
  initAuth();
  navigateTo('home');
  alert('You have been logged out.');
}

function switchProfileTab(tab) {
  const detailsTab = document.getElementById('profile-tab-details');
  const ordersTab = document.getElementById('profile-tab-orders');
  const detailsBtn = document.getElementById('tab-btn-details');
  const ordersBtn = document.getElementById('tab-btn-orders');
  
  if (!detailsTab || !ordersTab) return;

  if (tab === 'details') {
    detailsTab.style.display = 'block';
    ordersTab.style.display = 'none';
    detailsBtn.classList.add('active');
    ordersBtn.classList.remove('active');
  } else if (tab === 'orders') {
    detailsTab.style.display = 'none';
    ordersTab.style.display = 'block';
    detailsBtn.classList.remove('active');
    ordersBtn.classList.add('active');
    fetchOrderHistory();
  }
}

async function fetchOrderHistory() {
  const user = JSON.parse(localStorage.getItem('scoops_user'));
  if (!user) return;
  
  const list = document.getElementById('orders-list');
  list.innerHTML = '<p style="color: var(--text-muted);">Loading your orders...</p>';
  
  try {
    const response = await fetch(`http://localhost:3000/api/orders?phone=${encodeURIComponent(user.phone)}`);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    
    if (data.orders && data.orders.length > 0) {
      list.innerHTML = data.orders.map(order => `
        <div class="order-card" id="order-${order.id}">
          <div class="order-header">
            <div>
              <span class="order-id">#${order.id.slice(0, 8)}</span>
              <span class="order-date">${new Date(order.created_at).toLocaleDateString()}</span>
            </div>
            <button class="order-delete-btn" onclick="deleteOrder('${order.id}')" title="Delete Record">🗑️</button>
          </div>
          <div class="order-items">
            ${order.items.map(item => `<div>• ${item.name} (x${item.qty})</div>`).join('')}
          </div>
          <div class="order-total">
            Total: $${parseFloat(order.total_price).toFixed(2)}
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<p style="color: var(--text-muted); padding: 20px 0;">No past orders found. Time to treat yourself! 🍦</p>';
    }
  } catch (err) {
    console.error(err);
    list.innerHTML = '<p style="color: #ef4444;">Failed to load order history.</p>';
  }
}

async function deleteOrder(orderId) {
  const user = JSON.parse(localStorage.getItem('scoops_user'));
  if (!user) return;
  
  const confirmDel = confirm('Are you sure you want to delete this order record?');
  if (!confirmDel) return;
  
  const card = document.getElementById(`order-${orderId}`);
  if (card) card.style.opacity = '0.5';
  
  try {
    const response = await fetch(`http://localhost:3000/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phone })
    });
    
    if (response.ok) {
      if (card) card.remove();
      // Check if empty now
      const list = document.getElementById('orders-list');
      if (list && list.children.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); padding: 20px 0;">No past orders found. Time to treat yourself! 🍦</p>';
      }
    } else {
      if (card) card.style.opacity = '1';
      alert('Failed to delete order record.');
    }
  } catch (err) {
    console.error(err);
    if (card) card.style.opacity = '1';
    alert('Network error while deleting order.');
  }
}

async function deleteAccount() {
  const user = JSON.parse(localStorage.getItem('scoops_user'));
  if (!user) return;
  
  const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your past orders.');
  if (!confirmDelete) return;
  
  try {
    const response = await fetch('http://localhost:3000/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: user.phone })
    });
    
    if (response.ok) {
      localStorage.removeItem('scoops_user');
      initAuth();
      navigateTo('home');
      alert('Your account has been completely deleted. We are sad to see you go!');
    } else {
      const data = await response.json();
      alert(data.error || 'Failed to delete account.');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to connect to the server to delete account.');
  }
}

// ===== RENDER BUILDER SCOOPS =====
function renderBuilderScoops() {
  const container = document.getElementById('builder-scoops-list');
  if(!container) return;
  container.innerHTML = flavors.map(f => `
    <div class="builder-scoop-option" onclick="selectScoop(this, '${f.name}', ${f.img ? `'${f.img}'` : 'null'}, '${f.scoop}')">
      ${f.img ? `<img src="${f.img}" alt="${f.name}">` : `<div class="css-scoop ${f.scoop}" style="width:75px;height:75px;border-radius:50%;margin-bottom:12px;"></div>`}
      <span>${f.name}</span>
    </div>
  `).join('');
}

// ===== SPRINKLES CANVAS =====
function initSprinkles() {
  const canvas = document.getElementById('sprinkles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;

  function resize() {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#ff6b9d','#ffd700','#60a5fa','#4ade80','#f472b6','#a78bfa','#fb923c','#22d3ee','#e879f9','#facc15'];
  const sprinkles = [];
  for (let i = 0; i < 60; i++) {
    sprinkles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.7,
      w: 3 + Math.random() * 4,
      h: 1.5 + Math.random() * 2,
      angle: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 0.15 + Math.random() * 0.3,
      drift: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2
    });
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.01;
    sprinkles.forEach(s => {
      ctx.save();
      const floatY = Math.sin(t * s.speed * 2 + s.phase) * 8;
      ctx.translate(s.x, s.y + floatY);
      ctx.rotate(s.angle + Math.sin(t + s.phase) * 0.3);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.roundRect(-s.w / 2, -s.h / 2, s.w, s.h, 1);
      ctx.fill();
      ctx.restore();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ===== NAVIGATION =====
function toggleMobileMenu() {
  document.getElementById('mobile-menu').classList.toggle('is-active');
  document.getElementById('nav-links').classList.toggle('active');
}

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(initScrollAnimations, 100);
  
  // Close mobile menu if open
  document.getElementById('mobile-menu').classList.remove('is-active');
  document.getElementById('nav-links').classList.remove('active');
}

// ===== NAVBAR SCROLL =====
function initNavbarScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ===== RENDER FLAVOR CARD =====
function createFlavorCard(flavor) {
  const card = document.createElement('div');
  card.className = 'flavor-card';
  card.innerHTML = `
    ${flavor.img
      ? `<img src="${flavor.img}" alt="${flavor.name}" class="scoop-img real-img">`
      : `<div class="scoop-img ${flavor.scoop}"></div>`
    }
    <h3>${flavor.name.toUpperCase()}</h3>
    <p>${flavor.desc}</p>
    <div class="card-bottom">
      <span class="price">$${flavor.price.toFixed(2)}</span>
      <button class="btn-add" onclick="addToCart('${flavor.name}', ${flavor.price}, '${flavor.scoop}', ${flavor.img ? `'${flavor.img}'` : 'null'})">ADD</button>
    </div>
  `;
  return card;
}

// ===== HOME CAROUSEL =====
function renderCarousel() {
  const track = document.getElementById('carousel-track');
  const dots = document.getElementById('carousel-dots');
  track.innerHTML = '';
  const carouselFlavors = flavors.slice(0, 8);
  carouselFlavors.forEach(f => track.appendChild(createFlavorCard(f)));

  // Dots
  const dotCount = Math.ceil(carouselFlavors.length / 3);
  dots.innerHTML = '';
  for (let i = 0; i < dotCount; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.onclick = () => {
      track.scrollTo({ left: i * (240 * 3), behavior: 'smooth' });
      dots.querySelectorAll('.dot').forEach((d, j) => d.classList.toggle('active', j === i));
    };
    dots.appendChild(dot);
  }

  track.addEventListener('scroll', () => {
    const idx = Math.round(track.scrollLeft / (240 * 3));
    dots.querySelectorAll('.dot').forEach((d, j) => d.classList.toggle('active', j === idx));
  });

  // Auto-scroll
  setInterval(() => {
    let nextIdx = Math.round(track.scrollLeft / (240 * 3)) + 1;
    if (nextIdx >= dotCount) nextIdx = 0;
    track.scrollTo({ left: nextIdx * (240 * 3), behavior: 'smooth' });
  }, 5000);
}

// ===== SHOP GRID =====
function renderShopGrid(category) {
  const grid = document.getElementById('shop-grid');
  
  // Fade out current items first for a dynamic transition
  const currentCards = Array.from(grid.children);
  currentCards.forEach(card => {
    card.style.animation = 'none';
    card.style.opacity = '0';
    card.style.transform = 'scale(0.8) translateY(30px)';
    card.style.transition = 'all 0.3s ease';
  });
  
  setTimeout(() => {
    grid.innerHTML = '';
    const filtered = flavors.filter(f => f.cat.includes(category));
    filtered.forEach((f, i) => {
      const card = createFlavorCard(f);
      card.style.animationDelay = (i * 0.1) + 's'; // Staggered pop-in animation
      grid.appendChild(card);
    });
  }, currentCards.length ? 300 : 0);
}

function filterFlavors(cat, btn) {
  document.querySelectorAll('.flavor-tabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderShopGrid(cat);
}

// ===== CART =====
function addToCart(name, price, scoop, img) {
  cart.push({ name, price, scoop, img, customScoops: null });
  updateCart();
  // Flash animation on button
  const btn = event.target;
  btn.textContent = '✓';
  btn.style.background = 'var(--accent-pink)';
  btn.style.borderColor = 'var(--accent-pink)';
  setTimeout(() => {
    btn.textContent = 'ADD';
    btn.style.background = '';
    btn.style.borderColor = '';
  }, 800);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function updateCart() {
  localStorage.setItem('scoops_cart', JSON.stringify(cart));
  document.getElementById('cart-count').textContent = cart.length;
  const container = document.getElementById('cart-items');
  const footer = document.getElementById('cart-footer');

  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty"><div class="empty-icon">🍦</div><p>Your cart is empty</p></div>';
    footer.style.display = 'none';
    return;
  }

  footer.style.display = 'block';
  let total = 0;
  container.innerHTML = cart.map((item, i) => {
    total += item.price;
    return `<div class="cart-item">
      ${item.img ? `<img src="${item.img}" class="item-scoop" style="object-fit:cover;">` : `<div class="item-scoop ${item.scoop}"></div>`}
      <div class="item-info">
        <div class="item-name">${item.name}</div>
        <div class="item-price">$${item.price.toFixed(2)}</div>
      </div>
      <button class="item-remove" onclick="removeFromCart(${i})">✕</button>
    </div>`;
  }).join('');
  document.getElementById('cart-total-price').textContent = '$' + total.toFixed(2);
}

function toggleCart() {
  document.getElementById('cart-overlay').classList.toggle('open');
  document.getElementById('cart-sidebar').classList.toggle('open');
}

// ===== CREATE YOUR OWN =====
function selectScoop(el, name, imgUrl, colorClass) {
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    if (selectedScoops.length < 3) {
      selectedScoops.push({ name, img: imgUrl, color: colorClass });
    } else {
      el.classList.remove('selected');
      alert('Maximum of 3 scoops allowed per cone!');
      return;
    }
  } else {
    selectedScoops = selectedScoops.filter(s => s.name !== name);
  }
  updatePreview();
}

function selectTopping(el, name) {
  el.classList.toggle('selected');
  if (el.classList.contains('selected')) {
    selectedToppings.push(name);
  } else {
    selectedToppings = selectedToppings.filter(t => t !== name);
  }
  updatePreview();
}

function updatePreview() {
  const scoopsDiv = document.getElementById('preview-scoops');
  const toppingsDiv = document.getElementById('preview-toppings');
  const coneContainer = document.querySelector('.cone-container');
  
  if(!scoopsDiv) return;

  scoopsDiv.innerHTML = selectedScoops.map((s, i) => {
    const zIndex = 10 + i;
    const dropDelay = i * 0.15;
    if (s.img && s.img !== 'null') {
      return `<img src="${s.img}" class="stacked-scoop drop-anim" style="z-index:${zIndex}; animation-delay:${dropDelay}s;">`;
    } else {
      return `<div class="stacked-scoop drop-anim ${s.color}" style="z-index:${zIndex}; animation-delay:${dropDelay}s;"></div>`;
    }
  }).join('');
  
  toppingsDiv.innerHTML = selectedToppings.length > 0
    ? '+ ' + selectedToppings.join(', ')
    : '';

  // Dynamically scale and position the cone container based on number of scoops
  if (coneContainer) {
    if (selectedScoops.length === 0) {
      coneContainer.classList.remove('has-scoops');
      coneContainer.style.transform = 'scale(1)';
    } else {
      coneContainer.classList.add('has-scoops');
      if (selectedScoops.length === 1) {
        coneContainer.style.transform = 'scale(1)';
      } else if (selectedScoops.length === 2) {
        coneContainer.style.transform = 'scale(0.85)';
      } else if (selectedScoops.length >= 3) {
        coneContainer.style.transform = 'scale(0.7)';
      }
    }
  }
}

function addCreationToCart() {
  if (selectedScoops.length === 0) {
    alert('Please select at least one scoop to build your ice cream!');
    return;
  }
  const name = 'Custom: ' + selectedScoops.map(s => s.name).join(' + ');
  const price = selectedScoops.length * 2.00 + selectedToppings.length * 0.50;
  const scoop = selectedScoops[0].color;
  const img = selectedScoops[0].img;
  cart.push({
    name,
    price,
    scoop,
    img,
    customScoops: [...selectedScoops], // Save all scoops for custom stacked render
    toppings: [...selectedToppings]
  });
  updateCart();

  // Reset selections
  selectedScoops = [];
  selectedToppings = [];
  document.querySelectorAll('.builder-scoop-option, .topping-option').forEach(el => el.classList.remove('selected'));
  updatePreview();
  toggleCart();
}

// ===== SCROLL REVEAL =====
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(el => observer.observe(el));
}

// ===== CHECKOUT & RECEIPT FLOW =====
let currentReceiptSlide = 0;
let totalReceiptSlides = 0;

function openCheckoutModal() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  // Close the cart sidebar/overlay
  document.getElementById('cart-overlay').classList.remove('open');
  document.getElementById('cart-sidebar').classList.remove('open');
  
  const user = JSON.parse(localStorage.getItem('scoops_user'));
  if (!user) {
    // Show login modal
    openLoginModal(true);
  } else {
    // Populate user details and show checkout modal
    document.getElementById('cust-name').value = user.name;
    document.getElementById('cust-phone').value = user.phone;
    
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('active');
  }
}

function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  if (modal) modal.classList.remove('active');
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('login-name').value;
  const phone = document.getElementById('login-phone').value;
  const btn = document.getElementById('login-submit-btn');
  
  try {
    btn.textContent = 'LOGGING IN...';
    btn.disabled = true;
    
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('scoops_user', JSON.stringify({ name, phone }));
      closeLoginModal();
      initAuth(); // Update navbar
      
      if (loginFromCheckout) {
        openCheckoutModal();
      } else {
        alert('Welcome to Scoops, ' + name + '! 🍦');
      }
    } else {
      alert(data.errors ? data.errors.map(e => e.msg).join('\\n') : data.error || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Failed to connect to the server.');
  } finally {
    btn.textContent = 'LOGIN / SIGN UP 🚀';
    btn.disabled = false;
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  if (modal) modal.classList.remove('active');
}

async function handleCheckoutSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('cust-name').value;
  const address = document.getElementById('cust-address').value;
  const phone = document.getElementById('cust-phone').value;
  const submitBtn = event.target.querySelector('button[type="submit"]');
  
  let subtotal = 0;
  cart.forEach(item => subtotal += item.price);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  
  try {
    submitBtn.textContent = 'PROCESSING...';
    submitBtn.disabled = true;
    
    const response = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        address,
        items: cart,
        totalPrice: total
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      alert(data.errors ? data.errors.map(e => e.msg).join('\\n') : data.error || 'Order failed');
      submitBtn.textContent = 'GENERATE RECEIPT 📄';
      submitBtn.disabled = false;
      return;
    }
    
    // Order successful, proceed to show receipt
  } catch (err) {
    console.error(err);
    alert('Failed to connect to the server.');
    submitBtn.textContent = 'GENERATE RECEIPT 📄';
    submitBtn.disabled = false;
    return;
  }
  
  submitBtn.textContent = 'GENERATE RECEIPT 📄';
  submitBtn.disabled = false;

  // Populate the receipt modal details
  document.getElementById('rec-name').textContent = name;
  document.getElementById('rec-address').textContent = address;
  document.getElementById('rec-phone').textContent = phone;
  
  // Generate date and random receipt number
  const now = new Date();
  const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const receiptNum = 'RCPT-' + Math.floor(100000 + Math.random() * 900000);
  
  document.getElementById('receipt-date').textContent = dateStr;
  
  // Populate Printable Receipt Template
  document.getElementById('print-date').textContent = dateStr;
  document.getElementById('print-receipt-num').textContent = receiptNum;
  document.getElementById('print-cust-name').textContent = name;
  document.getElementById('print-cust-address').textContent = address;
  document.getElementById('print-cust-phone').textContent = phone;
  
  // Populate Printable Items List & Calculate Tax/Subtotal
  let printSubtotal = 0;
  const printItemsHTML = cart.map(item => {
    printSubtotal += item.price;
    let details = '';
    if (item.customScoops && item.customScoops.length > 0) {
      details += `<div style="font-size: 10px; color: #555; margin-left: 10px;">Scoops: ${item.customScoops.map(s => s.name).join(', ')}</div>`;
    }
    if (item.toppings && item.toppings.length > 0) {
      details += `<div style="font-size: 10px; color: #555; margin-left: 10px;">Toppings: ${item.toppings.join(', ')}</div>`;
    }
    return `
      <tr style="vertical-align: top; border-bottom: 1px dashed #eee;">
        <td style="padding: 6px 0; text-align: left;">
          <div style="font-weight: bold;">${item.name}</div>
          ${details}
        </td>
        <td style="text-align: right; padding: 6px 0; font-weight: bold;">$${item.price.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
  
  const printTax = printSubtotal * 0.08;
  const printTotal = printSubtotal + printTax;
  
  document.getElementById('print-items-body').innerHTML = printItemsHTML;
  document.getElementById('print-subtotal').textContent = `$${printSubtotal.toFixed(2)}`;
  document.getElementById('print-tax').textContent = `$${printTax.toFixed(2)}`;
  document.getElementById('print-total').textContent = `$${printTotal.toFixed(2)}`;

  // Render visual ice cream slideshow for screen card
  renderReceiptSlideshow();
  
  // Render list of items & total for screen card
  renderReceiptItems();
  
  // Switch modals
  closeCheckoutModal();
  document.getElementById('receipt-modal').classList.add('active');
}

function renderReceiptSlideshow() {
  const track = document.getElementById('receipt-slideshow-track');
  if (!track) return;
  
  track.innerHTML = cart.map((item, idx) => {
    let scoopsHTML = '';
    
    if (item.customScoops && item.customScoops.length > 0) {
      // Dynamic multiple scoops (max 3) stacked for custom creations
      scoopsHTML = item.customScoops.map((s, i) => {
        const zIndex = 30 + i;
        if (s.img && s.img !== 'null') {
          return `<img src="${s.img}" class="receipt-scoop" style="z-index:${zIndex};">`;
        } else {
          return `<div class="receipt-scoop ${s.color}" style="z-index:${zIndex};"></div>`;
        }
      }).join('');
    } else {
      // Single scoop for regular shop flavors
      if (item.img && item.img !== 'null') {
        scoopsHTML = `<img src="${item.img}" class="receipt-scoop" style="z-index:30;">`;
      } else {
        scoopsHTML = `<div class="receipt-scoop ${item.scoop}" style="z-index:30;"></div>`;
      }
    }
    
    return `
      <div class="receipt-slide">
        <div class="receipt-icecream-visual">
          <div class="receipt-scoops">
            ${scoopsHTML}
          </div>
          <img src="assets/coan.png" class="receipt-cone" alt="Cone">
        </div>
        <div class="receipt-slide-label">${item.name}</div>
      </div>
    `;
  }).join('');
  
  currentReceiptSlide = 0;
  totalReceiptSlides = cart.length;
  updateReceiptSlidePosition();
}

function updateReceiptSlidePosition() {
  const track = document.getElementById('receipt-slideshow-track');
  const counter = document.getElementById('receipt-slide-counter');
  
  if (track) {
    track.style.transform = `translateX(-${currentReceiptSlide * 100}%)`;
  }
  if (counter) {
    counter.textContent = `${currentReceiptSlide + 1} / ${totalReceiptSlides}`;
  }
  
  // Hide arrows if only 1 slide
  const navControls = document.getElementById('slideshow-nav-controls');
  if (navControls) {
    navControls.style.display = totalReceiptSlides > 1 ? 'flex' : 'none';
  }
}

function changeReceiptSlide(direction) {
  currentReceiptSlide += direction;
  if (currentReceiptSlide < 0) {
    currentReceiptSlide = totalReceiptSlides - 1;
  } else if (currentReceiptSlide >= totalReceiptSlides) {
    currentReceiptSlide = 0;
  }
  updateReceiptSlidePosition();
}

function renderReceiptItems() {
  const container = document.getElementById('receipt-items-list');
  const totalSpan = document.getElementById('rec-total-price');
  if (!container) return;
  
  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.price;
    return `
      <div class="receipt-item-row">
        <span>${item.name}</span>
        <span>$${item.price.toFixed(2)}</span>
      </div>
    `;
  }).join('');
  
  if (totalSpan) {
    totalSpan.textContent = `$${total.toFixed(2)}`;
  }
}

function closeReceiptModal() {
  document.getElementById('receipt-modal').classList.remove('active');
  // Clear cart and reset UI after order is placed
  cart = [];
  localStorage.removeItem('scoops_cart');
  updateCart();
  
  // Clear checkout form values
  document.getElementById('checkout-form').reset();
}

function downloadReceiptPDF() {
  const original = document.getElementById('receipt-print-template');
  if (!original) return;
  
  // Create a deep clone of the populated printable receipt template
  const clone = original.cloneNode(true);
  
  // Set a unique ID to avoid selector duplication
  clone.id = 'receipt-print-clone';
  
  // Override inline styles to make it a standard static block in the page layout flow.
  // Statically-positioned elements attached to the body have perfect geometry for html2canvas.
  clone.style.position = 'static';
  clone.style.left = 'auto';
  clone.style.top = 'auto';
  clone.style.width = '450px';
  clone.style.margin = '0 auto';
  clone.style.visibility = 'visible';
  clone.style.display = 'block';
  clone.style.opacity = '1';
  
  // Append clone to document body so the browser layout engine compiles its geometry
  document.body.appendChild(clone);
  
  // Store current scroll position to restore it after capturing
  const currentScrollY = window.scrollY;
  const currentScrollX = window.scrollX;
  
  // Temporarily scroll to the absolute top of the page so html2canvas captures
  // the element from scroll position 0 without any scroll-offset or cut-off bugs.
  // The receipt modal has position: fixed, so this happens invisibly behind it.
  window.scrollTo(0, 0);
  
  const opt = {
    margin:       15,
    filename:     'Scoops_Store_Receipt.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2.5, 
      useCORS: false, 
      backgroundColor: '#ffffff',
      scrollY: 0,
      scrollX: 0,
      ignoreElements: (el) => el.tagName === 'IMG' || el.tagName === 'IFRAME'
    }, // Clean print white background, ignoring potentially broken page media/CORS issues
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  // Give the browser 150ms to lay out and paint the clone in the DOM
  setTimeout(() => {
    html2pdf().from(clone).set(opt).save().then(() => {
      // Clean up: remove the clone from DOM and restore scroll
      if (document.getElementById('receipt-print-clone')) {
        document.body.removeChild(clone);
      }
      window.scrollTo(currentScrollX, currentScrollY);
      alert("Receipt PDF downloaded successfully!");
    }).catch(err => {
      console.error("PDF generation failed:", err);
      // Clean up: remove the clone from DOM and restore scroll
      if (document.getElementById('receipt-print-clone')) {
        document.body.removeChild(clone);
      }
      window.scrollTo(currentScrollX, currentScrollY);
      alert("Failed to generate PDF. Please try again.");
    });
  }, 150);
}
