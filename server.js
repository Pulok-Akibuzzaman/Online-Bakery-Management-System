const fs = require('fs');
const path = require('path');
const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'bakery.sqlite');
const schemaPath = path.join(__dirname, 'db', 'schema.sql');
const seedPath = path.join(__dirname, 'db', 'seed.sql');

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const schemaSql = fs.readFileSync(schemaPath, 'utf8');
db.exec(schemaSql);

const seedSql = fs.readFileSync(seedPath, 'utf8');
db.exec(seedSql);

function getState() {
    const users = db
        .prepare('SELECT id, username, password, email, role, name FROM users ORDER BY id')
        .all();

    const products = db
        .prepare('SELECT id, name, description, price, image, category, stock FROM products ORDER BY id')
        .all();

    const ingredients = db
        .prepare('SELECT id, name, stock, low_threshold FROM ingredients ORDER BY id')
        .all()
        .map((row) => ({
            id: Number(row.id),
            name: String(row.name || ''),
            stock: Number(row.stock || 0),
            lowThreshold: Number(row.low_threshold || 0)
        }));

    const recipeRows = db
        .prepare('SELECT product_id, ingredient_id, amount_per_unit FROM recipes ORDER BY product_id, ingredient_id')
        .all();

    const recipes = {};
    for (const row of recipeRows) {
        const productKey = String(row.product_id);
        if (!recipes[productKey]) {
            recipes[productKey] = {};
        }
        recipes[productKey][String(row.ingredient_id)] = Number(row.amount_per_unit || 0);
    }

    const orderRows = db
        .prepare(
            `
            SELECT
                id,
                customer_id,
                customer_name,
                total,
                status,
                payment_method,
                address,
                phone,
                date,
                delivery_person_id,
                delivery_person_name,
                confirmed_at,
                delivered_at
            FROM orders
            ORDER BY id
            `
        )
        .all();

    const orderItemsRows = db
        .prepare('SELECT order_id, product_id, quantity, price_at_order FROM order_items ORDER BY order_id, product_id')
        .all();

    const itemsByOrderId = new Map();
    for (const row of orderItemsRows) {
        if (!itemsByOrderId.has(row.order_id)) {
            itemsByOrderId.set(row.order_id, []);
        }
        itemsByOrderId.get(row.order_id).push({
            productId: Number(row.product_id),
            quantity: Number(row.quantity),
            priceAtOrder: Number(row.price_at_order)
        });
    }

    const orders = orderRows.map((row) => ({
        id: Number(row.id),
        customerId: Number(row.customer_id),
        customerName: String(row.customer_name || ''),
        items: itemsByOrderId.get(row.id) || [],
        total: Number(row.total || 0),
        status: String(row.status || 'pending'),
        paymentMethod: row.payment_method === null ? null : String(row.payment_method),
        address: row.address === null ? '' : String(row.address),
        phone: row.phone === null ? '' : String(row.phone),
        date: String(row.date || new Date().toISOString()),
        deliveryPersonId: row.delivery_person_id === null ? null : Number(row.delivery_person_id),
        deliveryPersonName: row.delivery_person_name === null ? null : String(row.delivery_person_name),
        confirmedAt: row.confirmed_at === null ? null : String(row.confirmed_at),
        deliveredAt: row.delivered_at === null ? null : String(row.delivered_at)
    }));

    const cart = db
        .prepare('SELECT product_id, quantity FROM cart_items ORDER BY product_id')
        .all()
        .map((row) => ({
            productId: Number(row.product_id),
            quantity: Number(row.quantity)
        }));

    const reviews = db
        .prepare('SELECT id, product_id, user_id, user_name, rating, comment, date FROM reviews ORDER BY date DESC, id DESC')
        .all()
        .map((row) => ({
            id: Number(row.id),
            productId: Number(row.product_id),
            userId: Number(row.user_id),
            userName: String(row.user_name || ''),
            rating: Number(row.rating || 0),
            comment: String(row.comment || ''),
            date: String(row.date || new Date().toISOString())
        }));

    const currentUserIdRow = db
        .prepare("SELECT value_text FROM app_meta WHERE key = 'current_user_id'")
        .get();

    const currentUserId = currentUserIdRow && currentUserIdRow.value_text !== null
        ? Number(currentUserIdRow.value_text)
        : null;

    const currentUser = currentUserId
        ? users.find((u) => u.id === currentUserId) || null
        : null;

    return {
        currentUser,
        products,
        users,
        orders,
        cart,
        reviews,
        ingredients,
        recipes
    };
}

