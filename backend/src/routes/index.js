const express = require('express');
const healthRoutes = require('./healthRoutes');
const incidentRoutes = require('./incidentRoutes');

const router = express.Router();

// Mount sub-routers
router.use('/health', healthRoutes);
router.use('/incident', incidentRoutes);

module.exports = router;
