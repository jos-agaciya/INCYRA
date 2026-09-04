const express = require('express');
const {
  handleTranscript,
  getIncidentState,
  getActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
  getDecisions,
  createDecision,
  updateDecision,
  deleteDecision,
  resetIncidentState,
} = require('../controllers/incidentController');

const router = express.Router();

// Transcript & State
router.post('/transcript', handleTranscript);
router.get('/state', getIncidentState);
router.post('/reset', resetIncidentState);

// Action Items CRUD
router.get('/actions', getActionItems);
router.post('/actions', createActionItem);
router.patch('/actions/:id', updateActionItem);
router.delete('/actions/:id', deleteActionItem);

// Decisions CRUD
router.get('/decisions', getDecisions);
router.post('/decisions', createDecision);
router.patch('/decisions/:id', updateDecision);
router.delete('/decisions/:id', deleteDecision);

module.exports = router;
