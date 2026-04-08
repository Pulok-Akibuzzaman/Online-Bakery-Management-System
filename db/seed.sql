INSERT OR IGNORE INTO users (id, username, password, email, role, name) VALUES
	(1, 'admin', 'admin123', 'admin@bakery.com', 'admin', 'Admin User'),
	(2, 'employee1', 'emp123', 'employee@bakery.com', 'employee', 'John Employee'),
	(3, 'delivery1', 'del123', 'delivery@bakery.com', 'delivery', 'Mike Delivery'),
	(1001, 'customer1', 'cust123', 'customer1@bakery.com', 'customer', 'Ayesha Rahman'),
	(1002, 'customer2', 'cust123', 'customer2@bakery.com', 'customer', 'Tanvir Hasan'),
	(1003, 'customer3', 'cust123', 'customer3@bakery.com', 'customer', 'Nafisa Akter');

INSERT OR IGNORE INTO products (id, name, description, price, image, category, stock) VALUES
	(1, 'Chocolate Croissant', 'Buttery croissant filled with rich chocolate', 250, 'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=600', 'Pastries', 20),
	(2, 'Red Velvet Cake', 'Classic red velvet cake with cream cheese frosting', 1200, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600', 'Cakes', 5),
	(3, 'Blueberry Muffin', 'Fresh blueberry muffin with a golden top', 180, 'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=600', 'Muffins', 15),
	(4, 'Artisan Bread', 'Freshly baked artisan sourdough bread', 320, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600', 'Breads', 8),
	(5, 'Strawberry Tart', 'Delicate pastry tart topped with fresh strawberries', 450, 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600', 'Tarts', 12),
	(6, 'Cinnamon Roll', 'Warm cinnamon roll with sweet glaze', 200, 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600', 'Pastries', 18),
	(7, 'Classic Cheesecake', 'Creamy cheesecake with a buttery biscuit base', 950, 'https://images.unsplash.com/photo-1547414368-ac947d00b91d?w=600', 'Cakes', 6),
	(8, 'Chocolate Chip Cookies', 'Crispy edges, chewy center, loaded with chocolate chips', 120, 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600', 'Cookies', 40),
	(9, 'Eclair', 'Choux pastry filled with cream and topped with chocolate', 230, 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=600', 'Pastries', 14),
	(10, 'Fudge Brownie', 'Rich chocolate brownie with a fudgy bite', 220, 'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=600', 'Brownies', 22),
	(11, 'Vanilla Cupcake', 'Soft vanilla cupcake with silky frosting', 150, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600', 'Cupcakes', 24),
	(12, 'Chocolate Cupcake', 'Chocolate cupcake with creamy chocolate frosting', 170, 'https://images.unsplash.com/photo-1519869325930-281384150729?w=600', 'Cupcakes', 20),
	(13, 'Banana Bread', 'Moist banana bread with a hint of cinnamon', 380, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600', 'Breads', 10),
	(14, 'Butter Croissant', 'Classic flaky croissant with buttery layers', 210, 'https://images.pexels.com/photos/3892469/pexels-photo-3892469.jpeg?auto=compress&cs=tinysrgb&w=600', 'Pastries', 26);

INSERT OR IGNORE INTO ingredients (id, name, stock, low_threshold) VALUES
	(101, 'Flour (g)', 50000, 5000),
	(102, 'Sugar (g)', 20000, 2000),
	(103, 'Butter (g)', 8000, 1000),
	(104, 'Chocolate (g)', 6000, 800),
	(105, 'Egg (pcs)', 200, 30),
	(106, 'Milk (ml)', 15000, 2000),
	(107, 'Cream Cheese (g)', 4000, 600),
	(108, 'Strawberry (g)', 5000, 700),
	(109, 'Yeast (g)', 1000, 150);

INSERT OR IGNORE INTO recipes (product_id, ingredient_id, amount_per_unit) VALUES
	(1, 101, 120), (1, 103, 30), (1, 104, 25), (1, 105, 1), (1, 109, 2),
	(2, 101, 400), (2, 102, 250), (2, 103, 150), (2, 105, 4), (2, 106, 200), (2, 107, 120),
	(3, 101, 140), (3, 102, 60), (3, 103, 40), (3, 105, 1), (3, 106, 80),
	(4, 101, 300), (4, 106, 120), (4, 109, 5),
	(5, 101, 160), (5, 102, 90), (5, 103, 60), (5, 105, 1), (5, 108, 80),
	(6, 101, 180), (6, 102, 70), (6, 103, 50), (6, 105, 1), (6, 109, 3);

INSERT OR IGNORE INTO reviews (id, product_id, user_id, user_name, rating, comment, date) VALUES
	(5001, 1, 1001, 'Ayesha Rahman', 5, 'Perfectly flaky and the chocolate filling is amazing.', '2026-04-02T10:15:00.000Z'),
	(5002, 2, 1002, 'Tanvir Hasan', 4, 'Very soft and delicious cake. A bit too sweet for me.', '2026-04-03T14:30:00.000Z'),
	(5003, 8, 1003, 'Nafisa Akter', 5, 'Best cookies in town. Crispy edges and chewy center.', '2026-04-04T17:45:00.000Z'),
	(5004, 10, 1001, 'Ayesha Rahman', 4, 'Great brownie texture, rich chocolate taste.', '2026-04-05T09:20:00.000Z'),
	(5005, 5, 1002, 'Tanvir Hasan', 5, 'Fresh strawberries and perfect tart shell.', '2026-04-06T12:05:00.000Z'),
	(5006, 14, 1003, 'Nafisa Akter', 4, 'Nice buttery flavor and crispy layers.', '2026-04-07T16:10:00.000Z');

INSERT OR IGNORE INTO app_meta (key, value_text) VALUES
	('current_user_id', NULL);
