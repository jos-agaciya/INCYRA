const express = require('express');
const healthRoutes = require('./healthRoutes');
const incidentRoutes = require('./incidentRoutes');
const agoraRoutes = require('./agoraRoutes');
const authRoutes = require('./authRoutes');
const roomRoutes = require('./roomRoutes');

const router = express.Router();

// Mount sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/rooms', roomRoutes);
router.use('/incident', incidentRoutes);
router.use('/agora', agoraRoutes);

module.exports = router;
