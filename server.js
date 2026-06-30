const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'greenet',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// MENU API
app.get('/api/menu', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.post('/api/menu', async (req, res) => {
  const { id, name, category, price, prep_time, description, image_url } = req.body;
  try {
    await pool.query(
      'INSERT INTO menu_items (id, name, category, price, prep_time, description, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, price, prep_time, description, image_url]
    );
    res.status(201).json({ message: 'Menu item created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create menu item' });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

// ORDERS API
app.get('/api/orders', async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    for (let order of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;
    }
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { id, table_number, status, total, ai_summary, items } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      'INSERT INTO orders (id, table_number, status, total, ai_summary) VALUES (?, ?, ?, ?, ?)',
      [id, table_number, status, total, ai_summary]
    );
    for (let item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, name, price, quantity, image_url) VALUES (?, ?, ?, ?, ?)',
        [id, item.name, item.price, item.quantity, item.image_url]
      );
    }
    await connection.commit();
    res.status(201).json({ message: 'Order created' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    connection.release();
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Fallback for SPA or unknown routes to serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
