/**
 * INCYRA - Dynamic Incident Context & State Isolation Test Suite
 *
 * Verifies:
 * TEST 1: Clean incident + "The database server is not responding."
 *         -> Verify INCYRA does NOT mention payment gateway, 502 errors, CPU spike, or gateway instances.
 * TEST 2: User says: "Our mobile app crashes after login."
 *         -> Verify INCYRA responds using mobile app/login crash context only.
 * TEST 3: Create an actual payment gateway incident.
 *         -> Verify INCYRA CAN correctly discuss payment gateway issues when users actually mention them.
 * TEST 4: Start two separate incident sessions/rooms with different issues.
 *         -> Verify facts from Incident A never appear in Incident B.
 * TEST 5: Audit production source files for forbidden hardcoded incident defaults.
 *         -> Verify no old demo scenario is automatically loaded into production incident state.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const IncidentState = require('../ai-engine/models/incidentState');
const TranscriptProcessor = require('../ai-engine/processors/transcriptProcessor');
const { AIIncidentEngine } = require('../ai-engine');

async function runDynamicContextTests() {
  console.log('================================================================');
  console.log('🧪 Running INCYRA Dynamic Incident Context & State Isolation Tests');
  console.log('================================================================\n');

  // -------------------------------------------------------------------
  // TEST 1: Clean Incident + Database Server Failure
  // -------------------------------------------------------------------
  console.log('1️⃣ Testing Dynamic Context: Database Failure (Clean State)...');
  const dbState = new IncidentState('INC-DB-001');
  
  // Verify initial state is genuinely empty
  assert.strictEqual(dbState.title, 'Active Incident', 'New state title must be generic');
  assert.strictEqual(dbState.service, 'Under Investigation', 'New state service must be Under Investigation');
  assert.strictEqual(dbState.facts.length, 0, 'New state facts must be empty');
  assert.strictEqual(dbState.hypotheses.length, 0, 'New state hypotheses must be empty');
  assert.strictEqual(dbState.actionItems.length, 0, 'New state actions must be empty');
  assert.strictEqual(dbState.decisions.length, 0, 'New state decisions must be empty');
  assert.strictEqual(dbState.timeline.length, 0, 'New state timeline must be empty');

  const dbProcessor = new TranscriptProcessor(dbState);
  const dbRes = await dbProcessor.process({
    speaker: 'DevOps Lead',
    text: 'The database server is not responding.',
  });

  const dbSpoken = dbRes.spokenResponse.toLowerCase();
  console.log('   Spoken AI Response:', `"${dbRes.spokenResponse}"`);

  // Verify response addresses the database
  assert(dbSpoken.includes('database') || dbSpoken.includes('server'), 'Response must address database or server');
  assert(dbSpoken.includes('not responding') || dbSpoken.includes('unreachable') || dbSpoken.includes('logged'), 'Response must recognize unresponsiveness');

  // CRITICAL: Must NOT mention old demo scenarios
  assert(!dbSpoken.includes('payment gateway'), 'Response must NOT mention payment gateway');
  assert(!dbSpoken.includes('502'), 'Response must NOT mention 502');
  assert(!dbSpoken.includes('cpu spike') && !dbSpoken.includes('cpu saturation'), 'Response must NOT mention CPU spike/saturation');
  assert(!dbSpoken.includes('gateway instances'), 'Response must NOT mention gateway instances');

  console.log('   ✅ Test 1 Passed: Database failure handled with zero payment gateway/502/CPU assumptions.\n');

  // -------------------------------------------------------------------
  // TEST 2: Clean Incident + Mobile App Login Crash
  // -------------------------------------------------------------------
  console.log('2️⃣ Testing Dynamic Context: Mobile App Crash After Login...');
  const mobileState = new IncidentState('INC-MOB-002');
  const mobileProcessor = new TranscriptProcessor(mobileState);

  const mobileRes = await mobileProcessor.process({
    speaker: 'Mobile QA Lead',
    text: 'Our mobile app crashes after login.',
  });

  const mobileSpoken = mobileRes.spokenResponse.toLowerCase();
  console.log('   Spoken AI Response:', `"${mobileRes.spokenResponse}"`);

  // Verify response addresses the mobile app and crash
  assert(mobileSpoken.includes('mobile app') || mobileSpoken.includes('app crash') || mobileSpoken.includes('login'), 'Response must address mobile app/login crash');
  
  // CRITICAL: Must NOT mention unrelated demo scenarios
  assert(!mobileSpoken.includes('payment gateway'), 'Response must NOT mention payment gateway');
  assert(!mobileSpoken.includes('502'), 'Response must NOT mention 502');
  assert(!mobileSpoken.includes('cpu spike'), 'Response must NOT mention CPU spike');
  assert(!mobileSpoken.includes('gateway instances'), 'Response must NOT mention gateway instances');

  console.log('   ✅ Test 2 Passed: Mobile app crash handled using login crash context only.\n');

  // -------------------------------------------------------------------
  // TEST 3: User Explicitly Mentions Payment Gateway
  // -------------------------------------------------------------------
  console.log('3️⃣ Testing Legitimate Payment Gateway Incident Context...');
  const payState = new IncidentState('INC-PAY-003');
  const payProcessor = new TranscriptProcessor(payState);

  const payRes = await payProcessor.process({
    speaker: 'Billing Engineer',
    text: 'We are getting 502 errors from the payment gateway.',
  });

  const paySpoken = payRes.spokenResponse.toLowerCase();
  console.log('   Spoken AI Response:', `"${payRes.spokenResponse}"`);

  // In this case, payment gateway was explicitly stated by user
  assert(paySpoken.includes('payment') || paySpoken.includes('gateway') || paySpoken.includes('502'), 'Response should mention payment gateway when user mentions it');
  console.log('   ✅ Test 3 Passed: Payment gateway context handled accurately when user actually mentions it.\n');

  // -------------------------------------------------------------------
  // TEST 4: Multi-Room / Session Isolation
  // -------------------------------------------------------------------
  console.log('4️⃣ Testing State Isolation Between Multiple Incident Rooms/Sessions...');
  const engineRoomA = new AIIncidentEngine('ROOM-ALPHA');
  const engineRoomB = new AIIncidentEngine('ROOM-BETA');

  // Room A discusses database failure
  await engineRoomA.processTranscript({
    speaker: 'Alice',
    text: 'Primary database cluster is unreachable.',
  });
  await engineRoomA.processTranscript({
    speaker: 'Alice',
    text: 'Bob, check postgres connections.',
  });

  // Room B discusses mobile crash
  await engineRoomB.processTranscript({
    speaker: 'Carol',
    text: 'iOS mobile build 2.4 is crashing on launch.',
  });

  const stateA = engineRoomA.getIncidentState();
  const stateB = engineRoomB.getIncidentState();

  // Verify facts in Room A
  assert.strictEqual(stateA.facts.length, 1);
  assert(stateA.facts[0].text.includes('database cluster is unreachable'));
  assert.strictEqual(stateA.actions.length, 1);

  // Verify facts in Room B
  assert.strictEqual(stateB.facts.length, 1);
  assert(stateB.facts[0].text.includes('iOS mobile build 2.4 is crashing'));
  assert.strictEqual(stateB.actions.length, 0);

  // Cross-contamination checks
  assert(!JSON.stringify(stateA).includes('iOS mobile build'), 'Room A must NOT contain Room B data');
  assert(!JSON.stringify(stateB).includes('database cluster'), 'Room B must NOT contain Room A data');

  console.log('   ✅ Test 4 Passed: Zero cross-contamination between Room Alpha and Room Beta.\n');

  // -------------------------------------------------------------------
  // TEST 5: Production Source Files Audit for Forbidden Hardcoded Defaults
  // -------------------------------------------------------------------
  console.log('5️⃣ Auditing Production Source Files for Forbidden Hardcoded Defaults...');
  
  // 5A: Check IncidentState model defaults
  const freshState = new IncidentState('INC-AUDIT');
  assert.strictEqual(freshState.title, 'Active Incident');
  assert.strictEqual(freshState.service, 'Under Investigation');
  assert.strictEqual(freshState.facts.length, 0);
  assert.strictEqual(freshState.hypotheses.length, 0);
  assert.strictEqual(freshState.decisions.length, 0);
  assert.strictEqual(freshState.actionItems.length, 0);
  assert.strictEqual(freshState.conflicts.length, 0);
  assert.strictEqual(freshState.timeline.length, 0);

  // 5B: Check frontend initial demoData state
  const demoDataPath = path.join(__dirname, '../frontend/src/data/demoData.js');
  const demoDataContent = fs.readFileSync(demoDataPath, 'utf8');
  assert(!demoDataContent.includes('Payment Gateway Outage'), 'demoData.js must not preload "Payment Gateway Outage"');
  assert(demoDataContent.includes('title: "Active Incident"') || demoDataContent.includes("title: 'Active Incident'"), 'demoData.js must default to Active Incident');

  // 5C: Check Header.jsx fallback title
  const headerPath = path.join(__dirname, '../frontend/src/components/Header.jsx');
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  assert(!headerContent.includes('Payment Gateway Outage'), 'Header.jsx must not have Payment Gateway Outage fallback');

  // 5D: Check incidentState.js constructor
  const statePath = path.join(__dirname, '../ai-engine/models/incidentState.js');
  const stateContent = fs.readFileSync(statePath, 'utf8');
  assert(!stateContent.includes("this.title = 'Payment Gateway Outage'"), 'incidentState.js must not hardcode Payment Gateway Outage');

  console.log('   ✅ Test 5 Passed: All production files verified free of hardcoded scenario defaults.\n');

  console.log('================================================================');
  console.log('🎉 ALL DYNAMIC INCIDENT CONTEXT & ISOLATION TESTS PASSED!');
  console.log('================================================================\n');
}

runDynamicContextTests().catch((err) => {
  console.error('❌ Dynamic Context Test Suite Failed:', err);
  process.exit(1);
});
