# 🌾 AniHarvest — Farm to Table Marketplace

An agriculture marketplace where local farmers sell fresh produce directly to buyers.
**Frontend:** React (Vite) · **Backend:** PHP REST API · **Database:** MySQL on XAMPP

## Features
- Animated agriculture landing page (sunrise, drifting clouds, windmill, tractor, swaying wheat, falling leaves, scroll reveals, count-up stats)
- Marketplace with category filters, search, organic filter, sorting
- Product details, basket (cart) and checkout
- **Payment methods with QR (GCash / Maya / bank)**: the admin adds their account name, number and QR code
  (Admin → 💳 Payment Methods). Buyers pick it at checkout or when cashing in, scan the QR, send the money,
  and submit the reference number + receipt screenshot. The admin approves/rejects in Admin → 🧾 Payments.
- **e-Wallet**: buyers cash in (via the QR methods above) and pay orders instantly; cancelled prepaid orders are
  refunded to the wallet; farmers are paid into their wallet when a prepaid order is delivered, and can withdraw.
- Upgrading an existing database: run `api/migrate_wallet.sql` then `api/migrate_payments.sql` in phpMyAdmin.
- **Bubble guide**: first-time visitors get speech-bubble tips on each page that introduce its buttons
  and features (per role). The floating **?** button replays them; Profile → “Show the guides again” resets all.
  Content lives in `client/src/tour/tours.js`.
- Three roles:
  - **Buyer** — shop, checkout, track and cancel orders
  - **Farmer** — add/edit/delete products (with photo upload), manage incoming orders, sales stats
  - **Admin** — overview stats, manage users, products and all orders

## Setup
1. Start **Apache** and **MySQL** in the XAMPP Control Panel.
2. Create the database: open <http://localhost/April/api/install.php>
   (or import `api/database.sql` in phpMyAdmin). ⚠️ This resets the AniHarvest tables.
3. Install [Node.js](https://nodejs.org) (LTS), then:
   ```bash
   cd C:\xampp\htdocs\April\client
   npm install
   npm run dev
   ```
4. Open <http://localhost:5173>

### Optional: run it from XAMPP without the dev server
```bash
npm run build
```
Then open <http://localhost/April/client/dist/>

## Deploy online (Dokploy on a VPS)
1. Push this repository to GitHub.
2. Dokploy → **Create Project** → **Create Service → Compose** → provider **GitHub**, pick the repo, branch `main`,
   compose path `./docker-compose.yml`.
3. **Environment** tab — add (use your own strong values):
   ```
   DB_PASSWORD=<long random password>
   DB_ROOT_PASSWORD=<another long random password>
   ADMIN_EMAIL=<your admin email>
   ADMIN_PASSWORD=<at least 8 characters>
   SEED_SAMPLE_ORDERS=1
   ```
4. **Domains** tab → add your domain (or Dokploy's free generated one) → service `app`, port `80`, HTTPS on.
5. **Deploy**. The first start creates the tables and demo data automatically.
   ⚠️ Set `DB_PASSWORD` / `DB_ROOT_PASSWORD` **before the first deploy and never change them afterwards**: MariaDB keeps
   the password it was created with. `ADMIN_PASSWORD` and `ADMIN_EMAIL` can be changed anytime (applied on every start).

Live: <https://aniharvest.aticaraga.tech>
   The installer and SQL files are not reachable from the web in the deployed version.

## Demo accounts
| Role   | Email                  | Password  |
|--------|------------------------|-----------|
| Admin  | admin@aniharvest.com   | admin123  |
| Farmer | farmer@aniharvest.com  | farmer123 |
| Buyer  | buyer@aniharvest.com   | buyer123  |

More sample accounts (added by `api/seed_more_users.sql`): 8 extra buyers (password `buyer123`)
and 5 extra farmers with products (password `farmer123`), e.g. `maria.reyes@aniharvest.com`,
`nena.castillo@aniharvest.com`. See the file for the full list.

### Sample sales history (for the farmer analytics)
`api/seed_sample_orders.php` creates ~60 days of sample orders between the demo buyers and demo farmers
(each tagged `[sample]` in the order notes). Re-running replaces them.
```bash
C:\xampp\php\php.exe C:\xampp\htdocs\April\api\seed_sample_orders.php          # create / refresh
C:\xampp\php\php.exe C:\xampp\htdocs\April\api\seed_sample_orders.php remove   # delete them
```

## Folder structure
```
April/
├── api/                 PHP API (served by XAMPP Apache)
│   ├── config.php       DB connection + helpers (edit DB credentials here)
│   ├── database.sql     schema + sample data
│   ├── install.php      one-click database installer
│   ├── auth.php         register / login / profile
│   ├── products.php     product CRUD + search
│   ├── categories.php
│   ├── orders.php       checkout + order status
│   ├── stats.php        dashboard stats, admin user management
│   └── upload.php       product photo upload → api/uploads/
└── client/              React app
    └── src/
        ├── pages/       Landing, Market, ProductDetail, Cart, Login, Register,
        │                Orders, FarmerDashboard, AdminDashboard, Profile
        ├── components/  Navbar, Footer, ProductCard, ProductForm, OrderList, Reveal, Toast
        └── context/     AuthContext, CartContext
```

If your project folder is not `htdocs/April`, change `API_URL` in `client/src/api.js`.
