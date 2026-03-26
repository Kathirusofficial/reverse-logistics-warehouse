const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// DB Connection
connectDB();

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/returns', require('./routes/returnRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/chart', require('./routes/chartRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));

// Root
app.get('/', (req, res) => res.send('Warehouse System V2 Pro API Active'));

// Global Error
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend server running on http://127.0.0.1:${PORT}`));