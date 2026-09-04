/**
 * INCYRA Phase 2 Automated Test Suite
 * Real Incident Intelligence + Dynamic Actions & Decisions Verification
 *
 * Validates:
 * 1. Action extraction from speech
 * 2. Unassigned action when mentioned person is not a real participant
 * 3. Action assignment to a real participant
 * 4. Action status updates & transitions
 * 5. Decision proposal detection
 * 6. Decision confirmation
 * 7. Decision rejection & reversals
 * 8. Timeline events for actions
 * 9. Timeline events for decisions
 * 10. Dashboard counts updating dynamically
 * 11. Zero production mock participants audit
 * 12. Existing Phase 1 voice functionality intact
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// AI Engine imports
const IncidentState = require('../ai-engine/models/incidentState');
const StatementClassifier = require('../ai-engine/processors/classifier');
const TranscriptProcessor = require('../ai-engine/processors/transcriptProcessor');
const ResponseGenerator = require('../ai-engine/processors/responseGenerator');

async function runPhase2Tests() {
  console.log('================================================================');
  console.log('🚀 Running INCYRA Phase 2 Real Intelligence & Decisions Tests');
  console.log('================================================================\n');

  const classifier = new StatementClassifier();

  // -------------------------------------------------------------------
  // TEST 1: Action Extraction from Speech
  // -------------------------------------------------------------------
  console.log('1️⃣ Testing Action Extraction from Speech...');
  const actText1 = "Charlie, check the payment gateway logs.";
  const class1 = classifier.classify(actText1);
  assert.strictEqual(class1.category, 'ACTION_ITEM', 'Should classify as ACTION_ITEM');
  assert.strictEqual(class1.assignee, 'Charlie', 'Target mentioned person should be Charlie');
  assert(class1.title.toLowerCase().includes('payment gateway logs'), 'Title must reflect action');

  const actText2 = "I'll check the CPU metrics.";
  const class2 = classifier.classify(actText2, 'You (Incident Commander)');
  assert.strictEqual(class2.category, 'ACTION_ITEM', 'Self-assignment should classify as ACTION_ITEM');

  const actText3 = "Can someone verify the Redis connection?";
  const class3 = classifier.classify(actText3);
  assert.strictEqual(class3.category, 'ACTION_ITEM', 'Open request should classify as ACTION_ITEM');
  assert(['MEDIUM', 'HIGH'].includes(class3.priority), 'Redis verification should have valid priority');
  console.log('   ✅ Test 1 Passed: Action items accurately extracted from multiple conversational speech patterns.\n');

  // -------------------------------------------------------------------
  // TEST 2: Unassigned Action When Mentioned Person is NOT a Real Participant
  // -------------------------------------------------------------------
  console.log('2️⃣ Testing Unassigned Action Handling (No Mock Users)...');
  const state1 = new IncidentState('INC-TEST-1');
  const processor1 = new TranscriptProcessor(state1);

  // Active room only has "You (Incident Commander)"
  const res1 = await processor1.process({
    speaker: 'You (Incident Commander)',
    text: 'Charlie, check the payment gateway logs.',
  });

  const actions1 = state1.getActionItems();
  assert.strictEqual(actions1.length, 1, 'One action item must be created');
  const action1 = actions1[0];
  assert.strictEqual(action1.assignee, null, 'Assignee must be null when Charlie is not in the room');
  assert.strictEqual(action1.assignmentStatus, 'UNASSIGNED', 'Status must be UNASSIGNED');
  assert(
    res1.spokenResponse.includes('Charlie') && res1.spokenResponse.includes('assignment'),
    'AI spoken response must explicitly state Charlie is not in the room and task needs assignment'
  );
  console.log('   ✅ Test 2 Passed: Mentioning unknown person marks task as UNASSIGNED with explanatory AI guidance.\n');

  // -------------------------------------------------------------------
  // TEST 3: Action Assignment to a Real Participant
  // -------------------------------------------------------------------
  console.log('3️⃣ Testing Action Assignment to a Real Connected Participant...');
  const state2 = new IncidentState('INC-TEST-2');
  // Add a real connected participant
  state2.recordParticipant('Jos', 'Database Lead');
  const processor2 = new TranscriptProcessor(state2);

  const res2 = await processor2.process({
    speaker: 'You (Incident Commander)',
    text: 'Jos, check the database connection.',
  });

  const actions2 = state2.getActionItems();
  assert.strictEqual(actions2.length, 1);
  const action2 = actions2[0];
  assert.strictEqual(action2.assignee, 'Jos', 'Assignee must match real participant Jos');
  assert.strictEqual(action2.assignmentStatus, 'ASSIGNED');
  assert(
    res2.spokenResponse.toLowerCase().includes('assigned to jos'),
    'AI response should confirm assignment to Jos'
  );
  console.log('   ✅ Test 3 Passed: Real participant matched and assigned properly.\n');

  // -------------------------------------------------------------------
  // TEST 4: Action Status Updates & Transitions
  // -------------------------------------------------------------------
  console.log('4️⃣ Testing Action Status Updates (OPEN -> IN_PROGRESS -> COMPLETED)...');
  const state3 = new IncidentState('INC-TEST-3');
  const item3 = state3.addActionItem({
    title: 'Investigate Redis cache latency',
    priority: 'HIGH',
    assignee: 'Jos',
  });
  assert.strictEqual(item3.status, 'OPEN');

  const updated3_1 = state3.updateActionItem(item3.id, { status: 'IN_PROGRESS' });
  assert.strictEqual(updated3_1.status, 'IN_PROGRESS');

  const updated3_2 = state3.updateActionItem(item3.id, { status: 'COMPLETED' });
  assert.strictEqual(updated3_2.status, 'COMPLETED');
  console.log('   ✅ Test 4 Passed: Action item status transitions work cleanly.\n');

  // -------------------------------------------------------------------
  // TEST 5: Decision Proposal Detection
  // -------------------------------------------------------------------
  console.log('5️⃣ Testing Decision Proposal Detection...');
  const state4 = new IncidentState('INC-TEST-4');
  const processor4 = new TranscriptProcessor(state4);

  const propRes = await processor4.process({
    speaker: 'You (Incident Commander)',
    text: "Let's scale the gateway instances.",
  });

  assert.strictEqual(state4.decisions.length, 1);
  const dec1 = state4.decisions[0];
  assert.strictEqual(dec1.status, 'PROPOSED', 'Proposal statement should have PROPOSED status');
  assert(
    propRes.spokenResponse.toLowerCase().includes('confirm') ||
    propRes.spokenResponse.toLowerCase().includes('proposed'),
    'AI should prompt for human confirmation of proposed decision'
  );
  console.log('   ✅ Test 5 Passed: Decision proposal detected with PROPOSED status and AI confirmation prompt.\n');

  // -------------------------------------------------------------------
  // TEST 6: Decision Confirmation
  // -------------------------------------------------------------------
  console.log('6️⃣ Testing Decision Confirmation Flow...');
  const confirmRes = await processor4.process({
    speaker: 'You (Incident Commander)',
    text: "Yes, confirm it.",
  });

  assert.strictEqual(dec1.status, 'CONFIRMED', 'Decision status should transition to CONFIRMED');
  assert(
    confirmRes.spokenResponse.toLowerCase().includes('decision confirmed'),
    'AI should acknowledge confirmed decision'
  );
  console.log('   ✅ Test 6 Passed: Decision confirmation transitions state to CONFIRMED.\n');

  // -------------------------------------------------------------------
  // TEST 7: Decision Rejection
  // -------------------------------------------------------------------
  console.log('7️⃣ Testing Decision Rejection Detection...');
  const state5 = new IncidentState('INC-TEST-5');
  const processor5 = new TranscriptProcessor(state5);

  const rejRes = await processor5.process({
    speaker: 'You (Incident Commander)',
    text: 'We decided not to restart the database.',
  });

  assert.strictEqual(state5.decisions.length, 1);
  const dec2 = state5.decisions[0];
  assert.strictEqual(dec2.status, 'REJECTED');
  assert(
    rejRes.spokenResponse.toLowerCase().includes('rejected') ||
    rejRes.spokenResponse.toLowerCase().includes('logged'),
    'AI should log the negative decision'
  );
  console.log('   ✅ Test 7 Passed: Negative decision detected as REJECTED.\n');

  // -------------------------------------------------------------------
  // TEST 8: Timeline Events for Actions
  // -------------------------------------------------------------------
  console.log('8️⃣ Testing Timeline Events for Action Item Lifecycle...');
  const state6 = new IncidentState('INC-TEST-6');
  const act6 = state6.addActionItem({
    title: 'Check database node replication lag',
    priority: 'HIGH',
    assignee: null,
  });

  const createEvents = state6.timeline.filter((t) => t.type === 'action' && t.title.includes('Action Created'));
  assert.strictEqual(createEvents.length, 1, 'Timeline must record Action Created event');

  state6.updateActionItem(act6.id, { assignee: 'You (Incident Commander)', assignmentStatus: 'ASSIGNED' });
  const assignEvents = state6.timeline.filter((t) => t.type === 'action' && t.title.includes('Action Assigned'));
  assert.strictEqual(assignEvents.length, 1, 'Timeline must record Action Assigned event');

  state6.updateActionItem(act6.id, { status: 'COMPLETED' });
  const completeEvents = state6.timeline.filter((t) => t.type === 'action' && t.title.includes('Action Completed'));
  assert.strictEqual(completeEvents.length, 1, 'Timeline must record Action Completed event');
  console.log('   ✅ Test 8 Passed: Action creation, assignment, and completion generate verified timeline events.\n');

  // -------------------------------------------------------------------
  // TEST 9: Timeline Events for Decisions
  // -------------------------------------------------------------------
  console.log('9️⃣ Testing Timeline Events for Decisions...');
  const state7 = new IncidentState('INC-TEST-7');
  const dec7 = state7.addDecision({
    title: 'Scale payment gateway to 8 instances',
    status: 'PROPOSED',
    decidedBy: 'Incident Commander',
  });

  const propEvents = state7.timeline.filter((t) => t.type === 'decision' && t.title.includes('Decision Proposed'));
  assert.strictEqual(propEvents.length, 1);

  state7.updateDecision(dec7.id, { status: 'CONFIRMED' });
  const confEvents = state7.timeline.filter((t) => t.type === 'decision' && t.title.includes('Decision Confirmed'));
  assert.strictEqual(confEvents.length, 1);
  console.log('   ✅ Test 9 Passed: Decision proposal and confirmation create verified timeline events.\n');

  // -------------------------------------------------------------------
  // TEST 10: Dynamic Dashboard Counts
  // -------------------------------------------------------------------
  console.log('🔟 Testing Dynamic Dashboard Counts Calculations...');
  const state8 = new IncidentState('INC-TEST-8');
  assert.strictEqual(state8.metrics.openActions, 0);
  assert.strictEqual(state8.metrics.confirmedDecisions, 0);

  state8.addActionItem({ title: 'Task 1', status: 'OPEN' });
  state8.addActionItem({ title: 'Task 2', status: 'IN_PROGRESS' });
  state8.addActionItem({ title: 'Task 3', status: 'COMPLETED' });
  state8.addDecision({ title: 'Decision 1', status: 'CONFIRMED' });
  state8.addDecision({ title: 'Decision 2', status: 'PROPOSED' });

  assert.strictEqual(state8.metrics.openActions, 2, '2 open/in-progress actions');
  assert.strictEqual(state8.metrics.completedActions, 1, '1 completed action');
  assert.strictEqual(state8.metrics.confirmedDecisions, 1, '1 confirmed decision');
  assert.strictEqual(state8.metrics.totalDecisions, 2, '2 total decisions');
  console.log('   ✅ Test 10 Passed: Dashboard metrics dynamically match live state.\n');

  // -------------------------------------------------------------------
  // TEST 11: Zero Production Mock Data Audit
  // -------------------------------------------------------------------
  console.log('1️⃣1️⃣ Running Zero Production Mock Data Audit...');
  const prodFiles = [
    path.join(__dirname, '../ai-engine/models/incidentState.js'),
    path.join(__dirname, '../backend/src/controllers/incidentController.js'),
    path.join(__dirname, '../frontend/src/data/demoData.js'),
    path.join(__dirname, '../frontend/src/components/TeamPanel.jsx'),
    path.join(__dirname, '../frontend/src/components/ActionItemsPanel.jsx'),
    path.join(__dirname, '../frontend/src/components/DecisionsPanel.jsx'),
  ];

  const forbiddenNames = ['Alice Chen', 'Bob Kumar', 'Charlie Davis', 'Support Lead'];

  prodFiles.forEach((fpath) => {
    if (fs.existsSync(fpath)) {
      const content = fs.readFileSync(fpath, 'utf8');
      forbiddenNames.forEach((name) => {
        const found = content.includes(name);
        assert(!found, `Production file ${path.basename(fpath)} must NOT contain mock participant "${name}"`);
      });
    }
  });
  console.log('   ✅ Test 11 Passed: Zero mock participants found across all production files.\n');

  // -------------------------------------------------------------------
  // TEST 12: Existing Phase 1 Voice Functionality Intact
  // -------------------------------------------------------------------
  console.log('1️⃣2️⃣ Verifying Existing Phase 1 Voice Pipeline Functionality...');
  const state9 = new IncidentState('INC-TEST-9');
  const processor9 = new TranscriptProcessor(state9);

  // Facts correlation
  const factRes1 = await processor9.process({
    speaker: 'You (Incident Commander)',
    text: 'There is 95 percent CPU usage.',
  });
  assert.strictEqual(factRes1.processedItem.classification.category, 'FACT');
  assert(factRes1.spokenResponse.includes('CPU spike'));
  assert(!factRes1.spokenResponse.toLowerCase().includes('payment gateway'), 'Must not inject payment gateway into CPU spike fact');

  const factRes2 = await processor9.process({
    speaker: 'You (Incident Commander)',
    text: 'We are getting 502 errors from the payment gateway.',
  });
  assert.strictEqual(factRes2.processedItem.classification.category, 'FACT');
  assert(factRes2.spokenResponse.includes('502') || factRes2.spokenResponse.includes('CPU'));
  console.log('   ✅ Test 12 Passed: Multi-fact correlation and intelligent AI responses intact.\n');

  console.log('================================================================');
  console.log('🎉 ALL 12 PHASE 2 AUTOMATED TEST SUITES PASSED PERFECTLY!');
  console.log('================================================================\n');
}

runPhase2Tests().catch((err) => {
  console.error('❌ Phase 2 Test Suite Failed:', err);
  process.exit(1);
});
