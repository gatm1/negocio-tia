const express = require('express');
const path = require('path');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 3000;

// Configuración de PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Obtener productos
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY category, name');
    console.log('Productos obtenidos:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en GET /api/products:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Agregar producto
app.post('/api/products', async (req, res) => {
  const { name, description, price, category } = req.body;
  console.log('Datos recibidos en POST /api/products:', req.body);
  try {
    if (!name || !price || !category) {
      throw new Error('Faltan campos requeridos: name, price y category son obligatorios');
    }
    const result = await pool.query(
      'INSERT INTO products (name, description, price, category) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, category]
    );
    console.log('Producto insertado:', result.rows[0]);
    if (!result.rows[0]) {
      throw new Error('No se recibió el producto insertado en la respuesta');
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error en POST /api/products:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Eliminar producto
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    console.log('Producto eliminado, filas afectadas:', result.rowCount);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error en DELETE /api/products:', err.message);
    res.status(500).send('Error en el servidor: ' + err.message);
  }
});

// Servir index.html en la ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
