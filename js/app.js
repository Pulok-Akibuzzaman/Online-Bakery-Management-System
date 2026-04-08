// Online Bakery Management System
// Data is persisted in SQLite via backend API.

class BakeryApp {
    constructor() {
        this.storageKeys = {
            currentUser: 'currentUser',
            products: 'products',
            orders: 'orders',
            users: 'users',
            cart: 'cart',
            reviews: 'reviews',
            ingredients: 'ingredients',
            recipes: 'recipes'
        };

        this.apiBase = '/api';
        this.syncDebounceTimer = null;
        this.isBackendAvailable = true;
        this.hasShownBackendError = false;

        // Initialize in-memory state with safe defaults; actual state is loaded from DB during init.
        this.currentUser = null;
        this.products = this.getDefaultProducts();
        this.orders = [];
        this.users = this.getDefaultUsers();
        this.cart = [];
        this.reviews = [];
        this.ingredients = this.getDefaultIngredients();
        this.recipes = this.getDefaultRecipes();

        this.activeDashboardSection = 'overview';

        this.init();
    }

    // ---------- Init ----------
    async init() {
        this.setupEventListeners();
        await this.loadStateFromDatabase();
        this.updateNavbar();
        this.navigateTo('home');
        this.updateCartCount();
    }

    async loadStateFromDatabase() {
        try {
            const res = await fetch(`${this.apiBase}/state`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to load data from server');

            const state = await res.json();
            this.currentUser = state.currentUser ?? null;
            this.products = Array.isArray(state.products) && state.products.length ? state.products : this.getDefaultProducts();
            this.orders = Array.isArray(state.orders) ? state.orders : [];
            this.users = Array.isArray(state.users) && state.users.length ? state.users : this.getDefaultUsers();
            this.cart = Array.isArray(state.cart) ? state.cart : [];
            this.reviews = Array.isArray(state.reviews) ? state.reviews : [];
            this.ingredients = Array.isArray(state.ingredients) && state.ingredients.length ? state.ingredients : this.getDefaultIngredients();
            this.recipes = state.recipes && typeof state.recipes === 'object' ? state.recipes : this.getDefaultRecipes();
            this.products = this.normalizeProductImages(this.products);
            this.isBackendAvailable = true;
            this.hasShownBackendError = false;

            this.persistLocalCache();
        } catch {
            this.isBackendAvailable = false;
            // Fallback: use locally cached data when API is unavailable.
            this.currentUser = this.readStorage(this.storageKeys.currentUser, null);
            this.products = this.readStorage(this.storageKeys.products, null) || this.getDefaultProducts();
            this.orders = this.readStorage(this.storageKeys.orders, []);
            this.users = this.readStorage(this.storageKeys.users, null) || this.getDefaultUsers();
            this.cart = this.readStorage(this.storageKeys.cart, []);
            this.reviews = this.readStorage(this.storageKeys.reviews, []);
            this.ingredients = this.readStorage(this.storageKeys.ingredients, null) || this.getDefaultIngredients();
            this.recipes = this.readStorage(this.storageKeys.recipes, null) || this.getDefaultRecipes();
            this.products = this.normalizeProductImages(this.products);

            if (!this.hasShownBackendError) {
                this.showMessage('Backend is offline. Start server with: npm start', 'error');
                this.hasShownBackendError = true;
            }
        }
    }

    // ---------- Defaults ----------
    getDefaultProducts() {
        return [
            {
                id: 1,
                name: 'Chocolate Croissant',
                description: 'Buttery croissant filled with rich chocolate',
                price: 250,
                image: 'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=600',
                category: 'Pastries',
                stock: 20
            },
            {
                id: 2,
                name: 'Red Velvet Cake',
                description: 'Classic red velvet cake with cream cheese frosting',
                price: 1200,
                image: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600',
                category: 'Cakes',
                stock: 5
            },
            {
                id: 3,
                name: 'Blueberry Muffin',
                description: 'Fresh blueberry muffin with a golden top',
                price: 180,
                image: 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600',
                category: 'Muffins',
                stock: 15
            },
            {
                id: 4,
                name: 'Artisan Bread',
                description: 'Freshly baked artisan sourdough bread',
                price: 320,
                image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
                category: 'Breads',
                stock: 8
            },
            {
                id: 5,
                name: 'Strawberry Tart',
                description: 'Delicate pastry tart topped with fresh strawberries',
                price: 450,
                image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600',
                category: 'Tarts',
                stock: 12
            },
            {
                id: 6,
                name: 'Cinnamon Roll',
                description: 'Warm cinnamon roll with sweet glaze',
                price: 200,
                image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600',
                category: 'Pastries',
                stock: 18
            },
            {
                id: 7,
                name: 'Classic Cheesecake',
                description: 'Creamy cheesecake with a buttery biscuit base',
                price: 950,
                image: 'https://images.unsplash.com/photo-1547414368-ac947d00b91d?w=600',
                category: 'Cakes',
                stock: 6
            },
            {
                id: 8,
                name: 'Chocolate Chip Cookies',
                description: 'Crispy edges, chewy center, loaded with chocolate chips',
                price: 120,
                image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
                category: 'Cookies',
                stock: 40
            },
            {
                id: 9,
                name: 'Eclair',
                description: 'Choux pastry filled with cream and topped with chocolate',
                price: 230,
                image: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600',
                category: 'Pastries',
                stock: 14
            },
            {
                id: 10,
                name: 'Fudge Brownie',
                description: 'Rich chocolate brownie with a fudgy bite',
                price: 220,
                image: 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=600',
                category: 'Brownies',
                stock: 22
            },
            {
                id: 11,
                name: 'Vanilla Cupcake',
                description: 'Soft vanilla cupcake with silky frosting',
                price: 150,
                image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600',
                category: 'Cupcakes',
                stock: 24
            },
            {
                id: 12,
                name: 'Chocolate Cupcake',
                description: 'Chocolate cupcake with creamy chocolate frosting',
                price: 170,
                image: 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600',
                category: 'Cupcakes',
                stock: 20
            },
            {
                id: 13,
                name: 'Banana Bread',
                description: 'Moist banana bread with a hint of cinnamon',
                price: 380,
                image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600',
                category: 'Breads',
                stock: 10
            },
            {
                id: 14,
                name: 'Butter Croissant',
                description: 'Classic flaky croissant with buttery layers',
                price: 210,
                image: 'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=600',
                category: 'Pastries',
                stock: 26
            }
        ];
    }

    normalizeProductImages(products) {
        const byId = {
            1: 'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=600',
            9: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600',
            10: 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=600',
            14: 'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=600'
        };

        return (products || []).map((p) => {
            const hasBrokenUrl =
                p.image === 'https://images.unsplash.com/photo-1555507036-ab794f4ade0a?w=600' ||
                p.image === 'https://images.unsplash.com/photo-1606313564200-e75d5e30476d?w=600' ||
                p.image === 'https://picsum.photos/seed/chocolate-croissant/600/400' ||
                p.image === 'https://picsum.photos/seed/eclair-pastry/600/400' ||
                p.image === 'https://picsum.photos/seed/fudge-brownie/600/400' ||
                p.image === 'https://picsum.photos/seed/butter-croissant/600/400';

            const nextImage = hasBrokenUrl && byId[p.id] ? byId[p.id] : p.image;
            return nextImage === p.image ? p : { ...p, image: nextImage };
        });
    }

    getDefaultUsers() {
        return [
            {
                id: 1,
                username: 'admin',
                password: 'admin123',
                email: 'admin@bakery.com',
                role: 'admin',
                name: 'Admin User'
            },
            {
                id: 2,
                username: 'employee1',
                password: 'emp123',
                email: 'employee@bakery.com',
                role: 'employee',
                name: 'John Employee'
            },
            {
                id: 3,
                username: 'delivery1',
                password: 'del123',
                email: 'delivery@bakery.com',
                role: 'delivery',
                name: 'Mike Delivery'
            },
            {
                id: 1001,
                username: 'customer1',
                password: 'cust123',
                email: 'customer1@bakery.com',
                role: 'customer',
                name: 'Ayesha Rahman'
            },
            {
                id: 1002,
                username: 'customer2',
                password: 'cust123',
                email: 'customer2@bakery.com',
                role: 'customer',
                name: 'Tanvir Hasan'
            },
            {
                id: 1003,
                username: 'customer3',
                password: 'cust123',
                email: 'customer3@bakery.com',
                role: 'customer',
                name: 'Nafisa Akter'
            }
        ];
    }

    getDefaultIngredients() {
        return [
            { id: 101, name: 'Flour (g)', stock: 50000, lowThreshold: 5000 },
            { id: 102, name: 'Sugar (g)', stock: 20000, lowThreshold: 2000 },
            { id: 103, name: 'Butter (g)', stock: 8000, lowThreshold: 1000 },
            { id: 104, name: 'Chocolate (g)', stock: 6000, lowThreshold: 800 },
            { id: 105, name: 'Egg (pcs)', stock: 200, lowThreshold: 30 },
            { id: 106, name: 'Milk (ml)', stock: 15000, lowThreshold: 2000 },
            { id: 107, name: 'Cream Cheese (g)', stock: 4000, lowThreshold: 600 },
            { id: 108, name: 'Strawberry (g)', stock: 5000, lowThreshold: 700 },
            { id: 109, name: 'Yeast (g)', stock: 1000, lowThreshold: 150 }
        ];
    }

    // Recipe unit is “ingredient stock units per 1 product unit”.
    // Keep it simple for a demo; in real systems this would be configurable.
    getDefaultRecipes() {
        return {
            // Chocolate Croissant
            1: { 101: 120, 103: 30, 104: 25, 105: 1, 109: 2 },
            // Red Velvet Cake
            2: { 101: 400, 102: 250, 103: 150, 105: 4, 106: 200, 107: 120 },
            // Blueberry Muffin (no blueberry ingredient in defaults; treat as sugar+milk+flour)
            3: { 101: 140, 102: 60, 103: 40, 105: 1, 106: 80 },
            // Artisan Bread
            4: { 101: 300, 109: 5, 106: 120 },
            // Strawberry Tart
            5: { 101: 160, 102: 90, 103: 60, 105: 1, 108: 80 },
            // Cinnamon Roll
            6: { 101: 180, 102: 70, 103: 50, 105: 1, 109: 3 }
        };
    }

    // ---------- Storage ----------
    readStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null || raw === undefined) return fallback;
            return JSON.parse(raw);
        } catch {
            return fallback;
        }
    }

    saveToStorage() {
        this.persistLocalCache();
        this.debouncedSyncToDatabase();
    }

    persistLocalCache() {
        localStorage.setItem(this.storageKeys.currentUser, JSON.stringify(this.currentUser));
        localStorage.setItem(this.storageKeys.products, JSON.stringify(this.products));
        localStorage.setItem(this.storageKeys.orders, JSON.stringify(this.orders));
        localStorage.setItem(this.storageKeys.users, JSON.stringify(this.users));
        localStorage.setItem(this.storageKeys.cart, JSON.stringify(this.cart));
        localStorage.setItem(this.storageKeys.reviews, JSON.stringify(this.reviews));
        localStorage.setItem(this.storageKeys.ingredients, JSON.stringify(this.ingredients));
        localStorage.setItem(this.storageKeys.recipes, JSON.stringify(this.recipes));
    }

    debouncedSyncToDatabase() {
        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
        }

        this.syncDebounceTimer = setTimeout(() => {
            this.pushStateToDatabase();
        }, 120);
    }

    async pushStateToDatabase() {
        const payload = {
            currentUser: this.currentUser,
            products: this.products,
            orders: this.orders,
            users: this.users,
            cart: this.cart,
            reviews: this.reviews,
            ingredients: this.ingredients,
            recipes: this.recipes
        };

        try {
            const res = await fetch(`${this.apiBase}/state`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                throw new Error(`Sync failed with status ${res.status}`);
            }

            this.isBackendAvailable = true;
            this.hasShownBackendError = false;
        } catch {
            this.isBackendAvailable = false;
            if (!this.hasShownBackendError) {
                this.showMessage('Could not sync to backend SQL. Start server with: npm start', 'error');
                this.hasShownBackendError = true;
            }
            // Keep local cache if server sync fails.
        }
    }

    // ---------- Events ----------
    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const pageLink = e.target.closest('[data-page]');
            if (pageLink) {
                e.preventDefault();
                this.navigateTo(pageLink.dataset.page);
                return;
            }

            if (e.target.matches('.close-modal') || e.target.id === 'appModal') {
                this.closeModal();
                return;
            }

            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;

            const action = actionEl.dataset.action;
            switch (action) {
                // Products
                case 'add-to-cart':
                    this.addToCart(Number(actionEl.dataset.productId));
                    break;
                case 'view-reviews':
                    this.openReviewsModal(Number(actionEl.dataset.productId));
                    break;
                case 'add-review':
                    this.openReviewsModal(Number(actionEl.dataset.productId), { focusForm: true });
                    break;

                // Cart
                case 'remove-from-cart':
                    this.removeFromCart(Number(actionEl.dataset.productId));
                    break;
                case 'qty-decrease':
                    this.updateQuantity(Number(actionEl.dataset.productId), 'decrease');
                    break;
                case 'qty-increase':
                    this.updateQuantity(Number(actionEl.dataset.productId), 'increase');
                    break;

                // Auth
                case 'logout':
                    this.logout();
                    break;

                // Dashboard
                case 'dashboard-section':
                    this.setActiveDashboardSection(actionEl.dataset.section);
                    break;
                case 'open-product-create':
                    this.openProductModal();
                    break;
                case 'open-product-edit':
                    this.openProductModal(Number(actionEl.dataset.productId));
                    break;
                case 'delete-product':
                    this.deleteProduct(Number(actionEl.dataset.productId));
                    break;
                case 'order-update-status':
                    this.updateOrderStatus(Number(actionEl.dataset.orderId), actionEl.dataset.status);
                    break;
                case 'order-assign-delivery':
                    this.assignDelivery(Number(actionEl.dataset.orderId));
                    break;
                case 'open-staff-user-create':
                    this.openStaffUserModal();
                    break;
                case 'delete-user':
                    this.deleteUser(Number(actionEl.dataset.userId));
                    break;
                case 'open-user-edit':
                    this.openStaffUserModal(Number(actionEl.dataset.userId));
                    break;
                case 'customer-cancel-order':
                    this.customerCancelOrder(Number(actionEl.dataset.orderId));
                    break;
                case 'open-account-edit':
                    this.openAccountModal();
                    break;
                default:
                    break;
            }
        });

        document.addEventListener('submit', (e) => {
            const form = e.target;

            if (form.id === 'loginForm') {
                e.preventDefault();
                this.handleLogin(form);
            } else if (form.id === 'registerForm') {
                e.preventDefault();
                this.handleRegister(form);
            } else if (form.id === 'forgotPasswordForm') {
                e.preventDefault();
                this.handleForgotPassword(form);
            } else if (form.id === 'checkoutForm') {
                e.preventDefault();
                this.handleCheckout(form);
            } else if (form.id === 'productForm') {
                e.preventDefault();
                this.handleProductForm(form);
            } else if (form.id === 'staffUserForm') {
                e.preventDefault();
                this.handleStaffUserForm(form);
            } else if (form.id === 'reviewForm') {
                e.preventDefault();
                this.handleReviewForm(form);
            } else if (form.id === 'inventoryForm' || form.classList.contains('inventoryForm')) {
                e.preventDefault();
                this.handleInventoryForm(form);
            } else if (form.id === 'accountForm') {
                e.preventDefault();
                this.handleAccountForm(form);
            }
        });
    }

    // ---------- Navigation ----------
    navigateTo(page) {
        const pages = document.querySelectorAll('.page');
        pages.forEach((p) => p.classList.add('hidden'));

        const target = document.getElementById(page);
        if (target) target.classList.remove('hidden');

        this.updateNavbar();

        if (page === 'home') {
            this.renderFeatured();
        } else if (page === 'products') {
            this.renderProducts();
        } else if (page === 'cart') {
            this.renderCart();
        } else if (page === 'orders') {
            this.renderCustomerOrdersPage();
        } else if (page === 'feedback') {
            this.renderFeedbackPage();
        } else if (page === 'dashboard') {
            this.renderDashboard();
        }
    }

    // ---------- Auth ----------
    handleLogin(form) {
        const fd = new FormData(form);
        const username = String(fd.get('username') || '').trim();
        const password = String(fd.get('password') || '');

        const user = this.users.find((u) => u.username === username && u.password === password);
        if (!user) {
            this.showMessage('Invalid credentials!', 'error');
            return;
        }

        this.currentUser = user;
        this.saveToStorage();
        this.showMessage('Login successful!', 'success');

        if (['admin', 'employee', 'delivery'].includes(user.role)) {
            this.navigateTo('dashboard');
        } else {
            this.navigateTo('home');
        }
    }

    handleRegister(form) {
        const fd = new FormData(form);
        const name = String(fd.get('name') || '').trim();
        const username = String(fd.get('username') || '').trim();
        const email = String(fd.get('email') || '').trim();
        const password = String(fd.get('password') || '');

        if (!name || !username || !email || !password) {
            this.showMessage('Please fill in all fields.', 'error');
            return;
        }

        if (this.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
            this.showMessage('Username already exists!', 'error');
            return;
        }

        const userData = {
            id: Date.now(),
            username,
            password,
            email,
            name,
            role: 'customer'
        };

        this.users.push(userData);
        this.saveToStorage();
        this.showMessage('Registration successful! Please login.', 'success');
        this.navigateTo('login');
    }

    handleForgotPassword(form) {
        const fd = new FormData(form);
        const username = String(fd.get('username') || '').trim();
        const email = String(fd.get('email') || '').trim();
        const newPassword = String(fd.get('newPassword') || '');

        const user = this.users.find((u) => u.username === username && u.email === email);
        if (!user) {
            this.showMessage('No matching user found (username + email).', 'error');
            return;
        }

        user.password = newPassword;
        this.saveToStorage();
        this.showMessage('Password updated. Please login.', 'success');
        this.navigateTo('login');
    }

    logout() {
        this.currentUser = null;
        this.cart = [];
        this.saveToStorage();
        this.updateCartCount();
        this.navigateTo('home');
        this.showMessage('Logged out successfully!', 'success');
    }

    // ---------- Navbar ----------
    updateNavbar() {
        const actions = document.querySelector('.navbar-actions');
        if (!actions) return;

        if (!this.currentUser) {
            actions.innerHTML = `
                <a href="#" data-page="login" class="btn btn-secondary">Login</a>
                <a href="#" data-page="register" class="btn btn-primary">Register</a>
            `;
            return;
        }

        const roleLabel = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
        const common = `<span class="nav-welcome">${this.escapeHtml(this.currentUser.name)} (${roleLabel})</span>`;

        if (this.currentUser.role === 'customer') {
            actions.innerHTML = `
                ${common}
                <a href="#" data-page="orders" class="btn btn-secondary">My Orders</a>
                <a href="#" data-page="cart" class="btn btn-secondary">Cart (<span id="cartCount">0</span>)</a>
                <button class="btn btn-danger" data-action="logout">Logout</button>
            `;
            this.updateCartCount();
            return;
        }

        actions.innerHTML = `
            ${common}
            <a href="#" data-page="dashboard" class="btn btn-secondary">Dashboard</a>
            <button class="btn btn-danger" data-action="logout">Logout</button>
        `;
    }

    // ---------- Products ----------
    renderFeatured() {
        const container = document.getElementById('featuredGrid');
        if (!container) return;

        const featured = [...this.products]
            .sort(() => Math.random() - 0.5)
            .slice(0, 4);
        container.innerHTML = featured.map((p) => this.renderProductCard(p)).join('');
    }

    renderProducts() {
        const container = document.getElementById('productGrid');
        const hint = document.getElementById('productsHint');
        const bestSellingEl = document.getElementById('bestSellingBlock');
        if (!container) return;

        if (hint) {
            if (!this.currentUser) {
                hint.textContent = 'Login to add items to cart and leave reviews.';
            } else if (this.currentUser.role !== 'customer') {
                hint.textContent = 'Staff accounts can browse reviews here; manage products in Dashboard.';
            } else {
                hint.textContent = '';
            }
        }

        container.innerHTML = this.products.map((p) => this.renderProductCard(p)).join('');

        if (bestSellingEl) {
            bestSellingEl.innerHTML = this.renderBestSellingPublicBlock();
        }
    }

    renderBestSellingPublicBlock() {
        // Requirement: Admin and Customer can view best-selling products.
        const salesOrders = this.orders.filter((o) => o.status === 'confirmed' || o.status === 'delivered');
        const top = this.getBestSellingProducts(salesOrders).slice(0, 3);

        if (!top.length) {
            return '<div class="card"><div class="hint">Best-selling products will appear after confirmed sales.</div></div>';
        }

        return `
            <div class="card">
                <div class="inline-list" style="justify-content:space-between;">
                    <strong>Best-Selling Products</strong>
                    <span class="hint">Based on confirmed + delivered orders</span>
                </div>
                <div style="margin-top:0.75rem;" class="inline-list">
                    ${top
                        .map(
                            (row) => `
                                <span class="badge badge-confirmed">${this.escapeHtml(row.name)}: ${row.qty}</span>
                            `
                        )
                        .join('')}
                </div>
            </div>
        `;
    }

    renderProductCard(product) {
        const rating = this.getProductRating(product.id);
        const stars = this.renderStars(rating.avg);
        const canAddToCart = this.currentUser && this.currentUser.role === 'customer';
        const canReview = canAddToCart && this.customerHasPurchasedProduct(this.currentUser.id, product.id);

        return `
            <div class="product-card">
                <img src="${this.escapeAttr(product.image)}" alt="${this.escapeAttr(product.name)}" class="product-image" />
                <div class="product-info">
                    <h3 class="product-name">${this.escapeHtml(product.name)}</h3>
                    <p class="product-description">${this.escapeHtml(product.description)}</p>
                    <div class="product-meta">
                        <div class="product-price">৳${this.formatNumber(product.price)}</div>
                        <div class="product-rating">
                            <span class="stars">${stars}</span>
                            <span>(${rating.count})</span>
                        </div>
                    </div>
                    <div class="product-stock">Stock: ${product.stock}</div>
                    <div class="product-actions">
                        ${canAddToCart ? `<button class="btn btn-primary" data-action="add-to-cart" data-product-id="${product.id}">Add to Cart</button>` : ''}
                        <button class="btn btn-secondary" data-action="view-reviews" data-product-id="${product.id}">Reviews</button>
                        ${canReview ? `<button class="btn btn-success" data-action="add-review" data-product-id="${product.id}">Rate</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ---------- Cart ----------
    addToCart(productId) {
        if (!this.currentUser || this.currentUser.role !== 'customer') {
            this.showMessage('Please login as a customer to add items to cart.', 'error');
            return;
        }

        const product = this.products.find((p) => p.id === productId);
        if (!product) return;

        const cartItem = this.cart.find((i) => i.productId === productId);
        const currentQty = cartItem ? cartItem.quantity : 0;

        if (currentQty + 1 > product.stock) {
            this.showMessage('Not enough stock.', 'error');
            return;
        }

        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            this.cart.push({ productId, quantity: 1 });
        }

        this.saveToStorage();
        this.updateCartCount();
        this.showMessage('Added to cart.', 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter((i) => i.productId !== productId);
        this.saveToStorage();
        this.updateCartCount();
        this.renderCart();
    }

    updateQuantity(productId, direction) {
        const item = this.cart.find((i) => i.productId === productId);
        const product = this.products.find((p) => p.id === productId);
        if (!item || !product) return;

        if (direction === 'increase') {
            if (item.quantity + 1 > product.stock) {
                this.showMessage('Not enough stock.', 'error');
                return;
            }
            item.quantity += 1;
        } else {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
                return;
            }
        }

        this.saveToStorage();
        this.updateCartCount();
        this.renderCart();
    }

    renderCart() {
        const container = document.getElementById('cartItems');
        const totalEl = document.getElementById('cartTotal');
        if (!container) return;

        if (!this.currentUser || this.currentUser.role !== 'customer') {
            container.innerHTML = '<p class="text-center">Please login as a customer to view your cart.</p>';
            if (totalEl) totalEl.textContent = '৳0';
            return;
        }

        if (this.cart.length === 0) {
            container.innerHTML = '<p class="text-center">Your cart is empty.</p>';
            if (totalEl) totalEl.textContent = '৳0';
            return;
        }

        let total = 0;
        container.innerHTML = this.cart.map((item) => {
            const product = this.products.find((p) => p.id === item.productId);
            if (!product) return '';
            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            return `
                <div class="cart-item">
                    <img src="${this.escapeAttr(product.image)}" alt="${this.escapeAttr(product.name)}" class="cart-item-image" />
                    <div class="cart-item-details">
                        <h4>${this.escapeHtml(product.name)}</h4>
                        <p>৳${this.formatNumber(product.price)} each</p>
                        <div class="quantity-controls">
                            <button class="quantity-btn" data-action="qty-decrease" data-product-id="${product.id}">-</button>
                            <span>Qty: ${item.quantity}</span>
                            <button class="quantity-btn" data-action="qty-increase" data-product-id="${product.id}">+</button>
                        </div>
                        <p><strong>Total: ৳${this.formatNumber(itemTotal)}</strong></p>
                    </div>
                    <button class="btn btn-danger" data-action="remove-from-cart" data-product-id="${product.id}">Remove</button>
                </div>
            `;
        }).join('');

        if (totalEl) totalEl.textContent = `৳${this.formatNumber(total)}`;
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (!cartCount) return;
        const count = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = String(count);
    }

    // ---------- Orders ----------
    handleCheckout(form) {
        if (!this.currentUser || this.currentUser.role !== 'customer') {
            this.showMessage('Please login as a customer to checkout.', 'error');
            return;
        }

        if (this.cart.length === 0) {
            this.showMessage('Cart is empty.', 'error');
            return;
        }

        // Ensure stock is available at order time (pending state).
        for (const item of this.cart) {
            const product = this.products.find((p) => p.id === item.productId);
            if (!product) {
                this.showMessage('A product in your cart no longer exists.', 'error');
                return;
            }
            if (item.quantity > product.stock) {
                this.showMessage(`Not enough stock for ${product.name}.`, 'error');
                return;
            }
        }

        const fd = new FormData(form);
        const paymentMethod = String(fd.get('paymentMethod') || 'cod');
        const address = String(fd.get('address') || '').trim();
        const phone = String(fd.get('phone') || '').trim();
        if (!address || !phone) {
            this.showMessage('Please provide delivery address and phone.', 'error');
            return;
        }

        const items = this.cart.map((i) => {
            const product = this.products.find((p) => p.id === i.productId);
            return {
                productId: i.productId,
                quantity: i.quantity,
                priceAtOrder: product.price
            };
        });

        const total = items.reduce((sum, i) => sum + i.quantity * i.priceAtOrder, 0);

        const order = {
            id: Date.now(),
            customerId: this.currentUser.id,
            customerName: this.currentUser.name,
            items,
            total,
            status: 'pending',
            paymentMethod,
            address,
            phone,
            date: new Date().toISOString(),
            deliveryPersonId: null,
            deliveryPersonName: null,
            confirmedAt: null,
            deliveredAt: null
        };

        this.orders.push(order);
        this.cart = [];
        this.saveToStorage();
        this.updateCartCount();

        this.showMessage('Order placed! Awaiting confirmation.', 'success');
        this.navigateTo('home');
    }

    customerCancelOrder(orderId) {
        if (!this.currentUser || this.currentUser.role !== 'customer') return;
        const order = this.orders.find((o) => o.id === orderId && o.customerId === this.currentUser.id);
        if (!order) return;

        if (order.status !== 'pending') {
            this.showMessage('You can only cancel before confirmation.', 'error');
            return;
        }

        order.status = 'cancelled';
        this.saveToStorage();
        this.renderFeedbackPage();
        this.showMessage('Order cancelled.', 'success');
    }

    updateOrderStatus(orderId, status) {
        if (!this.currentUser || !['admin', 'employee', 'delivery'].includes(this.currentUser.role)) {
            return;
        }

        const order = this.orders.find((o) => o.id === orderId);
        if (!order) return;

        // Role-based constraints
        if (this.currentUser.role === 'delivery') {
            const isAssigned = order.deliveryPersonId === this.currentUser.id;
            if (!isAssigned || status !== 'delivered') {
                this.showMessage('You can only mark your assigned orders as delivered.', 'error');
                return;
            }
        }

        if (status === 'confirmed') {
            if (order.status !== 'pending') return;

            // Reduce stock AFTER confirmation (inventory requirement).
            for (const item of order.items) {
                const product = this.products.find((p) => p.id === item.productId);
                if (!product) {
                    this.showMessage('Cannot confirm: product missing.', 'error');
                    return;
                }
                if (item.quantity > product.stock) {
                    this.showMessage(`Cannot confirm: not enough stock for ${product.name}.`, 'error');
                    return;
                }
            }

            // Validate ingredient availability if we have a recipe for the product.
            const ingredientNeeds = this.computeIngredientNeeds(order.items);
            const insufficient = this.findInsufficientIngredients(ingredientNeeds);
            if (insufficient.length) {
                this.showMessage(`Cannot confirm: insufficient ingredients (${insufficient.join(', ')}).`, 'error');
                return;
            }

            for (const item of order.items) {
                const product = this.products.find((p) => p.id === item.productId);
                product.stock -= item.quantity;
            }

            // Reduce ingredient inventory after order confirmation.
            this.applyIngredientNeeds(ingredientNeeds);

            order.status = 'confirmed';
            order.confirmedAt = new Date().toISOString();
        } else if (status === 'cancelled') {
            if (order.status !== 'pending') {
                this.showMessage('Only pending orders can be cancelled/rejected.', 'error');
                return;
            }
            order.status = 'cancelled';
        } else if (status === 'delivered') {
            if (order.status !== 'confirmed') {
                this.showMessage('Only confirmed orders can be delivered.', 'error');
                return;
            }
            order.status = 'delivered';
            order.deliveredAt = new Date().toISOString();
        }

        this.saveToStorage();
        if (document.getElementById('dashboard') && !document.getElementById('dashboard').classList.contains('hidden')) {
            this.showDashboardSection(this.activeDashboardSection);
        }
        this.showMessage(`Order updated: ${status}.`, 'success');
    }

    assignDelivery(orderId) {
        if (!this.currentUser || !['admin', 'employee'].includes(this.currentUser.role)) return;
        const order = this.orders.find((o) => o.id === orderId);
        if (!order) return;
        if (order.status !== 'confirmed') {
            this.showMessage('Assign delivery after confirmation.', 'error');
            return;
        }

        const select = document.querySelector(`[data-assign-select="${orderId}"]`);
        if (!select) return;
        const deliveryId = Number(select.value);
        const deliveryUser = this.users.find((u) => u.id === deliveryId && u.role === 'delivery');
        if (!deliveryUser) {
            this.showMessage('Select a delivery person.', 'error');
            return;
        }

        order.deliveryPersonId = deliveryUser.id;
        order.deliveryPersonName = deliveryUser.name;
        this.saveToStorage();
        this.showDashboardSection(this.activeDashboardSection);
        this.showMessage('Delivery assigned.', 'success');
    }

    // ---------- Ingredient Inventory ----------
    computeIngredientNeeds(orderItems) {
        // Returns Map<ingredientId, totalRequired>
        const needs = new Map();
        for (const item of orderItems) {
            const recipe = this.recipes[String(item.productId)] || this.recipes[item.productId];
            if (!recipe) continue;
            for (const [ingredientIdRaw, perUnit] of Object.entries(recipe)) {
                const ingredientId = Number(ingredientIdRaw);
                const required = Number(perUnit) * Number(item.quantity);
                needs.set(ingredientId, (needs.get(ingredientId) || 0) + required);
            }
        }
        return needs;
    }

    findInsufficientIngredients(needsMap) {
        const insufficient = [];
        for (const [ingredientId, required] of needsMap.entries()) {
            const ing = this.ingredients.find((i) => i.id === ingredientId);
            if (!ing) {
                insufficient.push(`Ingredient#${ingredientId}`);
                continue;
            }
            if (required > ing.stock) {
                insufficient.push(ing.name);
            }
        }
        return insufficient;
    }

    applyIngredientNeeds(needsMap) {
        for (const [ingredientId, required] of needsMap.entries()) {
            const ing = this.ingredients.find((i) => i.id === ingredientId);
            if (!ing) continue;
            ing.stock = Math.max(0, ing.stock - required);
        }
    }

    // ---------- Dashboard ----------
    renderDashboard() {
        if (!this.currentUser || !['admin', 'employee', 'delivery'].includes(this.currentUser.role)) {
            this.showMessage('Please login as staff to access the dashboard.', 'error');
            this.navigateTo('home');
            return;
        }

        const roleEl = document.getElementById('sidebarRole');
        if (roleEl) roleEl.textContent = `${this.currentUser.name} • ${this.currentUser.role}`;

        this.renderDashboardSidebar();
        this.setActiveDashboardSection('overview');
    }

    renderDashboardSidebar() {
        const menu = document.getElementById('sidebarMenu');
        if (!menu) return;

        const items = [];
        if (this.currentUser.role === 'admin') {
            items.push(
                { key: 'overview', label: 'Overview' },
                { key: 'products', label: 'Products' },
                { key: 'inventory', label: 'Inventory' },
                { key: 'orders', label: 'Orders' },
                { key: 'users', label: 'Users' },
                { key: 'reports', label: 'Reports' }
            );
        } else if (this.currentUser.role === 'employee') {
            items.push(
                { key: 'overview', label: 'Overview' },
                { key: 'account', label: 'My Account' },
                { key: 'products', label: 'Products' },
                { key: 'inventory', label: 'Inventory' },
                { key: 'orders', label: 'Orders' },
                { key: 'reports', label: 'Reports' }
            );
        } else {
            items.push(
                { key: 'overview', label: 'Overview' },
                { key: 'account', label: 'My Account' },
                { key: 'deliveries', label: 'Deliveries' },
                { key: 'history', label: 'History' }
            );
        }

        menu.innerHTML = items
            .map((i) => `<li data-action="dashboard-section" data-section="${i.key}">${this.escapeHtml(i.label)}</li>`)
            .join('');
    }

    setActiveDashboardSection(section) {
        this.activeDashboardSection = section;
        const menu = document.getElementById('sidebarMenu');
        if (menu) {
            [...menu.querySelectorAll('li')].forEach((li) => {
                li.classList.toggle('active', li.dataset.section === section);
            });
        }
        this.showDashboardSection(section);
    }

    showDashboardSection(section) {
        const content = document.getElementById('dashboardContent');
        if (!content) return;

        if (section === 'overview') {
            this.renderOverview(content);
        } else if (section === 'products') {
            this.renderProductManagement(content);
        } else if (section === 'inventory') {
            this.renderInventoryManagement(content);
        } else if (section === 'orders') {
            this.renderOrderManagement(content);
        } else if (section === 'users') {
            this.renderUserManagement(content);
        } else if (section === 'reports') {
            this.renderReports(content);
        } else if (section === 'account') {
            this.renderAccountSection(content);
        } else if (section === 'deliveries') {
            this.renderDeliveryQueue(content);
        } else if (section === 'history') {
            this.renderDeliveryHistory(content);
        }
    }

    renderOverview(container) {
        if (this.currentUser.role === 'delivery') {
            const assigned = this.orders.filter(
                (o) => o.status === 'confirmed' && o.deliveryPersonId === this.currentUser.id
            );
            const delivered = this.orders.filter(
                (o) => o.status === 'delivered' && o.deliveryPersonId === this.currentUser.id
            );

            container.innerHTML = `
                <h2>Delivery Overview</h2>
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-value">${assigned.length}</div><div class="stat-label">Assigned</div></div>
                    <div class="stat-card"><div class="stat-value">${delivered.length}</div><div class="stat-label">Delivered</div></div>
                </div>
                <div class="data-table">
                    <h3>Assigned Deliveries</h3>
                    <table>
                        <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Address</th><th>Action</th></tr></thead>
                        <tbody>
                            ${assigned
                                .map(
                                    (o) => `
                                        <tr>
                                            <td>#${o.id}</td>
                                            <td>${this.escapeHtml(o.customerName)}</td>
                                            <td>${this.escapeHtml(o.phone)}</td>
                                            <td>${this.escapeHtml(o.address)}</td>
                                            <td><button class="btn btn-primary" data-action="order-update-status" data-order-id="${o.id}" data-status="delivered">Mark Delivered</button></td>
                                        </tr>
                                    `
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>
            `;
            return;
        }

        const totalOrders = this.orders.length;
        const pendingOrders = this.orders.filter((o) => o.status === 'pending').length;
        const revenue = this.orders
            .filter((o) => ['confirmed', 'delivered'].includes(o.status))
            .reduce((sum, o) => sum + o.total, 0);
        const lowStock = this.products.filter((p) => p.stock <= 5);
        const lowIngredients = this.ingredients.filter((i) => i.stock <= (i.lowThreshold ?? 0));

        container.innerHTML = `
            <h2>Dashboard Overview</h2>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">${totalOrders}</div><div class="stat-label">Total Orders</div></div>
                <div class="stat-card"><div class="stat-value">৳${this.formatNumber(revenue)}</div><div class="stat-label">Revenue (Confirmed+Delivered)</div></div>
                <div class="stat-card"><div class="stat-value">${pendingOrders}</div><div class="stat-label">Pending Orders</div></div>
                <div class="stat-card"><div class="stat-value">${lowStock.length}</div><div class="stat-label">Low Stock Products</div></div>
                <div class="stat-card"><div class="stat-value">${lowIngredients.length}</div><div class="stat-label">Low Stock Ingredients</div></div>
            </div>

            ${lowStock.length ? `
                <div class="data-table mb-2">
                    <h3>Low Stock Notifications</h3>
                    <table>
                        <thead><tr><th>Product</th><th>Stock</th></tr></thead>
                        <tbody>
                            ${lowStock
                                .map((p) => `<tr><td>${this.escapeHtml(p.name)}</td><td>${p.stock}</td></tr>`)
                                .join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            ${lowIngredients.length ? `
                <div class="data-table mb-2">
                    <h3>Low Ingredient Stock</h3>
                    <table>
                        <thead><tr><th>Ingredient</th><th>Stock</th><th>Threshold</th></tr></thead>
                        <tbody>
                            ${lowIngredients
                                .map((i) => `<tr><td>${this.escapeHtml(i.name)}</td><td>${this.formatNumber(i.stock)}</td><td>${this.formatNumber(i.lowThreshold ?? 0)}</td></tr>`)
                                .join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}

            <div class="data-table">
                <h3>Recent Orders</h3>
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                        ${this.orders
                            .slice(-7)
                            .reverse()
                            .map(
                                (o) => `
                                    <tr>
                                        <td>#${o.id}</td>
                                        <td>${this.escapeHtml(o.customerName)}</td>
                                        <td>৳${this.formatNumber(o.total)}</td>
                                        <td><span class="badge badge-${o.status}">${o.status}</span></td>
                                        <td>${new Date(o.date).toLocaleString()}</td>
                                    </tr>
                                `
                            )
                            .join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ----- Product Management (Admin/Employee) -----
    renderProductManagement(container) {
        if (!['admin', 'employee'].includes(this.currentUser.role)) {
            container.innerHTML = '<p>You do not have access to product management.</p>';
            return;
        }

        const canCreateDelete = this.currentUser.role === 'admin';
        const help = this.currentUser.role === 'employee'
            ? 'Employees can update product details and stock.'
            : 'Admin can add, edit, and delete products.';

        container.innerHTML = `
            <h2>Product Management</h2>
            <p class="hint mb-1">${help}</p>
            <div class="mb-1">
                ${canCreateDelete ? `<button class="btn btn-primary" data-action="open-product-create">Add Product</button>` : ''}
            </div>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.products
                            .map(
                                (p) => `
                                    <tr>
                                        <td>${this.escapeHtml(p.name)}</td>
                                        <td>${this.escapeHtml(p.category)}</td>
                                        <td>৳${this.formatNumber(p.price)}</td>
                                        <td>${p.stock}</td>
                                        <td>
                                            <button class="btn btn-secondary" data-action="open-product-edit" data-product-id="${p.id}">Edit</button>
                                            ${canCreateDelete ? `<button class="btn btn-danger" data-action="delete-product" data-product-id="${p.id}">Delete</button>` : ''}
                                        </td>
                                    </tr>
                                `
                            )
                            .join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ----- Inventory Management (Admin/Employee) -----
    renderInventoryManagement(container) {
        if (!['admin', 'employee'].includes(this.currentUser.role)) {
            container.innerHTML = '<p>You do not have access to inventory management.</p>';
            return;
        }

        container.innerHTML = `
            <h2>Inventory Management (Ingredients)</h2>
            <p class="hint mb-1">Update ingredient stock levels. Ingredient stock reduces automatically after order confirmation.</p>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Ingredient</th>
                            <th>Stock</th>
                            <th>Low Stock Threshold</th>
                            <th>Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.ingredients
                            .map(
                                (i) => `
                                    <tr>
                                        <td>${this.escapeHtml(i.name)}</td>
                                        <td>${this.formatNumber(i.stock)}</td>
                                        <td>${this.formatNumber(i.lowThreshold ?? 0)}</td>
                                        <td>
                                            <form class="inventoryForm" data-ingredient-id="${i.id}" style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
                                                <input type="hidden" name="ingredientId" value="${i.id}" />
                                                <input class="form-control" style="max-width:160px;" name="stock" type="number" min="0" step="1" value="${i.stock}" required />
                                                <input class="form-control" style="max-width:160px;" name="lowThreshold" type="number" min="0" step="1" value="${i.lowThreshold ?? 0}" required />
                                                <button class="btn btn-primary" type="submit">Save</button>
                                            </form>
                                        </td>
                                    </tr>
                                `
                            )
                            .join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    handleInventoryForm(form) {
        if (!this.currentUser || !['admin', 'employee'].includes(this.currentUser.role)) return;
        const fd = new FormData(form);
        const ingredientId = Number(fd.get('ingredientId'));
        const stock = Number(fd.get('stock'));
        const lowThreshold = Number(fd.get('lowThreshold'));

        const ing = this.ingredients.find((i) => i.id === ingredientId);
        if (!ing || Number.isNaN(stock) || Number.isNaN(lowThreshold)) {
            this.showMessage('Invalid inventory input.', 'error');
            return;
        }

        ing.stock = Math.max(0, Math.round(stock));
        ing.lowThreshold = Math.max(0, Math.round(lowThreshold));

        this.saveToStorage();
        this.showMessage('Inventory updated.', 'success');
        this.showDashboardSection('inventory');
    }

    openProductModal(productId) {
        if (!this.currentUser || !['admin', 'employee'].includes(this.currentUser.role)) return;
        if (this.currentUser.role !== 'admin' && !productId) {
            this.showMessage('Only admin can add products.', 'error');
            return;
        }

        const product = productId ? this.products.find((p) => p.id === productId) : null;
        const title = product ? 'Edit Product' : 'Add Product';
        const safe = (v) => this.escapeAttr(v ?? '');

        this.openModal(
            title,
            `
                <form id="productForm">
                    <input type="hidden" name="id" value="${product ? product.id : ''}" />
                    <div class="form-group">
                        <label>Name</label>
                        <input class="form-control" name="name" value="${safe(product?.name)}" required />
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-control" name="description" rows="3" required>${product ? this.escapeHtml(product.description) : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input class="form-control" name="category" value="${safe(product?.category)}" required />
                    </div>
                    <div class="form-group">
                        <label>Price (BDT)</label>
                        <input class="form-control" name="price" type="number" min="0" step="1" value="${product ? product.price : ''}" required />
                    </div>
                    <div class="form-group">
                        <label>Stock</label>
                        <input class="form-control" name="stock" type="number" min="0" step="1" value="${product ? product.stock : ''}" required />
                    </div>
                    <div class="form-group">
                        <label>Image URL</label>
                        <input class="form-control" name="image" value="${safe(product?.image)}" required />
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" type="submit">Save</button>
                        <button class="btn btn-secondary" type="button" onclick="window.app.closeModal()">Cancel</button>
                    </div>
                </form>
            `
        );
    }

    handleProductForm(form) {
        if (!this.currentUser || !['admin', 'employee'].includes(this.currentUser.role)) return;

        const fd = new FormData(form);
        const idRaw = String(fd.get('id') || '').trim();
        const name = String(fd.get('name') || '').trim();
        const description = String(fd.get('description') || '').trim();
        const category = String(fd.get('category') || '').trim();
        const price = Number(fd.get('price'));
        const stock = Number(fd.get('stock'));
        const image = String(fd.get('image') || '').trim();

        if (!name || !description || !category || !image || Number.isNaN(price) || Number.isNaN(stock)) {
            this.showMessage('Please fill out all product fields.', 'error');
            return;
        }

        const isEdit = Boolean(idRaw);
        if (!isEdit && this.currentUser.role !== 'admin') {
            this.showMessage('Only admin can add products.', 'error');
            return;
        }

        if (isEdit) {
            const id = Number(idRaw);
            const existing = this.products.find((p) => p.id === id);
            if (!existing) return;
            existing.name = name;
            existing.description = description;
            existing.category = category;
            existing.price = Math.max(0, Math.round(price));
            existing.stock = Math.max(0, Math.round(stock));
            existing.image = image;
        } else {
            const newProduct = {
                id: Date.now(),
                name,
                description,
                category,
                price: Math.max(0, Math.round(price)),
                stock: Math.max(0, Math.round(stock)),
                image
            };
            this.products.push(newProduct);
        }

        this.saveToStorage();
        this.closeModal();
        this.showDashboardSection('products');
        this.renderProducts();
        this.renderFeatured();
        this.showMessage('Product saved.', 'success');
    }

    deleteProduct(productId) {
        if (!this.currentUser || this.currentUser.role !== 'admin') {
            this.showMessage('Only admin can delete products.', 'error');
            return;
        }
        const product = this.products.find((p) => p.id === productId);
        if (!product) return;

        const usedInOrders = this.orders.some((o) => o.items.some((i) => i.productId === productId));
        if (usedInOrders) {
            this.showMessage('Cannot delete: product exists in order history.', 'error');
            return;
        }

        this.products = this.products.filter((p) => p.id !== productId);
        this.cart = this.cart.filter((i) => i.productId !== productId);
        this.reviews = this.reviews.filter((r) => r.productId !== productId);
        this.saveToStorage();
        this.showDashboardSection('products');
        this.renderProducts();
        this.renderFeatured();
        this.showMessage('Product deleted.', 'success');
    }

    // ----- Order Management (Admin/Employee) -----
    renderOrderManagement(container) {
        if (!['admin', 'employee'].includes(this.currentUser.role)) {
            container.innerHTML = '<p>You do not have access to order management.</p>';
            return;
        }

        const deliveryPeople = this.users.filter((u) => u.role === 'delivery');

        container.innerHTML = `
            <h2>Order Management</h2>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Delivery</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.orders
                            .slice()
                            .reverse()
                            .map((o) => {
                                const itemCount = o.items.reduce((sum, i) => sum + i.quantity, 0);
                                const deliveryCell = o.status === 'confirmed'
                                    ? (o.deliveryPersonId
                                        ? `${this.escapeHtml(o.deliveryPersonName || 'Assigned')}`
                                        : `
                                            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
                                                <select class="form-control" style="max-width:220px;" data-assign-select="${o.id}">
                                                    <option value="">Select</option>
                                                    ${deliveryPeople.map((d) => `<option value="${d.id}">${this.escapeHtml(d.name)}</option>`).join('')}
                                                </select>
                                                <button class="btn btn-secondary" data-action="order-assign-delivery" data-order-id="${o.id}">Assign</button>
                                            </div>
                                        `)
                                    : (o.deliveryPersonName ? this.escapeHtml(o.deliveryPersonName) : '-');

                                const actions = o.status === 'pending'
                                    ? `
                                        <button class="btn btn-success" data-action="order-update-status" data-order-id="${o.id}" data-status="confirmed">Confirm</button>
                                        <button class="btn btn-danger" data-action="order-update-status" data-order-id="${o.id}" data-status="cancelled">Reject</button>
                                    `
                                    : (o.status === 'confirmed'
                                        ? `<span class="hint">Waiting delivery</span>`
                                        : '<span class="hint">—</span>');

                                return `
                                    <tr>
                                        <td>#${o.id}</td>
                                        <td>${this.escapeHtml(o.customerName)}</td>
                                        <td>${itemCount}</td>
                                        <td>৳${this.formatNumber(o.total)}</td>
                                        <td><span class="badge badge-${o.status}">${o.status}</span></td>
                                        <td>${deliveryCell}</td>
                                        <td>${actions}</td>
                                    </tr>
                                `;
                            })
                            .join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ----- User Management (Admin) -----
    renderUserManagement(container) {
        if (this.currentUser.role !== 'admin') {
            container.innerHTML = '<p>Only admin can manage users.</p>';
            return;
        }

        const staff = this.users.filter((u) => u.role === 'employee' || u.role === 'delivery');

        container.innerHTML = `
            <h2>User Management</h2>
            <p class="hint mb-1">Create and delete employee/delivery accounts.</p>
            <div class="mb-1">
                <button class="btn btn-primary" data-action="open-staff-user-create">Add Staff Account</button>
            </div>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${staff
                            .map(
                                (u) => `
                                    <tr>
                                        <td>${this.escapeHtml(u.name)}</td>
                                        <td>${this.escapeHtml(u.username)}</td>
                                        <td>${this.escapeHtml(u.email)}</td>
                                        <td>${this.escapeHtml(u.role)}</td>
                                        <td>
                                            <button class="btn btn-secondary" data-action="open-user-edit" data-user-id="${u.id}">Edit</button>
                                            <button class="btn btn-danger" data-action="delete-user" data-user-id="${u.id}">Delete</button>
                                        </td>
                                    </tr>
                                `
                            )
                            .join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    openStaffUserModal(userId) {
        if (!this.currentUser || this.currentUser.role !== 'admin') return;

        const editUser = userId ? this.users.find((u) => u.id === userId) : null;
        if (editUser && !['employee', 'delivery'].includes(editUser.role)) {
            this.showMessage('Only employee/delivery accounts can be edited here.', 'error');
            return;
        }

        this.openModal(
            editUser ? 'Edit Staff Account' : 'Add Staff Account',
            `
                <form id="staffUserForm">
                    <input type="hidden" name="id" value="${editUser ? editUser.id : ''}" />
                    <div class="form-group">
                        <label>Full Name</label>
                        <input class="form-control" name="name" value="${editUser ? this.escapeAttr(editUser.name) : ''}" required />
                    </div>
                    <div class="form-group">
                        <label>Username</label>
                        <input class="form-control" name="username" value="${editUser ? this.escapeAttr(editUser.username) : ''}" ${editUser ? 'readonly' : ''} required />
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input class="form-control" name="email" type="email" value="${editUser ? this.escapeAttr(editUser.email) : ''}" required />
                    </div>
                    <div class="form-group">
                        <label>Password</label>
                        <input class="form-control" name="password" type="password" minlength="4" ${editUser ? '' : 'required'} />
                        ${editUser ? '<div class="hint">Leave blank to keep existing password.</div>' : ''}
                    </div>
                    <div class="form-group">
                        <label>Role</label>
                        <select class="form-control" name="role" required>
                            <option value="employee" ${editUser?.role === 'employee' ? 'selected' : ''}>Employee</option>
                            <option value="delivery" ${editUser?.role === 'delivery' ? 'selected' : ''}>Delivery</option>
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" type="submit">${editUser ? 'Save' : 'Create'}</button>
                        <button class="btn btn-secondary" type="button" onclick="window.app.closeModal()">Cancel</button>
                    </div>
                </form>
            `
        );
    }

    handleStaffUserForm(form) {
        if (!this.currentUser || this.currentUser.role !== 'admin') return;

        const fd = new FormData(form);
        const idRaw = String(fd.get('id') || '').trim();
        const name = String(fd.get('name') || '').trim();
        const username = String(fd.get('username') || '').trim();
        const email = String(fd.get('email') || '').trim();
        const password = String(fd.get('password') || '');
        const role = String(fd.get('role') || '');

        if (!name || !username || !email || !password || !['employee', 'delivery'].includes(role)) {
            // For edit mode, password can be blank.
            if (!idRaw || !name || !username || !email || !['employee', 'delivery'].includes(role)) {
                this.showMessage('Please fill out all staff fields.', 'error');
                return;
            }
        }

        const isEdit = Boolean(idRaw);
        if (isEdit) {
            const id = Number(idRaw);
            const existing = this.users.find((u) => u.id === id);
            if (!existing) return;
            if (!['employee', 'delivery'].includes(existing.role)) {
                this.showMessage('Only employee/delivery accounts can be edited.', 'error');
                return;
            }

            existing.name = name;
            existing.email = email;
            existing.role = role;
            if (password) {
                existing.password = password;
            }
        } else {
            if (this.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
                this.showMessage('Username already exists.', 'error');
                return;
            }

            this.users.push({
                id: Date.now(),
                name,
                username,
                email,
                password,
                role
            });
        }

        this.saveToStorage();
        this.closeModal();
        this.showDashboardSection('users');
        this.showMessage(isEdit ? 'Staff account updated.' : 'Staff account created.', 'success');
    }

    deleteUser(userId) {
        if (!this.currentUser || this.currentUser.role !== 'admin') return;
        const user = this.users.find((u) => u.id === userId);
        if (!user || user.role === 'admin') return;

        const assignedOrders = this.orders.some((o) => o.deliveryPersonId === userId);
        if (assignedOrders) {
            this.showMessage('Cannot delete: user is assigned to orders.', 'error');
            return;
        }

        this.users = this.users.filter((u) => u.id !== userId);
        this.saveToStorage();
        this.showDashboardSection('users');
        this.showMessage('User deleted.', 'success');
    }

    // ----- Reports (Admin/Employee) -----
    renderReports(container) {
        if (!['admin', 'employee'].includes(this.currentUser.role)) {
            container.innerHTML = '<p>You do not have access to reports.</p>';
            return;
        }

        const completed = this.orders.filter((o) => o.status === 'delivered');
        const confirmed = this.orders.filter((o) => o.status === 'confirmed');
        const salesOrders = [...confirmed, ...completed];

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(now);
        // Week starts Monday (local time)
        startOfWeek.setHours(0, 0, 0, 0);
        const day = startOfWeek.getDay();
        const diffToMonday = (day + 6) % 7;
        startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const revenueToday = salesOrders
            .filter((o) => new Date(o.confirmedAt || o.date) >= startOfDay)
            .reduce((sum, o) => sum + o.total, 0);
        const revenueWeek = salesOrders
            .filter((o) => new Date(o.confirmedAt || o.date) >= startOfWeek)
            .reduce((sum, o) => sum + o.total, 0);
        const revenueMonth = salesOrders
            .filter((o) => new Date(o.confirmedAt || o.date) >= startOfMonth)
            .reduce((sum, o) => sum + o.total, 0);
        const revenueAll = salesOrders.reduce((sum, o) => sum + o.total, 0);

        const bestSelling = this.getBestSellingProducts(salesOrders).slice(0, 5);

        const isAdmin = this.currentUser.role === 'admin';
        let topCustomers = [];
        if (isAdmin) {
            const byCustomer = new Map();
            for (const o of salesOrders) {
                const key = o.customerId;
                if (!byCustomer.has(key)) {
                    byCustomer.set(key, {
                        customerId: key,
                        name: o.customerName,
                        orders: 0,
                        spent: 0
                    });
                }
                const row = byCustomer.get(key);
                row.orders += 1;
                row.spent += o.total;
            }

            topCustomers = [...byCustomer.values()]
                .map((r) => {
                    const u = this.users.find((x) => x.id === r.customerId);
                    return { ...r, name: u?.name || r.name };
                })
                .sort((a, b) => b.spent - a.spent)
                .slice(0, 5);
        }

        container.innerHTML = `
            <h2>Reports</h2>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">৳${this.formatNumber(revenueToday)}</div><div class="stat-label">Revenue Today</div></div>
                <div class="stat-card"><div class="stat-value">৳${this.formatNumber(revenueWeek)}</div><div class="stat-label">Revenue This Week</div></div>
                <div class="stat-card"><div class="stat-value">৳${this.formatNumber(revenueMonth)}</div><div class="stat-label">Revenue This Month</div></div>
                <div class="stat-card"><div class="stat-value">৳${this.formatNumber(revenueAll)}</div><div class="stat-label">Revenue Total</div></div>
                <div class="stat-card"><div class="stat-value">${salesOrders.length}</div><div class="stat-label">Confirmed+Delivered Orders</div></div>
            </div>
            <div class="data-table">
                <h3>Best-Selling Products</h3>
                <table>
                    <thead><tr><th>Product</th><th>Quantity Sold</th></tr></thead>
                    <tbody>
                        ${bestSelling
                            .map((row) => `<tr><td>${this.escapeHtml(row.name)}</td><td>${row.qty}</td></tr>`)
                            .join('') || '<tr><td colspan="2">No sales data yet.</td></tr>'}
                    </tbody>
                </table>
            </div>

            ${isAdmin ? `
                <div class="data-table">
                    <h3>Top Customers</h3>
                    <table>
                        <thead><tr><th>Customer</th><th>Orders</th><th>Total Spent</th></tr></thead>
                        <tbody>
                            ${topCustomers
                                .map((c) => `<tr><td>${this.escapeHtml(c.name)}</td><td>${c.orders}</td><td>৳${this.formatNumber(c.spent)}</td></tr>`)
                                .join('') || '<tr><td colspan="3">No customer analytics yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;
    }

    getBestSellingProducts(orders) {
        const counts = new Map();
        for (const order of orders) {
            for (const item of order.items) {
                counts.set(item.productId, (counts.get(item.productId) || 0) + item.quantity);
            }
        }

        const rows = [...counts.entries()].map(([productId, qty]) => {
            const product = this.products.find((p) => p.id === productId);
            return { productId, qty, name: product ? product.name : `Product #${productId}` };
        });

        rows.sort((a, b) => b.qty - a.qty);
        return rows;
    }

    // ----- Delivery (Delivery role) -----
    renderDeliveryQueue(container) {
        if (this.currentUser.role !== 'delivery') {
            container.innerHTML = '<p>Only delivery personnel can access this section.</p>';
            return;
        }

        const assigned = this.orders.filter(
            (o) => o.status === 'confirmed' && o.deliveryPersonId === this.currentUser.id
        );

        container.innerHTML = `
            <h2>Assigned Deliveries</h2>
            <div class="data-table">
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Address</th><th>Action</th></tr></thead>
                    <tbody>
                        ${assigned
                            .map(
                                (o) => `
                                    <tr>
                                        <td>#${o.id}</td>
                                        <td>${this.escapeHtml(o.customerName)}</td>
                                        <td>${this.escapeHtml(o.phone)}</td>
                                        <td>${this.escapeHtml(o.address)}</td>
                                        <td><button class="btn btn-primary" data-action="order-update-status" data-order-id="${o.id}" data-status="delivered">Mark Delivered</button></td>
                                    </tr>
                                `
                            )
                            .join('') || '<tr><td colspan="5">No assigned deliveries.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderDeliveryHistory(container) {
        if (this.currentUser.role !== 'delivery') {
            container.innerHTML = '<p>Only delivery personnel can access this section.</p>';
            return;
        }

        const delivered = this.orders
            .filter((o) => o.status === 'delivered' && o.deliveryPersonId === this.currentUser.id)
            .slice()
            .reverse();

        container.innerHTML = `
            <h2>Delivery History</h2>
            <div class="data-table">
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Delivered At</th><th>Address</th></tr></thead>
                    <tbody>
                        ${delivered
                            .map(
                                (o) => `
                                    <tr>
                                        <td>#${o.id}</td>
                                        <td>${this.escapeHtml(o.customerName)}</td>
                                        <td>${o.deliveredAt ? new Date(o.deliveredAt).toLocaleString() : '-'}</td>
                                        <td>${this.escapeHtml(o.address)}</td>
                                    </tr>
                                `
                            )
                            .join('') || '<tr><td colspan="4">No delivered orders yet.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ----- Employee/Delivery self account management -----
    renderAccountSection(container) {
        if (!this.currentUser || !['employee', 'delivery'].includes(this.currentUser.role)) {
            container.innerHTML = '<p>This section is for Employee/Delivery self account management.</p>';
            return;
        }

        container.innerHTML = `
            <h2>My Account</h2>
            <div class="card">
                <div><strong>Name:</strong> ${this.escapeHtml(this.currentUser.name)}</div>
                <div><strong>Username:</strong> ${this.escapeHtml(this.currentUser.username)}</div>
                <div><strong>Email:</strong> ${this.escapeHtml(this.currentUser.email)}</div>
                <div><strong>Role:</strong> ${this.escapeHtml(this.currentUser.role)}</div>
                <div class="mt-1">
                    <button class="btn btn-primary" data-action="open-account-edit">Edit My Account</button>
                </div>
                <div class="hint mt-1">Employees can manage only their own account. Admin manages staff accounts in Users.</div>
            </div>
        `;
    }

    openAccountModal() {
        if (!this.currentUser || !['employee', 'delivery'].includes(this.currentUser.role)) return;

        this.openModal(
            'Edit My Account',
            `
                <form id="accountForm">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input class="form-control" name="name" value="${this.escapeAttr(this.currentUser.name)}" required />
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input class="form-control" name="email" type="email" value="${this.escapeAttr(this.currentUser.email)}" required />
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input class="form-control" name="password" type="password" minlength="4" />
                        <div class="hint">Leave blank to keep your current password.</div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-primary" type="submit">Save</button>
                        <button class="btn btn-secondary" type="button" onclick="window.app.closeModal()">Cancel</button>
                    </div>
                </form>
            `
        );
    }

    handleAccountForm(form) {
        if (!this.currentUser || !['employee', 'delivery'].includes(this.currentUser.role)) return;

        const fd = new FormData(form);
        const name = String(fd.get('name') || '').trim();
        const email = String(fd.get('email') || '').trim();
        const password = String(fd.get('password') || '');

        if (!name || !email) {
            this.showMessage('Name and email are required.', 'error');
            return;
        }

        const user = this.users.find((u) => u.id === this.currentUser.id);
        if (!user) return;

        // Enforce “employees can only manage their own account” by updating only currentUser id.
        user.name = name;
        user.email = email;
        if (password) {
            user.password = password;
        }

        this.currentUser.name = name;
        this.currentUser.email = email;
        if (password) {
            this.currentUser.password = password;
        }

        this.saveToStorage();
        this.closeModal();
        this.updateNavbar();
        this.showMessage('Account updated.', 'success');
        this.showDashboardSection('account');
    }

    // ---------- Reviews / Feedback ----------
    getProductRating(productId) {
        const relevant = this.reviews.filter((r) => r.productId === productId);
        if (relevant.length === 0) return { avg: 0, count: 0 };
        const avg = relevant.reduce((sum, r) => sum + r.rating, 0) / relevant.length;
        return { avg, count: relevant.length };
    }

    customerHasPurchasedProduct(customerId, productId) {
        return this.orders.some(
            (o) => o.customerId === customerId && o.status === 'delivered' && o.items.some((i) => i.productId === productId)
        );
    }

    openReviewsModal(productId, opts = {}) {
        const product = this.products.find((p) => p.id === productId);
        if (!product) return;

        const reviews = this.reviews
            .filter((r) => r.productId === productId)
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const canReview =
            this.currentUser &&
            this.currentUser.role === 'customer' &&
            this.customerHasPurchasedProduct(this.currentUser.id, productId);

        const listHtml = reviews.length
            ? reviews
                  .map(
                      (r) => `
                        <div class="feedback-card" style="margin-bottom:1rem;">
                            <div class="meta">
                                <span>${this.escapeHtml(r.userName)}</span>
                                <span>${new Date(r.date).toLocaleString()}</span>
                            </div>
                            <div class="title">${this.renderStars(r.rating)} <span style="color:var(--text-light);font-weight:600;">(${r.rating}/5)</span></div>
                            <div>${this.escapeHtml(r.comment)}</div>
                        </div>
                      `
                  )
                  .join('')
            : '<p class="hint">No reviews yet.</p>';

        const formHtml = canReview
            ? `
                <hr style="margin:1rem 0; border:none; border-top:1px solid var(--border-color);" />
                <h4>Add Your Review</h4>
                <form id="reviewForm">
                    <input type="hidden" name="productId" value="${productId}" />
                    <div class="form-group">
                        <label>Rating</label>
                        <select class="form-control" name="rating" required>
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Comment</label>
                        <textarea class="form-control" name="comment" rows="3" required></textarea>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-success" type="submit">Submit</button>
                    </div>
                </form>
            `
            : '<p class="hint">To review, you must purchase and receive (delivered) this item.</p>';

        this.openModal(
            `Reviews: ${product.name}`,
            `
                <div class="mb-1">
                    <div class="hint">All users can view feedback history.</div>
                </div>
                ${listHtml}
                ${formHtml}
            `
        );

        if (opts.focusForm && canReview) {
            setTimeout(() => {
                const comment = document.querySelector('#reviewForm textarea[name="comment"]');
                if (comment) comment.focus();
            }, 0);
        }
    }

    handleReviewForm(form) {
        if (!this.currentUser || this.currentUser.role !== 'customer') {
            this.showMessage('Login as customer to review.', 'error');
            return;
        }

        const fd = new FormData(form);
        const productId = Number(fd.get('productId'));
        const rating = Number(fd.get('rating'));
        const comment = String(fd.get('comment') || '').trim();

        if (!productId || !rating || !comment) {
            this.showMessage('Please provide rating and comment.', 'error');
            return;
        }

        if (!this.customerHasPurchasedProduct(this.currentUser.id, productId)) {
            this.showMessage('You can only review delivered purchases.', 'error');
            return;
        }

        this.reviews.push({
            id: Date.now(),
            productId,
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            rating: Math.min(5, Math.max(1, Math.round(rating))),
            comment,
            date: new Date().toISOString()
        });

        this.saveToStorage();
        this.closeModal();
        this.renderProducts();
        this.renderFeatured();
        this.renderFeedbackPage();
        this.showMessage('Thanks for your feedback!', 'success');
    }

    renderFeedbackPage() {
        const listEl = document.getElementById('feedbackList');
        const summaryEl = document.getElementById('feedbackSummary');
        const ordersEl = document.getElementById('myOrdersBlock');
        if (!listEl) return;

        const rows = this.reviews
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((r) => {
                const product = this.products.find((p) => p.id === r.productId);
                const productName = product ? product.name : `Product #${r.productId}`;
                return {
                    ...r,
                    productName
                };
            });

        if (summaryEl) {
            const total = rows.length;
            const avg = total ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;
            summaryEl.textContent = total ? `Total reviews: ${total} • Average rating: ${avg.toFixed(1)}/5` : 'No feedback yet.';
        }

        listEl.innerHTML = rows.length
            ? rows
                  .map(
                      (r) => `
                        <div class="feedback-card">
                            <div class="meta">
                                <span>${this.escapeHtml(r.productName)}</span>
                                <span>${new Date(r.date).toLocaleString()}</span>
                            </div>
                            <div class="title">${this.renderStars(r.rating)} <span style="color:var(--text-light);font-weight:600;">(${r.rating}/5)</span></div>
                            <div class="hint">by ${this.escapeHtml(r.userName)}</div>
                            <div style="margin-top:0.5rem;">${this.escapeHtml(r.comment)}</div>
                        </div>
                      `
                  )
                  .join('')
            : '<p class="text-center">No feedback yet.</p>';

        // Also show customer order history + status tracking + cancellation.
        if (ordersEl) {
            ordersEl.innerHTML =
                this.currentUser && this.currentUser.role === 'customer' ? this.renderCustomerOrdersBlock() : '';
        }
    }

    renderCustomerOrdersBlock() {
        const mine = this.orders
            .filter((o) => o.customerId === this.currentUser.id)
            .slice()
            .reverse();

        const rows = mine
            .map((o) => {
                const itemsSummary = o.items
                    .map((i) => {
                        const product = this.products.find((p) => p.id === i.productId);
                        const name = product ? product.name : `Product #${i.productId}`;
                        return `${this.escapeHtml(name)} × ${i.quantity}`;
                    })
                    .join(', ');

                const cancelBtn = o.status === 'pending'
                    ? `<button class="btn btn-danger" data-action="customer-cancel-order" data-order-id="${o.id}">Cancel</button>`
                    : '';

                return `
                    <tr>
                        <td>#${o.id}</td>
                        <td>${this.escapeHtml(itemsSummary)}</td>
                        <td>৳${this.formatNumber(o.total)}</td>
                        <td><span class="badge badge-${o.status}">${o.status}</span></td>
                        <td>${o.deliveryPersonName ? this.escapeHtml(o.deliveryPersonName) : '-'}</td>
                        <td>${cancelBtn}</td>
                    </tr>
                `;
            })
            .join('');

        return `
            <div class="mb-2">
                <h3>My Orders</h3>
                <div class="data-table">
                    <table>
                        <thead><tr><th>Order</th><th>Items</th><th>Total</th><th>Status</th><th>Delivery</th><th>Action</th></tr></thead>
                        <tbody>
                            ${rows || '<tr><td colspan="6">No orders yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
                <div class="hint mt-1">You can cancel only while status is Pending.</div>
            </div>
        `;
    }

    renderCustomerOrdersPage() {
        const content = document.getElementById('ordersContent');
        if (!content) return;

        if (!this.currentUser || this.currentUser.role !== 'customer') {
            content.innerHTML = '<p class="text-center">Please login as a customer to view your orders.</p>';
            return;
        }

        const mine = this.orders
            .filter((o) => o.customerId === this.currentUser.id)
            .slice()
            .reverse();

        const rows = mine
            .map((o) => {
                const itemsSummary = o.items
                    .map((i) => {
                        const product = this.products.find((p) => p.id === i.productId);
                        const name = product ? product.name : `Product #${i.productId}`;
                        return `${this.escapeHtml(name)} × ${i.quantity}`;
                    })
                    .join(', ');

                const cancelBtn = o.status === 'pending'
                    ? `<button class="btn btn-danger" data-action="customer-cancel-order" data-order-id="${o.id}">Cancel</button>`
                    : '';

                return `
                    <tr>
                        <td>#${o.id}</td>
                        <td>${new Date(o.date).toLocaleString()}</td>
                        <td>${this.escapeHtml(itemsSummary)}</td>
                        <td>৳${this.formatNumber(o.total)}</td>
                        <td><span class="badge badge-${o.status}">${o.status}</span></td>
                        <td>${o.deliveryPersonName ? this.escapeHtml(o.deliveryPersonName) : '-'}</td>
                        <td>${this.escapeHtml(o.paymentMethod || 'cod')}</td>
                        <td>${cancelBtn}</td>
                    </tr>
                `;
            })
            .join('');

        content.innerHTML = `
            <div class="page-header">
                <h2 class="section-title mb-0">My Orders</h2>
            </div>
            <div class="hint mb-1">Track your order status here. You can cancel only while status is Pending.</div>
            <div class="data-table">
                <table>
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Delivery</th>
                            <th>Payment</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || '<tr><td colspan="8">No orders yet.</td></tr>'}
                    </tbody>
                </table>
            </div>
        `;
    }

    // ---------- Modal ----------
    openModal(title, bodyHtml) {
        const modal = document.getElementById('appModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        if (!modal || !modalTitle || !modalBody) return;

        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }

    closeModal() {
        const modal = document.getElementById('appModal');
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        const modalBody = document.getElementById('modalBody');
        if (modalBody) modalBody.innerHTML = '';
    }

    // ---------- Helpers ----------
    formatNumber(n) {
        const num = Number(n);
        if (Number.isNaN(num)) return '0';
        return num.toLocaleString('en-US');
    }

    renderStars(value) {
        const rating = Math.max(0, Math.min(5, Number(value) || 0));
        const rounded = Math.round(rating);
        return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
    }

    escapeHtml(text) {
        return String(text)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    escapeAttr(text) {
        // Basic attribute escaping.
        return this.escapeHtml(text).replaceAll('`', '&#096;');
    }

    showMessage(message, type = 'info') {
        const div = document.createElement('div');
        const bg = type === 'success' ? '#2ecc71' : type === 'error' ? '#e74c3c' : '#3498db';
        div.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.25rem;
            background: ${bg};
            color: white;
            border-radius: 8px;
            z-index: 3000;
            max-width: 420px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.18);
            animation: slideIn 0.2s ease;
        `;
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 3000);
    }
}

// Init
window.app = new BakeryApp();

// Animation for toast messages
const toastStyle = document.createElement('style');
toastStyle.textContent = `
@keyframes slideIn {
  from { transform: translateX(12px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`;
document.head.appendChild(toastStyle);
