const express = require('express');
const cors = require('cors');
const app = express();
const mysql = require('mysql2');
const PORT = process.env.PORT;

const helmet = require('helmet');
const morgan = require('morgan');

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

// Test route
app.get('/', (req, res) => {
  res.send('CRM Backend Running 🚀 github pipline working');
});



app.post('/add-customer', (req, res) => {
  const { name, email } = req.body;

  const sql = 'INSERT INTO customers (name, email) VALUES (?, ?)';
  
  db.query(sql, [name, email], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Customer added successfully ✅');
  });
});


app.get('/customers', (req, res) => {
  const sql = 'SELECT * FROM customers';

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
});


app.delete('/delete-customer/:id', (req, res) => {
  const { id } = req.params;

  const sql = 'DELETE FROM customers WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send('Customer deleted ✅');
  });
});


app.put('/update-customer/:id', (req, res) => {
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
