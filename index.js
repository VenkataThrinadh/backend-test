const express = require('express');
const cors = require('cors');
const app = express();
const mysql = require('mysql2');
const PORT = process.env.PORT;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const helmet = require('helmet');
const morgan = require('morgan');

// Secret key for JWT (use env var in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(morgan('dev'));
app.use(helmet());


const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});



app.use(cors({
  origin: "https://crmtesting.work.gd"
}));
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Test route
app.get('/', (req, res) => {
  res.send('CRM Backend Running 🚀');
});

// Register endpoint
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  // Hash password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    const sql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
    
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Error creating user' });
      }
      res.json({ message: 'User registered successfully ✅', userId: result.insertId });
    });
  });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  
  db.query(sql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Error comparing password' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ 
        message: 'Login successful ✅', 
        token, 
        user: { id: user.id, name: user.name, email: user.email } 
      });
    });
  });
});

// Add customer (requires authentication)
app.post('/add-customer', verifyToken, (req, res) => {
  const { name, email } = req.body;

  const sql = 'INSERT INTO customers (name, email) VALUES (?, ?)';
  
  db.query(sql, [name, email], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Customer added successfully ✅');
  });
});

// Get all customers (requires authentication)
app.get('/customers', verifyToken, (req, res) => {
  const sql = 'SELECT * FROM customers';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

// Delete customer (requires authentication)
app.delete('/delete-customer/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM customers WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Customer deleted ✅');
  });
});

// Update customer (requires authentication)
app.put('/update-customer/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  const sql = 'UPDATE customers SET name = ?, email = ? WHERE id = ?';

  db.query(sql, [name, email, id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Customer updated ✅');
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
