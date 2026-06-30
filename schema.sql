CREATE DATABASE IF NOT EXISTS greenet;
USE greenet;

CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  prep_time INT DEFAULT 15,
  description TEXT,
  image_url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  table_number INT NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ai_summary TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  image_url VARCHAR(500),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Insert sample data
INSERT IGNORE INTO menu_items (id, name, category, price, prep_time, description, image_url) VALUES 
('m1', 'Butter Chicken', 'Main Course', 14.99, 20, 'Tender chicken in a rich, creamy tomato-based sauce with aromatic spices. Served with basmati rice.', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=80'),
('m2', 'Spaghetti Carbonara', 'Pasta', 13.50, 18, 'Classic Italian pasta with guanciale, eggs, Pecorino Romano cheese and black pepper.', 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&auto=format&fit=crop&q=80'),
('m3', 'Margherita Pizza', 'Main Course', 12.99, 15, 'San Marzano tomatoes, fresh mozzarella, and basil on a wood-fired crust.', 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop&q=80'),
('m4', 'Tiramisu', 'Desserts', 7.50, 5, 'Layers of espresso-soaked ladyfingers and mascarpone cream, dusted with cocoa.', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&auto=format&fit=crop&q=80'),
('m5', 'Mango Lassi', 'Drinks', 4.99, 3, 'Chilled yogurt-based drink blended with ripe Alphonso mangoes and a touch of cardamom.', 'https://images.unsplash.com/photo-1574294000082-0c8d5c15e2e3?w=400&auto=format&fit=crop&q=80'),
('m6', 'Garlic Bread', 'Snacks', 5.99, 8, 'Toasted ciabatta rubbed with roasted garlic butter and fresh herbs.', 'https://images.unsplash.com/photo-1619531040576-f9416740661e?w=400&auto=format&fit=crop&q=80');
