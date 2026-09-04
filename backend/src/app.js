const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Mount API routes at /api
app.use('/api', apiRoutes);

// Root greeting route
app.get('/', (req, res) => {
  res.json({
    name: 'INCYRA API',
    description: 'Real-Time AI Voice Incident Commander',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      transcriptIngestion: 'POST /api/incident/transcript',
      incidentState: 'GET /api/incident/state',
      incidentReset: 'POST /api/incident/reset',
    },
  });
});

// 404 Handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
