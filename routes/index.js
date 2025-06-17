const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const orderRoutes = require('./orders');
const agentRoutes = require('./agents');
const dashboardRoutes = require('./dashboard');

router.use('/', authRoutes);
router.use('/orders', orderRoutes);
router.use('/agents', agentRoutes);
router.use('/dashboard', dashboardRoutes);