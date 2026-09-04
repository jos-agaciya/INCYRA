const express = require('express');
const healthRoutes = require('./healthRoutes');
const incidentRoutes = require('./incidentRoutes');
const agoraRoutes = require('./agoraRoutes');

const router = express.Router();

// Mount sub-routers
router.use('/health', healthRoutes);
router.use('/incident', incidentRoutes);
router.use('/agora', agoraRoutes);

module.exports = router;
