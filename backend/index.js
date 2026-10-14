/**
 * Product Safety, Expiry & Counterfeit Detection API Server
 * 
 * Express backend that integrates with global barcode databases (Open Food Facts,
 * Open Beauty Facts), computes GS1 checksum validation, detects tampered packaging
 * and date stamps, flags hazardous food additives, and checks allergens.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const productRoutes = require('./Routes/fakeProduct.routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable Cross-Origin Resource Sharing for frontend communication
app.use(cors());

// Parse JSON request bodies up to 20MB (to comfortably support camera snapshot uploads)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Request logger for debugging & inspection visibility
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// Root API Health & Diagnostic check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Fake Product & Expiry Detection Engine',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Fake Product & Expiry Detection Backend is running.');
});

// Mount Product Authenticity and Tamper Detection Routes
app.use('/api/fake_products', productRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred',
    error: err.message
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Product Safety & Fake Detection Server Started!`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/fake_products/scan`);
  console.log(` Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});