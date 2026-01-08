const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');

const app = express();

// Middlewares globaux
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API Express opérationnelle' });
});

app.use('/auth', authRoutes);

// Middleware NOT FOUND
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

// Middleware GLOBAL d'erreur
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    details: err.details || null,
  });
});

module.exports = app;
