require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { startWeatherPoller } = require('./cron/weatherPoller');

// Route imports
const workerRoutes = require('./routes/worker');
const policyRoutes = require('./routes/policy');
const claimRoutes = require('./routes/claim');
const weatherRoutes = require('./routes/weather');
const adminRoutes = require('./routes/admin');
const platformRoutes = require('./routes/platform');

const app = express();

// Security & parsing
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Routes
app.use('/api/worker', workerRoutes);
app.use('/api/policy', policyRoutes);
app.use('/api/claim', claimRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/platform', platformRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 GigShield API running on http://localhost:${PORT}`);
    startWeatherPoller();
  });
};

start();

module.exports = app;
