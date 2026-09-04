/**
 * INCYRA - Room Controller
 * Manages incident room creation, membership, sharing links, and room metadata.
 */

const RoomModel = require('../db/models/roomModel');
const IncidentDataModel = require('../db/models/incidentDataModel');

function formatRoom(r) {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    description: r.description || '',
    severity: r.severity || 'SEV-1',
    status: r.status || 'Investigating',
    service: r.service || 'Under Investigation',
    ownerId: r.owner_id || r.ownerId,
    ownerName: r.owner_name || r.ownerName,
    ownerEmail: r.owner_email || r.ownerEmail,
    code: r.room_code || r.code,
    roomCode: r.room_code || r.roomCode || r.code,
    agoraChannel: r.agora_channel || r.agoraChannel,
    memberCount: r.member_count !== undefined ? r.member_count : (r.memberCount || 1),
    createdAt: r.created_at || r.createdAt,
    updatedAt: r.updated_at || r.updatedAt,
    // snake_case compatibility
    room_code: r.room_code || r.code,
    agora_channel: r.agora_channel || r.agoraChannel,
    owner_id: r.owner_id || r.ownerId,
    created_at: r.created_at || r.createdAt,
    updated_at: r.updated_at || r.updatedAt,
  };
}

/**
 * Create a new incident room
 * POST /api/rooms
 */
async function createRoom(req, res) {
  try {
    const { title, description, severity, service } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Incident room title is required.',
      });
    }

    const userId = req.user ? req.user.id : `u_${Date.now()}`;

    const rawRoom = RoomModel.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      severity: severity || 'SEV-1',
      service: service || 'Under Investigation',
      ownerId: userId,
    });

    const room = formatRoom(rawRoom);

    return res.status(201).json({
      success: true,
      message: 'Incident room created successfully.',
      room,
      roomId: room.id,
      roomCode: room.roomCode,
      code: room.code,
      agoraChannel: room.agoraChannel,
    });
  } catch (err) {
    console.error('[ROOMS] Create room error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create incident room.',
    });
  }
}

/**
 * List rooms for the authenticated user
 * GET /api/rooms
 */
async function listRooms(req, res) {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to list rooms.',
      });
    }

    const rawRooms = RoomModel.listUserRooms(userId);
    const rooms = rawRooms.map(formatRoom);
    return res.status(200).json({
      success: true,
      rooms,
      count: rooms.length,
    });
  } catch (err) {
    console.error('[ROOMS] List rooms error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve incident rooms.',
    });
  }
}

/**
 * Get room details by ID or code
 * GET /api/rooms/:roomId
 */
async function getRoom(req, res) {
  try {
    const { roomId } = req.params;
    const rawRoom = RoomModel.findByCodeOrId(roomId);

    if (!rawRoom) {
      return res.status(404).json({
        success: false,
        error: `Incident room "${roomId}" not found.`,
      });
    }

    const room = formatRoom(rawRoom);

    return res.status(200).json({
      success: true,
      room,
    });
  } catch (err) {
    console.error('[ROOMS] Get room error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve room details.',
    });
  }
}

/**
 * Join an incident room
 * POST /api/rooms/:roomId/join
 */
async function joinRoom(req, res) {
  try {
    const { roomId } = req.params;
    const rawRoom = RoomModel.findByCodeOrId(roomId);

    if (!rawRoom) {
      return res.status(404).json({
        success: false,
        error: `Incident room "${roomId}" not found.`,
      });
    }

    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to join room.',
      });
    }

    const isOwner = rawRoom.owner_id === userId;
    const role = isOwner ? 'OWNER' : 'MEMBER';

    const member = RoomModel.addMember({
      roomId: rawRoom.id,
      userId,
      role,
    });

    const room = formatRoom(rawRoom);

    return res.status(200).json({
      success: true,
      message: `Joined room "${room.title}".`,
      room,
      member,
      agoraChannel: room.agoraChannel,
    });
  } catch (err) {
    console.error('[ROOMS] Join room error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to join incident room.',
    });
  }
}

/**
 * Get members for a room
 * GET /api/rooms/:roomId/members
 */
async function getRoomMembers(req, res) {
  try {
    const { roomId } = req.params;
    const rawRoom = RoomModel.findByCodeOrId(roomId);

    if (!rawRoom) {
      return res.status(404).json({
        success: false,
        error: `Incident room "${roomId}" not found.`,
      });
    }

    const members = RoomModel.getRoomMembers(rawRoom.id);

    return res.status(200).json({
      success: true,
      roomId: rawRoom.id,
      members,
      count: members.length,
    });
  } catch (err) {
    console.error('[ROOMS] Get members error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve room members.',
    });
  }
}

/**
 * Get shareable link and access details
 * GET /api/rooms/:roomId/share
 */
async function getShareInfo(req, res) {
  try {
    const { roomId } = req.params;
    const rawRoom = RoomModel.findByCodeOrId(roomId);

    if (!rawRoom) {
      return res.status(404).json({
        success: false,
        error: `Incident room "${roomId}" not found.`,
      });
    }

    const room = formatRoom(rawRoom);

    return res.status(200).json({
      success: true,
      roomId: room.id,
      code: room.code,
      roomCode: room.roomCode,
      title: room.title,
      severity: room.severity,
      agoraChannel: room.agoraChannel,
      shareUrl: `/room/${room.id}`,
      createdAt: room.createdAt,
    });
  } catch (err) {
    console.error('[ROOMS] Get share info error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve share information.',
    });
  }
}

module.exports = {
  createRoom,
  listRooms,
  getRoom,
  joinRoom,
  getRoomMembers,
  getShareInfo,
};