function putState(state) {
    const tx = db.transaction(() => {
        const users = Array.isArray(state.users) ? state.users : [];
        const products = Array.isArray(state.products) ? state.products : [];
        const orders = Array.isArray(state.orders) ? state.orders : [];
        const cart = Array.isArray(state.cart) ? state.cart : [];
        const reviews = Array.isArray(state.reviews) ? state.reviews : [];
        const ingredients = Array.isArray(state.ingredients) ? state.ingredients : [];
        const recipes = state.recipes && typeof state.recipes === 'object' ? state.recipes : {};

        db.prepare('DELETE FROM order_items').run();
        db.prepare('DELETE FROM orders').run();
        db.prepare('DELETE FROM reviews').run();
        db.prepare('DELETE FROM cart_items').run();
        db.prepare('DELETE FROM recipes').run();
        db.prepare('DELETE FROM ingredients').run();
        db.prepare('DELETE FROM products').run();
        db.prepare('DELETE FROM users').run();

        const insertUser = db.prepare(
            'INSERT INTO users (id, username, password, email, role, name) VALUES (?, ?, ?, ?, ?, ?)'
        );
        for (const u of users) {
            insertUser.run(
                Number(u.id),
                String(u.username || ''),
                String(u.password || ''),
                String(u.email || ''),
                String(u.role || 'customer'),
                String(u.name || '')
            );
        }

        const insertProduct = db.prepare(
            'INSERT INTO products (id, name, description, price, image, category, stock) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        for (const p of products) {
            insertProduct.run(
                Number(p.id),
                String(p.name || ''),
                String(p.description || ''),
                Number(p.price || 0),
                String(p.image || ''),
                String(p.category || ''),
                Math.max(0, Math.round(Number(p.stock || 0)))
            );
        }

        const insertIngredient = db.prepare(
            'INSERT INTO ingredients (id, name, stock, low_threshold) VALUES (?, ?, ?, ?)'
        );
        for (const i of ingredients) {
            insertIngredient.run(
                Number(i.id),
                String(i.name || ''),
                Math.max(0, Number(i.stock || 0)),
                Math.max(0, Number(i.lowThreshold || 0))
            );
        }

        const insertRecipe = db.prepare(
            'INSERT INTO recipes (product_id, ingredient_id, amount_per_unit) VALUES (?, ?, ?)'
        );
        for (const [productIdRaw, recipe] of Object.entries(recipes)) {
            const productId = Number(productIdRaw);
            if (!recipe || typeof recipe !== 'object' || Number.isNaN(productId)) continue;
            for (const [ingredientIdRaw, amountPerUnitRaw] of Object.entries(recipe)) {
                const ingredientId = Number(ingredientIdRaw);
                const amountPerUnit = Number(amountPerUnitRaw);
                if (Number.isNaN(ingredientId) || Number.isNaN(amountPerUnit)) continue;
                insertRecipe.run(productId, ingredientId, Math.max(0, amountPerUnit));
            }
        }

        const insertOrder = db.prepare(
            `
            INSERT INTO orders (
                id,
                customer_id,
                customer_name,
                total,
                status,
                payment_method,
                address,
                phone,
                date,
                delivery_person_id,
                delivery_person_name,
                confirmed_at,
                delivered_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
        );
        const insertOrderItem = db.prepare(
            'INSERT INTO order_items (order_id, product_id, quantity, price_at_order) VALUES (?, ?, ?, ?)'
        );

        for (const o of orders) {
            const orderId = Number(o.id);
            const status = String(o.status || 'pending');
            insertOrder.run(
                orderId,
                Number(o.customerId),
                String(o.customerName || ''),
                Math.max(0, Number(o.total || 0)),
                status,
                o.paymentMethod === null || o.paymentMethod === undefined ? null : String(o.paymentMethod),
                String(o.address || ''),
                String(o.phone || ''),
                String(o.date || new Date().toISOString()),
                o.deliveryPersonId === null || o.deliveryPersonId === undefined ? null : Number(o.deliveryPersonId),
                o.deliveryPersonName === null || o.deliveryPersonName === undefined ? null : String(o.deliveryPersonName),
                o.confirmedAt === null || o.confirmedAt === undefined ? null : String(o.confirmedAt),
                o.deliveredAt === null || o.deliveredAt === undefined ? null : String(o.deliveredAt)
            );

            const items = Array.isArray(o.items) ? o.items : [];
            for (const item of items) {
                insertOrderItem.run(
                    orderId,
                    Number(item.productId),
                    Math.max(1, Math.round(Number(item.quantity || 1))),
                    Math.max(0, Number(item.priceAtOrder || 0))
                );
            }
        }

        const insertCartItem = db.prepare('INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)');
        for (const c of cart) {
            insertCartItem.run(
                Number(c.productId),
                Math.max(1, Math.round(Number(c.quantity || 1)))
            );
        }

        const insertReview = db.prepare(
            'INSERT INTO reviews (id, product_id, user_id, user_name, rating, comment, date) VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        for (const r of reviews) {
            insertReview.run(
                Number(r.id),
                Number(r.productId),
                Number(r.userId),
                String(r.userName || ''),
                Math.min(5, Math.max(1, Math.round(Number(r.rating || 1)))),
                String(r.comment || ''),
                String(r.date || new Date().toISOString())
            );
        }

        const currentUserId = state.currentUser && state.currentUser.id
            ? String(Number(state.currentUser.id))
            : null;

        db.prepare(
            `
            INSERT INTO app_meta (key, value_text)
            VALUES ('current_user_id', ?)
            ON CONFLICT(key) DO UPDATE SET
                value_text = excluded.value_text
            `
        ).run(currentUserId);
    });

    tx();
}

app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

app.get('/api/health', (req, res) => {
    res.json({ ok: true, database: dbPath });
});

app.get('/api/state', (req, res) => {
    res.json(getState());
});

app.put('/api/state', (req, res) => {
    const state = req.body;
    if (!state || typeof state !== 'object' || !Array.isArray(state.users) || !Array.isArray(state.products)) {
        return res.status(400).json({ error: 'Invalid state payload' });
    }

    try {
        putState(state);
        return res.json({ ok: true });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to save state', details: String(err.message || err) });
    }
});

app.listen(PORT, () => {
    console.log(`Bakery server running on http://localhost:${PORT}`);
    console.log(`SQLite database: ${dbPath}`);
});
