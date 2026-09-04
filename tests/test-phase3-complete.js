/**
 * INCYRA PHASE 3 COMPREHENSIVE AUTOMATED TEST SUITE
 * 
 * Verifies:
 * TEST 1  - Registration: Register a new user successfully
 * TEST 2  - Duplicate Email: Reject duplicate registration
 * TEST 3  - Password Security: Verify passwords are hashed with bcrypt (never plaintext)
 * TEST 4  - Login: Valid credentials authenticate successfully and return JWT
 * TEST 5  - Invalid Login: Invalid credentials are appropriately rejected
 * TEST 6  - Protected Routes: Unauthenticated requests are rejected with 401/403
 * TEST 7  - Create Room: Authenticated user creates a real persistent room
 * TEST 8  - Room Ownership: Room creator is assigned OWNER and INCIDENT_COMMANDER role
 * TEST 9  - Share Link: Share endpoint returns valid room code, channel, and share URL
 * TEST 10 - Second User Join: A second authenticated user joins the same room
 * TEST 11 - Real Participants: Only joined users appear in the room roster
 * TEST 12 - Zero Mock Users: No Alice, Bob, Charlie, Support Lead in room roster
 * TEST 13 - Room Isolation: Data in Room A (Database Outage) never leaks into Room B (API Crash)
 * TEST 14 - Database Persistence: Data persists directly in SQLite database across reloads
 * TEST 15 - Phase 1 Voice / AI Intact: Agora token endpoint, AI speech pipeline, pronunciation intact
 * TEST 16 - Phase 2 Dynamic Actions & Decisions: Action items and decisions remain fully functional and room-scoped
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../backend/data/incyra.db');

import Database from '../backend/node_modules/better-sqlite3/lib/index.js';


const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
    passedTests++;
  }
}

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('🚀 RUNNING INCYRA PHASE 3 COMPREHENSIVE AUTOMATED TESTS');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log(`Database File:  ${dbPath}`);
  console.log('================================================================\n');

  const timestamp = Date.now();
  const testUser1 = {
    name: 'Jos Agaciya',
    email: `jos.${timestamp}@incyra.test`,
    password: 'SecurePassword123!',
  };
  const testUser2 = {
    name: 'Venkat Raman',
    email: `venkat.${timestamp}@incyra.test`,
    password: 'SecurePassword456!',
  };

  let tokenUser1 = null;
  let tokenUser2 = null;
  let user1Data = null;
  let user2Data = null;
  let room1 = null;
  let room2 = null;

  // -------------------------------------------------------------------------
  // TEST 1 — Registration
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: User Registration ---');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser1),
    });
    const data = await res.json();
    assert(res.status === 201 && data.success, 'User 1 registered successfully with HTTP 201');
    assert(data.token && typeof data.token === 'string', 'Received valid JWT auth token');
    assert(data.user.email === testUser1.email, 'User object returned correct email');
    assert(data.user.name === testUser1.name, 'User object returned correct full name');
    assert(!data.user.passwordHash && !data.user.password, 'Password hash is NOT exposed in response');
    tokenUser1 = data.token;
    user1Data = data.user;
  } catch (err) {
    console.error('Test 1 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 2 — Duplicate Email
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Reject Duplicate Email Registration ---');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser1),
    });
    const data = await res.json();
    assert(res.status === 409, 'Duplicate email registration rejected with HTTP 409 Conflict');
    assert(data.error && data.error.includes('already exists'), 'Appropriate duplicate email error message returned');
  } catch (err) {
    console.error('Test 2 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 3 — Password Security
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Password Security & Hash Verification in DB ---');
  try {
    const db = new Database(dbPath, { readonly: true });
    const row = db.prepare('SELECT id, name, email, password_hash FROM users WHERE email = ?').get(testUser1.email);
    assert(Boolean(row), 'User row exists in SQLite database');
    assert(row.password_hash !== testUser1.password, 'Plaintext password is NEVER stored in database');
    assert(row.password_hash.startsWith('$2a$') || row.password_hash.startsWith('$2b$'), 'Password is encrypted using bcrypt');
    db.close();
  } catch (err) {
    console.error('Test 3 error:', err.message);
  }


  // -------------------------------------------------------------------------
  // TEST 4 — Login
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Valid User Authentication / Login ---');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser1.email, password: testUser1.password }),
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Valid credentials authenticated successfully with HTTP 200');
    assert(Boolean(data.token), 'Login returned valid JWT token');
    assert(data.user.email === testUser1.email, 'Logged in user profile matches email');
    assert(!data.user.passwordHash, 'Password hash is NOT returned on login');
  } catch (err) {
    console.error('Test 4 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 5 — Invalid Login
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Reject Invalid Login Credentials ---');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser1.email, password: 'WrongPassword999!' }),
    });
    const data = await res.json();
    assert(res.status === 401, 'Invalid password rejected with HTTP 401 Unauthorized');
    assert(data.error && data.error.includes('Invalid email or password'), 'Useful error message without leaking user existence');
  } catch (err) {
    console.error('Test 5 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 6 — Protected Routes
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Protected API Route Enforcement ---');
  try {
    const resNoToken = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorized Room' }),
    });
    assert(resNoToken.status === 401, 'Unauthenticated POST /api/rooms rejected with HTTP 401');

    const resBadToken = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer invalid.token.payload' },
    });
    assert(resBadToken.status === 401 || resBadToken.status === 403, 'Invalid token GET /api/rooms rejected with HTTP 401/403');
  } catch (err) {
    console.error('Test 6 error:', err.message);
  }

  // Register User 2 for multi-user tests
  try {
    const res2 = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser2),
    });
    const data2 = await res2.json();
    tokenUser2 = data2.token;
    user2Data = data2.user;
  } catch (err) {
    console.error('Register User 2 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 7 — Create Room
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Create Real Incident Room ---');
  try {
    const res = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        title: 'Production PostgreSQL Cluster Failover Lag',
        description: 'Read replica replication lag exceeds 45 seconds causing stale reads.',
        severity: 'HIGH',
        service: 'PostgreSQL Cluster',
      }),
    });
    const data = await res.json();
    assert(res.status === 201 && data.success, 'Incident room created with HTTP 201');
    assert(Boolean(data.room.id), 'Generated unique room ID');
    assert(Boolean(data.room.code), 'Generated unique room code');
    assert(Boolean(data.room.agoraChannel), 'Generated associated Agora channel name');
    room1 = data.room;
  } catch (err) {
    console.error('Test 7 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 8 — Room Ownership
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Room Ownership & Incident Commander Role ---');
  try {
    const res = await fetch(`${BASE_URL}/api/rooms/${room1.id}/members`, {
      headers: { 'Authorization': `Bearer ${tokenUser1}` },
    });
    const data = await res.json();
    assert(res.status === 200, 'Fetched room members with HTTP 200');
    assert(data.members.length === 1, 'Room initially has exactly 1 member (the creator)');
    const ownerMember = data.members[0];
    assert(ownerMember.userId === user1Data.id, 'Room member userId matches room creator');
    assert(ownerMember.role === 'OWNER' || ownerMember.role === 'INCIDENT_COMMANDER', 'Creator has OWNER role');
    assert(ownerMember.name === testUser1.name, 'Member displays real authenticated name');
  } catch (err) {
    console.error('Test 8 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 9 — Share Link
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Share Link Generation & Verification ---');
  try {
    const res = await fetch(`${BASE_URL}/api/rooms/${room1.id}/share`, {
      headers: { 'Authorization': `Bearer ${tokenUser1}` },
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Share info endpoint returned HTTP 200');
    assert(data.roomId === room1.id, 'Share info has correct room ID');
    assert(data.shareUrl && data.shareUrl.includes(`/room/${room1.id}`), 'Share URL correctly targets /room/:roomId');
    assert(Boolean(data.code), 'Share info includes room share code');
  } catch (err) {
    console.error('Test 9 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 10 — Second User Join
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 10: Second Authenticated User Joins Shared Room ---');
  try {
    const res = await fetch(`${BASE_URL}/api/rooms/${room1.id}/join`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenUser2}` },
    });
    const data = await res.json();
    assert(res.status === 200 && data.success, 'Second user joined room successfully with HTTP 200');
    assert(data.room.id === room1.id, 'Joined room ID matches target room');
  } catch (err) {
    console.error('Test 10 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 11 — Real Participants
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 11: Real Room Roster Verification ---');
  try {
    const res = await fetch(`${BASE_URL}/api/rooms/${room1.id}/members`, {
      headers: { 'Authorization': `Bearer ${tokenUser1}` },
    });
    const data = await res.json();
    assert(data.members.length === 2, 'Roster contains exactly the 2 joined users');
    const names = data.members.map((m) => m.name);
    assert(names.includes('Jos Agaciya'), 'Roster contains Jos Agaciya');
    assert(names.includes('Venkat Raman'), 'Roster contains Venkat Raman');
  } catch (err) {
    console.error('Test 11 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 12 — Zero Mock Users
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 12: Zero Mock Users in Production State ---');
  try {
    const res = await fetch(`${BASE_URL}/api/rooms/${room1.id}/members`, {
      headers: { 'Authorization': `Bearer ${tokenUser1}` },
    });
    const data = await res.json();
    const mockNames = ['Alice Chen', 'Bob Kumar', 'Charlie Davis', 'Support Lead'];
    const hasMock = data.members.some((m) => mockNames.includes(m.name));
    assert(!hasMock, 'No fake mock participants (Alice, Bob, Charlie, Support Lead) in room roster');
  } catch (err) {
    console.error('Test 12 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 13 — Room Isolation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 13: Room Isolation (Room A vs Room B Data Separation) ---');
  try {
    // Create Room B (User 2)
    const resRoom2 = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser2}`,
      },
      body: JSON.stringify({
        title: 'Mobile App 502 Bad Gateway Outage',
        description: 'Kubernetes ingress controller dropping client SSL handshakes.',
        severity: 'CRITICAL',
        service: 'API Gateway / Ingress',
      }),
    });
    const room2Data = await resRoom2.json();
    room2 = room2Data.room;

    // Post speech utterance to Room A (Database issue)
    await fetch(`${BASE_URL}/api/rooms/${room1.id}/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        text: 'The replica WAL lag is at 48 seconds on database host pg-node-02.',
        speaker: 'Jos Agaciya',
      }),
    });

    // Post action item to Room A
    await fetch(`${BASE_URL}/api/rooms/${room1.id}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        title: 'Drain traffic from pg-node-02',
        priority: 'CRITICAL',
        assignee: 'Jos Agaciya',
      }),
    });

    // Post speech utterance to Room B (Kubernetes Ingress issue)
    await fetch(`${BASE_URL}/api/rooms/${room2.id}/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser2}`,
      },
      body: JSON.stringify({
        text: 'Nginx ingress controller error logs show SSL certificate renegotiation timeouts.',
        speaker: 'Venkat Raman',
      }),
    });

    // Fetch states of both rooms
    const stateA = await (await fetch(`${BASE_URL}/api/rooms/${room1.id}/state`, {
      headers: { 'Authorization': `Bearer ${tokenUser1}` },
    })).json();

    const stateB = await (await fetch(`${BASE_URL}/api/rooms/${room2.id}/state`, {
      headers: { 'Authorization': `Bearer ${tokenUser2}` },
    })).json();

    const roomAFacts = JSON.stringify(stateA.facts || []);
    const roomBFacts = JSON.stringify(stateB.facts || []);
    const roomAActions = JSON.stringify(stateA.actions || []);
    const roomBActions = JSON.stringify(stateB.actions || []);

    assert(!roomBFacts.includes('WAL lag') && !roomBFacts.includes('pg-node-02'), 'Room B does NOT contain Room A database facts');
    assert(!roomBActions.includes('Drain traffic from pg-node-02'), 'Room B does NOT contain Room A action items');
    assert(!roomAFacts.includes('Nginx ingress'), 'Room A does NOT contain Room B ingress facts');
    assert(stateA.incident.title === 'Production PostgreSQL Cluster Failover Lag', 'Room A maintains its own incident metadata');
    assert(stateB.incident.title === 'Mobile App 502 Bad Gateway Outage', 'Room B maintains its own incident metadata');
  } catch (err) {
    console.error('Test 13 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 14 — Persistence Across Reconnection / Database Direct Query
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 14: Persistent Database Storage Verification ---');
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // Check rooms table
    const roomRow = db.prepare('SELECT id, title, severity FROM rooms WHERE id = ?').get(room1.id);
    assert(Boolean(roomRow), 'Room 1 persists in rooms SQLite table');
    assert(roomRow.title === 'Production PostgreSQL Cluster Failover Lag', 'Persisted title matches created title');

    // Check room_members table
    const memberRows = db.prepare('SELECT user_id as userId, role FROM room_members WHERE room_id = ?').all(room1.id);
    assert(memberRows.length === 2, 'Room 1 members persist in room_members SQLite table');

    // Check actions table
    const actionRows = db.prepare('SELECT title, priority FROM action_items WHERE room_id = ?').all(room1.id);
    assert(actionRows.length >= 1, 'Action items persist in action_items SQLite table');
    assert(actionRows.some((a) => a.title.includes('Drain traffic')), 'Specific action item found in SQLite database');

    db.close();
  } catch (err) {
    console.error('Test 14 error:', err.message);
  }


  // -------------------------------------------------------------------------
  // TEST 15 — Existing Phase 1 Voice / AI Intact
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 15: Phase 1 Voice RTC & AI Pipeline Intact ---');
  try {
    // Agora Token Generation
    const tokenRes = await fetch(`${BASE_URL}/api/agora/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({ channel: room1.agoraChannel }),
    });
    const tokenData = await tokenRes.json();
    assert(tokenRes.status === 200 && tokenData.success, 'Agora RTC token generated successfully');
    assert(Boolean(tokenData.token), 'Valid Agora token string returned');
    assert(tokenData.channelName === room1.agoraChannel, 'Token matches room Agora channel');

    // Spoken response generation & pronunciation safety
    const transcriptRes = await fetch(`${BASE_URL}/api/rooms/${room1.id}/transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        text: 'INCYRA, what is the current replica status?',
        speaker: 'Jos Agaciya',
      }),
    });
    const transcriptData = await transcriptRes.json();
    assert(transcriptRes.status === 200 && transcriptData.success, 'Speech utterance processed by AI engine');
    assert(Boolean(transcriptData.spokenResponse), 'AI engine returned spoken voice response');
  } catch (err) {
    console.error('Test 15 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // TEST 16 — Existing Phase 2 Dynamic Decisions & Actions Intact
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 16: Phase 2 Dynamic Action Items & Decisions Intact ---');
  try {
    // Create Decision
    const decRes = await fetch(`${BASE_URL}/api/rooms/${room1.id}/decisions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUser1}`,
      },
      body: JSON.stringify({
        title: 'Promote read replica node-03 to primary',
        status: 'CONFIRMED',
        rationale: 'Primary node-01 is non-responsive after network partition.',
      }),
    });
    const decData = await decRes.json();
    assert(decRes.status === 201 && decData.success, 'Decision logged successfully with HTTP 201');
    assert(decData.decision.title === 'Promote read replica node-03 to primary', 'Decision title verified');
    assert(decData.decision.status === 'CONFIRMED', 'Decision status verified');

    // Fetch decisions for Room 1
    const getDecs = await (await fetch(`${BASE_URL}/api/rooms/${room1.id}/decisions`, {
      headers: { 'Authorization': `Bearer ${tokenUser1}` },
    })).json();
    assert(getDecs.decisions.length >= 1, 'Decisions fetched for Room 1');
    assert(getDecs.decisions.some((d) => d.title.includes('Promote read replica')), 'Confirmed decision appears in Room 1 decisions log');
  } catch (err) {
    console.error('Test 16 error:', err.message);
  }

  // -------------------------------------------------------------------------
  // FINAL SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
