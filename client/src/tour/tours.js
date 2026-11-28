// Bubble-guide content for every page.
// target: CSS selector of the element to point at (omit for a centred welcome bubble)
// roles:  only show the step to these roles ('guest', 'buyer', 'farmer', 'admin')
// place:  force 'top' | 'bottom' | 'left' | 'right' (optional)
// Steps whose element isn't on screen are skipped automatically.

const firstName = (u) => {
  const p = (u?.name || '').trim().split(/\s+/);
  return (/^(mang|aling|manong|manang|kuya|ate)$/i.test(p[0]) && p[1] ? p[1] : p[0]) || 'there';
};

const HELP = {
  target: '[data-tour="help"]', emoji: '💡', title: 'Need a reminder?',
  text: 'Tap this ? button anytime to replay the guide for the page you are on.',
};

const TOURS = {
  landing: [
    { emoji: '🌾', title: 'Welcome to AniHarvest!', text: 'A marketplace where you buy fresh produce straight from local Filipino farmers. Let us show you around — it takes 30 seconds.' },
    { target: ".burger", emoji: "☰", title: "The menu", text: "On a phone, tap ☰ to open the menu — Marketplace, Farms, Orders, your basket, wallet and profile are all in there." },
    { target: '[data-tour="nav-market"]', emoji: '🧺', title: 'Marketplace', text: 'Browse every product — vegetables, fruits, rice, eggs and more — with search and filters.' },
    { target: '[data-tour="nav-farms"]', emoji: '🏡', title: 'Farms', text: 'Find a farmer or their store by name, place or crop, and see everything they sell.' },
    { target: '[data-tour="cart"]', emoji: '🛒', title: 'Your basket', text: 'Products you add land here. The number shows how many items are inside.' },
    { target: '[data-tour="join"]', emoji: '✍️', title: 'Join for free', text: 'Create an account as a buyer to shop, or as a farmer to open your own farm stall.' },
    { target: '.hero-actions', emoji: '🚀', title: 'Start here', text: '“Shop the Harvest” takes you to the products. “Sell Your Produce” signs you up as a farmer.' },
    HELP,
  ],

  'buyer-home': [
    { emoji: '👋', title: (u) => `Welcome, ${firstName(u)}!`, text: 'This is your home page — fresh deals picked for you every visit. Here is a quick look at what you can do.' },
    { target: ".burger", emoji: "☰", title: "The menu", text: "On a phone, tap ☰ to open the menu — Marketplace, Farms, Orders, your basket, wallet and profile are all in there." },
    { target: '.ad-carousel', emoji: '🔥', title: "Today's deals", text: 'These ads change every few seconds. Tap “Add to basket” to buy right away, or use the arrows / swipe to see more.' },
    { target: '.cat-strip', emoji: '🗂️', title: 'Shop by category', text: 'Jump straight to vegetables, fruits, rice, eggs, herbs and more.' },
    { target: '.shelf .product-card', emoji: '🥬', title: 'Product cards', text: 'Tap a product for details. “+ Basket” adds it, 🔍 zooms the picture, and the 🏡 farm name opens the farmer’s store.' },
    { target: '[data-tour="wallet"]', emoji: '👛', title: 'Your e-Wallet', text: 'Load money via GCash or Maya, then pay for orders in one tap. Cancelled orders are refunded here.' },
    { target: '[data-tour="cart"]', emoji: '🛒', title: 'Basket & checkout', text: 'Review your items here and choose how to pay: cash on delivery, e-Wallet, or GCash QR.' },
    { target: '[data-tour="nav-orders"]', emoji: '📦', title: 'Track your orders', text: 'See every order move from Pending → Processing → Shipped → Delivered.' },
    { target: '[data-tour="profile"]', emoji: '🙂', title: 'Your profile', text: 'Update your name, phone and delivery address so checkout is faster.' },
    HELP,
  ],

  'farmer-home': [
    { emoji: '📊', title: (u) => `Welcome, ${firstName(u)}!`, text: 'This is your farm analytics — how your harvest is selling. Let’s walk through it.' },
    { target: ".burger", emoji: "☰", title: "The menu", text: "On a phone, tap ☰ to open the menu — Marketplace, Farms, Orders, your basket, wallet and profile are all in there." },
    { target: '.an-range', emoji: '📅', title: 'Pick a date range', text: 'Switch between the last 7, 30 or 90 days. Every number and chart updates.' },
    { target: '.an-hero', emoji: '💰', title: 'Your revenue', text: 'Total sales for the period. ▲ green means you’re selling more than the period before; ▼ red means less.' },
    { target: '.an-tiles', emoji: '🔢', title: 'Key numbers', text: 'Orders, units sold, average order value and number of customers — each compared to the previous period.' },
    { target: '.viz-line', emoji: '📈', title: 'Sales per day', text: 'Hover or tap the chart to see a day’s sales. The highest day is marked “Peak”.' },
    { target: '[data-tour="table-toggle"]', emoji: '📋', title: 'Prefer exact numbers?', text: '“View as table” shows the same data day by day.' },
    { target: '.an-grid', emoji: '🏆', title: 'What sells best', text: 'Your best products, sales by category, order statuses — and products running low on stock.' },
    { target: '.an-actions', emoji: '🛠️', title: 'Manage your farm', text: 'Add or edit products, and pack orders. The badge shows how many orders are waiting.' },
    { target: '[data-tour="nav-myfarm"]', emoji: '🌱', title: 'My Farm', text: 'Your product list and incoming orders — also reachable from the top menu.' },
    { target: '[data-tour="wallet"]', emoji: '👛', title: 'Your earnings', text: 'Money from e-Wallet and GCash orders lands here when an order is delivered. Withdraw it to GCash anytime.' },
    HELP,
  ],

  'farmer-dashboard': [
    { target: '[data-tour="add-product"]', emoji: '➕', title: 'Add a product', text: 'List a new harvest: name, price per unit, stock, a photo, and whether it is organic.' },
    { target: '.dash-stats', emoji: '📊', title: 'Quick stats', text: 'Your product count, orders, revenue and how many products are low on stock.' },
    { target: '.tabs', emoji: '🗂️', title: 'Products & Orders', text: 'Switch between your product list and the orders customers placed. The yellow badge = new orders.' },
    { target: '.td-actions', emoji: '✏️', title: 'Edit or delete', text: '✏️ changes price, stock or photo. 🗑️ removes the product. Set it to “Hidden” to pause selling instead.' },
    { target: '.deliver-to', emoji: '📦', title: 'Where to deliver', text: 'Each order shows the buyer’s name, phone (tap to call), address and their exact pin on a map. “Get directions” opens the route in Google Maps.' },
    { target: '.order-actions select', emoji: '🚚', title: 'Update the order status', text: 'Move each order along: Processing → Shipped → Delivered. The buyer sees every change.' },
    HELP,
  ],

  market: [
    { target: '.page-hero .search-bar', emoji: '🔍', title: 'Search anything', text: 'Type a product, a farm, a farmer or a place — e.g. “mango”, “Benguet”, “Santos”.' },
    { target: '.filters', emoji: '🗂️', title: 'Filter by category', text: 'Pick a category to narrow the list. The small number is how many products it has.' },
    { target: '.filters .switch-row', emoji: '🌿', title: 'Organic only', text: 'Turn this on to see only organically grown products.' },
    { target: '.filters select', emoji: '↕️', title: 'Sort', text: 'Order by newest harvest, lowest or highest price, or name.' },
    { target: '.product-grid .product-card', emoji: '🥬', title: 'Products', text: 'Tap for details, “+ Basket” to add, the 🏡 farm name to visit the store.' },
    { target: '.product-grid .card-zoom-btn', emoji: '🔎', title: 'Zoom the picture', text: 'Tap 🔍 to see the product picture full screen — pinch or scroll to zoom in.' },
    HELP,
  ],

  product: [
    { target: '.zoom-box', emoji: '🔎', title: 'Look closer', text: 'Hover to magnify. Click to open full screen, then scroll, pinch or double-click to zoom.' },
    { target: '.farm-box', emoji: '🏡', title: 'Who grew it', text: 'Tap to visit this farmer’s store and see everything else they sell.' },
    { target: '.buy-row', emoji: '🧺', title: 'Add to basket', text: 'Choose how many with − / +, then add it. The price updates as you change the quantity.' },
    HELP,
  ],

  cart: [
    { target: '.cart-row', emoji: '🧺', title: 'Your items', text: 'Change quantities with − / +, or ✕ to remove an item.' },
    { target: '.checkout textarea', emoji: '📍', title: 'Delivery details', text: 'Check your address and phone — we fill them in from your profile.' },
    { target: '.pin-field', emoji: '🗺️', title: 'Pin your exact location', text: 'Tap “Use my current location” (or tap the map) and drag the pin to your door. The seller and courier get a map and turn-by-turn directions to it.' },
    { target: '.pay-options', emoji: '💳', title: 'Choose how to pay', text: 'Cash on Delivery, your e-Wallet, or GCash/Maya by scanning the store’s QR code.' },
    { target: '.summary', emoji: '🧾', title: 'Your total', text: 'Subtotal plus delivery. The delivery fee is paid to the rider on arrival.' },
    { target: '.checkout .btn-block', emoji: '✅', title: 'Place the order', text: 'Tap to confirm. You can follow the order in “Orders” afterwards.' },
    HELP,
  ],

  wallet: [
    { target: '.wallet-card', emoji: '👛', title: 'Your balance', text: 'The money in your AniHarvest e-Wallet.', roles: ['buyer', 'farmer'] },
    { target: '.wc-actions', emoji: '➕', title: 'Cash in', text: 'Choose an amount, scan our GCash/Maya QR, then enter the reference number. Your balance updates once the payment is verified.', roles: ['buyer'] },
    { target: '.wc-actions', emoji: '🏧', title: 'Withdraw', text: 'Send your earnings to your GCash, Maya or bank account.', roles: ['farmer'] },
    { target: '.how-wallet', emoji: '📘', title: 'How it works', text: 'A quick summary of how money moves in and out of your wallet.' },
    { target: '.tx-list', emoji: '🧾', title: 'History', text: 'Every cash-in, payment, refund and earning — with reference numbers.' },
    HELP,
  ],

  orders: [
    { target: '.tabs', emoji: '🗂️', title: 'Filter orders', text: 'Show all orders or only those that are pending, shipped, delivered…' },
    { target: '.order .tracker', emoji: '🚚', title: 'Order progress', text: 'Follow each order from Pending to Delivered.' },
    { target: '.order .pay-status', emoji: '💳', title: 'Payment status', text: 'Paid, unpaid, for verification (GCash being checked), refunded…' },
    { target: '.order .btn-danger', emoji: '❌', title: 'Changed your mind?', text: 'Pending orders can be cancelled. E-Wallet payments are refunded automatically.', roles: ['buyer'] },
    { target: '.order-actions select', emoji: '🔄', title: 'Update status', text: 'Move the order along as you pack and ship it.', roles: ['farmer', 'admin'] },
    HELP,
  ],

  farms: [
    { target: '.page-hero .search-bar', emoji: '🔍', title: 'Find a farm', text: 'Search by farm name, farmer, province or crop — e.g. “Benguet” or “mango”.' },
    { target: '.farm-card', emoji: '🏡', title: 'Farm cards', text: 'See where they are, what they grow and how many products they have. Tap to open the store.' },
    HELP,
  ],

  store: [
    { target: '.store-head', emoji: '🏡', title: 'The farm', text: 'Who runs it, where it is and how long they’ve been selling.' },
    { target: '.store-stats', emoji: '📊', title: 'At a glance', text: 'How many products they have, how many are organic, and what they grow.' },
    { target: '.store-toolbar .search-bar', emoji: '🔍', title: 'Search this farm', text: 'Find a product from this farm only.' },
    HELP,
  ],

  admin: [
    { target: '.dash-stats', emoji: '📊', title: 'Overview', text: 'Users, farmers, products and total sales across the marketplace.' },
    { target: '[data-tour="tab-payments"]', emoji: '🧾', title: 'Verify payments', text: 'Buyers’ GCash/Maya payments wait here. Check the reference number and screenshot, then approve or reject.' },
    { target: '[data-tour="tab-methods"]', emoji: '💳', title: 'Payment methods', text: 'Add your GCash/Maya number and upload your QR code so buyers can pay you.' },
    { target: '[data-tour="tab-users"]', emoji: '👥', title: 'Users', text: 'Search buyers, farmers and admins by name, email, phone or farm.' },
    { target: '[data-tour="tab-products"]', emoji: '🥬', title: 'Products', text: 'Edit or remove any product on the marketplace.' },
    { target: '[data-tour="tab-orders"]', emoji: '📦', title: 'All orders', text: 'See every order and update its status.' },
    HELP,
  ],

  profile: [
    { target: '.profile form', emoji: '🙂', title: 'Your details', text: 'Keep your phone and address up to date — they are used at checkout and for deliveries.' },
    { target: '[data-tour="reset-guides"]', emoji: '💡', title: 'Replay all guides', text: 'Want the bubble tips again on every page? Tap here.' },
  ],
};

export default TOURS;
