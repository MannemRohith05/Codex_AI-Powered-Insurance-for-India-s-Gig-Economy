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
const demoRoutes = require('./routes/demo');   // Section D
const mlRoutes   = require('./routes/ml');     // Section F

const app = express();

// CORS setup using standard express 4 cors package
app.use(cors({
  origin: [
    'https://gig-shield-ten.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));


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
app.use('/api/demo', demoRoutes);   // Section D — demo trigger
app.use('/api/ml', mlRoutes);       // Section F — ml predict stub

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: `Route ${req.method} ${req.path} not found` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 10000;

const start = async () => {
  await connectDB();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GigShield API running on port ${PORT}`);
    startWeatherPoller();
  });
};

start();

module.exports = app;
