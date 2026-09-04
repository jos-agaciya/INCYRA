/**
 * INCYRA - Room Routes
 * Manages incident room CRUD, membership, sharing, and room-scoped incident intelligence.
 */

const express = require('express');
const roomController = require('../controllers/roomController');
const incidentController = require('../controllers/incidentController');
const { authenticateToken, optionalAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// Room Management
router.post('/', authenticateToken, roomController.createRoom);
router.get('/', authenticateToken, roomController.listRooms);
router.get('/:roomId', optionalAuth, roomController.getRoom);
router.post('/:roomId/join', authenticateToken, roomController.joinRoom);
router.get('/:roomId/members', roomController.getRoomMembers);
router.get('/:roomId/share', roomController.getShareInfo);

// Room-Scoped Incident Intelligence
router.get('/:roomId/state', incidentController.getIncidentState);
router.post('/:roomId/transcript', optionalAuth, incidentController.handleTranscript);
router.post('/:roomId/reset', incidentController.resetIncidentState);

// Room-Scoped Action Items
router.get('/:roomId/actions', incidentController.getActionItems);
router.post('/:roomId/actions', optionalAuth, incidentController.createActionItem);
router.patch('/:roomId/actions/:id', incidentController.updateActionItem);
router.delete('/:roomId/actions/:id', incidentController.deleteActionItem);

// Room-Scoped Decisions
router.get('/:roomId/decisions', incidentController.getDecisions);
router.post('/:roomId/decisions', optionalAuth, incidentController.createDecision);
router.patch('/:roomId/decisions/:id', incidentController.updateDecision);
router.delete('/:roomId/decisions/:id', incidentController.deleteDecision);

module.exports = router;
