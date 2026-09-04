/**
 * INCYRA - Automated End-to-End Real Incident Data Flow Test
 * Tests the complete flow:
 * Ingestion -> Classification -> Conflict Detection -> State Mutation -> REST Retrieval
 */

const http = require('http');
const assert = require('assert');
const app = require('../backend/src/app');

let server;
let port = 5000;

function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      port = server.address().port;
      resolve();
    });
  });
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runEndToEndFlowTest() {
  await startServer();
  console.log(`\n======================================================`);
  console.log(`🧪 Running INCYRA Real Incident Flow Verification (Port: ${port})`);
  console.log(`======================================================\n`);

  // Step 1: Reset incident
  console.log('Step 1: Resetting incident state (POST /api/incident/reset)...');
  const resetRes = await request('POST', '/api/incident/reset');
  assert.strictEqual(resetRes.status, 200);
  assert.strictEqual(resetRes.data.success, true);
  console.log('   ✅ Incident reset to clean initial state');

  // Step 2: Ingest Fact (Payment API 502)
  console.log('\nStep 2: Ingesting live utterance: "Payment API is returning 502 errors."');
  const fact1Res = await request('POST', '/api/incident/transcript', {
    speaker: 'You (Incident Commander)',
    text: 'Payment API is returning 502 errors.',
  });
  assert.strictEqual(fact1Res.status, 200);
  assert.strictEqual(fact1Res.data.processedItem.classification.category, 'FACT');
  assert(typeof fact1Res.data.spokenResponse === 'string' && fact1Res.data.spokenResponse.length > 0, 'Must generate spoken response');
  assert.strictEqual(fact1Res.data.data.facts.length, 1);
  assert.strictEqual(fact1Res.data.data.timeline.length, 1);
  console.log('   ✅ Fact recorded, timeline event logged, AI verbal response generated:', fact1Res.data.spokenResponse);

  // Step 3: Ingest Action Item (Assign task to Bob)
  console.log('\nStep 3: Ingesting live utterance: "Bob, please investigate database read replica immediately."');
  const actionRes = await request('POST', '/api/incident/transcript', {
    speaker: 'You (Incident Commander)',
    text: 'Bob, please investigate database read replica immediately.',
  });
  assert.strictEqual(actionRes.status, 200);
  assert.strictEqual(actionRes.data.processedItem.classification.category, 'ACTION_ITEM');
  assert.strictEqual(actionRes.data.processedItem.classification.assignee, 'Bob');
  assert(['HIGH', 'URGENT', 'CRITICAL'].includes(actionRes.data.processedItem.classification.priority), 'Priority should be HIGH/URGENT');
  assert(typeof actionRes.data.spokenResponse === 'string', 'Must generate spoken response for action item');
  assert.strictEqual(actionRes.data.data.actions.length, 1);
  console.log('   ✅ Action item created with Assignee=Bob, Priority=HIGH. AI response:', actionRes.data.spokenResponse);

  // Step 4: Ingest Metric Fact (Alice: CPU is 95%)
  console.log('\nStep 4: Ingesting live utterance: "Database CPU is currently at 95%."');
  const cpu1Res = await request('POST', '/api/incident/transcript', {
    speaker: 'Alice (Lead)',
    text: 'Database CPU is currently at 95%.',
  });
  assert.strictEqual(cpu1Res.status, 200);
  assert.strictEqual(cpu1Res.data.data.facts.length, 2);
  console.log('   ✅ Metric fact recorded (Alice: 95% CPU)');

  // Step 5: Ingest Contradicting Metric Fact (Bob: CPU is 40%)
  console.log('\nStep 5: Ingesting conflicting utterance: "Database CPU is actually 40% on the primary node."');
  const cpu2Res = await request('POST', '/api/incident/transcript', {
    speaker: 'Bob (DBA)',
    text: 'Database CPU is actually 40% on the primary node.',
  });
  assert.strictEqual(cpu2Res.status, 200);
  assert.strictEqual(cpu2Res.data.processedItem.conflict !== null, true);
  assert.strictEqual(cpu2Res.data.data.conflicts.length, 1);
  assert(cpu2Res.data.data.conflicts[0].title.includes('CPU'));
  assert(typeof cpu2Res.data.spokenResponse === 'string' && cpu2Res.data.spokenResponse.includes('Alert'), 'Must generate discrepancy alert response');
  assert(cpu2Res.data.data.timeline.some((t) => t.type === 'conflict'));
  console.log('   ✅ Conflict detected, Conflict Panel item populated, AI alert response generated:', cpu2Res.data.spokenResponse);

  // Step 6: Verify full REST state schema matches React dashboard expectations
  console.log('\nStep 6: Querying complete incident state (GET /api/incident/state)...');
  const stateRes = await request('GET', '/api/incident/state');
  assert.strictEqual(stateRes.status, 200);
  const state = stateRes.data;

  // Validate Schema Integrity for React UI
  assert(state.incident && state.incident.id, 'Must contain incident object');
  assert(state.metrics && typeof state.metrics.openActions === 'number', 'Must contain metrics object');
  assert(Array.isArray(state.facts) && state.facts.length === 3, 'Must contain 3 facts');
  assert(Array.isArray(state.actions) && state.actions.length === 1, 'Must contain 1 action');
  assert(Array.isArray(state.conflicts) && state.conflicts.length === 1, 'Must contain 1 conflict');
  assert(Array.isArray(state.timeline) && state.timeline.length >= 4, 'Must contain timeline events');
  assert(state.briefing && typeof state.briefing.summary === 'string', 'Must contain briefing object');
  assert(state.aiObservation && typeof state.aiObservation.observation === 'string', 'Must contain aiObservation');
  assert(Array.isArray(state.participants) && state.participants.length >= 2, 'Must contain active participants');

  console.log('\n📊 Validated Live State Snapshot:');
  console.log('   - Incident ID:', state.incident.id);
  console.log('   - Status:', state.metrics.status);
  console.log('   - Confirmed Facts:', state.facts.length);
  console.log('   - Action Items:', state.actions.length);
  console.log('   - Active Conflicts:', state.conflicts.length);
  console.log('   - Logged Timeline Events:', state.timeline.length);
  console.log('   - Spoken Briefing:', state.briefing.summary);
  console.log('   - AI Observation:', state.aiObservation.observation);

  console.log('\n✅ Real End-to-End Incident Data Flow Successfully Verified!\n');
  server.close();
}

runEndToEndFlowTest().catch((err) => {
  console.error('\n❌ End-to-End Flow Test Failed:', err);
  if (server) server.close();
  process.exit(1);
});
