// routes/agents.js
const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { validateAgent } = require('../middleware/validators');

router.get('/', isAuthenticated, agentController.listAgents);
router.post('/', isAdmin, validateAgent, agentController.createAgent);
router.get('/:id', isAuthenticated, agentController.getAgent);
router.put('/:id', isAdmin, validateAgent, agentController.updateAgent);
router.delete('/:id', isAdmin, agentController.deleteAgent);

module.exports = router;