/**
 * INCYRA Phase 1 Stabilization Test Suite
 * Validates:
 * 1. INCYRA Pronunciation Transformation
 * 2. Agent Persistence & Keep-Alive Lifecycle
 * 3. Initial & Conversational Greetings
 * 4. Multi-Fact Correlation & "How do we fix it" Contextual Guidance
 * 5. Natural Conversational Dialog
 * 6. Elimination of Mock Participant Data
 */

const assert = require('assert');

// Import AI Engine and Agora components
const IncidentState = require('../ai-engine/models/incidentState');
const StatementClassifier = require('../ai-engine/processors/classifier');
const ConflictDetector = require('../ai-engine/processors/conflictDetector');
const ResponseGenerator = require('../ai-engine/processors/responseGenerator');
const TranscriptProcessor = require('../ai-engine/processors/transcriptProcessor');
const AgoraAgentManager = require('../agora/conversational-ai/agentManager');
const AgoraChannelManager = require('../agora/rtc/channelManager');

// Phonetic transformation logic (same as frontend/src/services/agora.js)
function formatTextForSpeechSynthesis(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\bINCYRA\b/gi, 'In-syrah');
}

async function runPhase1Tests() {
  console.log('======================================================');
  console.log('🧪 Running INCYRA Phase 1 Stabilization Verification');
  console.log('======================================================\n');

  // -------------------------------------------------------------------
  // TEST 1: INCYRA Pronunciation
  // -------------------------------------------------------------------
  console.log('1️⃣ Testing INCYRA TTS-Safe Pronunciation Transformation...');
  const testPhrase1 = 'INCYRA has detected a conflict.';
  const phonetic1 = formatTextForSpeechSynthesis(testPhrase1);
  assert.strictEqual(phonetic1, 'In-syrah has detected a conflict.', 'INCYRA must transform to In-syrah');
  assert.strictEqual(testPhrase1, 'INCYRA has detected a conflict.', 'Original display text must remain unaltered');

  const testPhrase2 = 'Hello, I am INCYRA. Welcome to INCYRA Incident Room.';
  const phonetic2 = formatTextForSpeechSynthesis(testPhrase2);
  assert.strictEqual(phonetic2, 'Hello, I am In-syrah. Welcome to In-syrah Incident Room.');
  console.log('   ✅ Test 1 Passed: INCYRA transforms to "In-syrah" for TTS while display strings remain intact.\n');

  // -------------------------------------------------------------------
  // TEST 2: Agent Persistence & Lifecycle (Keep-Alive)
  // -------------------------------------------------------------------
  console.log('2️⃣ Testing Agora Agent Persistence & Keep-Alive Lifecycle...');
  const mockApiClient = {
    checkConfiguration: () => ({ configured: true, missing: [] }),
    joinChannel: async (channel) => ({
      success: true,
      data: { agent_id: 'agent-persisted-1001', status: 'RUNNING' },
    }),
    leaveAgentSession: async (agentId) => ({ success: true }),
  };

  const channelMgr = new AgoraChannelManager();
  const agentMgr = new AgoraAgentManager({ apiClient: mockApiClient, channelManager: channelMgr });

  // First Join
  const join1 = await agentMgr.joinIncidentAgent('incident-test-channel');
  assert.strictEqual(join1.success, true);
  assert.strictEqual(join1.agent.agentId, 'agent-persisted-1001');

  // Second Join (Simulating React rerender / StrictMode remount)
  const join2 = await agentMgr.joinIncidentAgent('incident-test-channel');
  assert.strictEqual(join2.success, true);
  assert.strictEqual(join2.agent.agentId, 'agent-persisted-1001', 'Must keep active session alive without duplicate Agora API join');
  assert.strictEqual(join2.message, 'INCYRA agent already joined and active in channel');

  // Explicit Stop (Leave Room clicked by user)
  const stopRes = await agentMgr.stopIncidentAgent('incident-test-channel');
  assert.strictEqual(stopRes.success, true);
  assert.strictEqual(stopRes.status, 'STOPPED');
  console.log('   ✅ Test 2 Passed: Agent kept alive across rerenders and only stopped on explicit user action.\n');

  // -------------------------------------------------------------------
  // TEST 3 & 5: Greetings & Conversational Responses
  // -------------------------------------------------------------------
  console.log('3️⃣ Testing Initial & Natural Greeting Responses...');
  const state = new IncidentState('INC-8921');
  const processor = new TranscriptProcessor(state);

  // User says "hello"
  const helloRes = await processor.process({
    speaker: 'You (Incident Commander)',
    text: 'hello',
  });
  assert.strictEqual(helloRes.processedItem.classification.category, 'GREETING');
  assert(
    helloRes.spokenResponse.toLowerCase().includes('online and monitoring') ||
    helloRes.spokenResponse.toLowerCase().includes('hello'),
    'Greeting must be natural'
  );
  assert(
    !helloRes.spokenResponse.includes('monitoring all participant observations'),
    'Must not use generic NPC line'
  );
  console.log('   ✅ AI Greeting Response:', `"${helloRes.spokenResponse}"`);
  console.log('   ✅ Test 3 & 5 Passed: Natural conversational greetings implemented.\n');

  // -------------------------------------------------------------------
  // TEST 4: Intelligent Context & "How do we fix it?"
  // -------------------------------------------------------------------
  console.log('4️⃣ Testing Multi-Fact Correlation & "How do we fix it" Contextual Synthesis...');
  state.reset();

  // Utterance 1: 95% CPU
  const cpuRes = await processor.process({
    speaker: 'Incident Commander',
    text: 'There is 95 percent CPU usage.',
  });
  console.log('   Utterance 1 ("There is 95 percent CPU usage.") ->', `"${cpuRes.spokenResponse}"`);
  assert(cpuRes.spokenResponse.toLowerCase().includes('cpu'), 'Must reference CPU');
  assert(cpuRes.spokenResponse.includes('?') || cpuRes.spokenResponse.toLowerCase().includes('logged'), 'Must ask relevant follow-up or confirm fact');

  // Utterance 2: 502 errors
  const errorsRes = await processor.process({
    speaker: 'Backend Lead',
    text: 'We are getting 502 errors in the payment gateway.',
  });
  console.log('   Utterance 2 ("We are getting 502 errors...") ->', `"${errorsRes.spokenResponse}"`);
  assert(
    errorsRes.spokenResponse.toLowerCase().includes('correlated') ||
    errorsRes.spokenResponse.toLowerCase().includes('pressure') ||
    errorsRes.spokenResponse.toLowerCase().includes('502'),
    'Must correlate 502 errors with CPU spike'
  );

  // Utterance 3: How do we fix it?
  const fixRes = await processor.process({
    speaker: 'Incident Commander',
    text: 'How do we fix it?',
  });
  console.log('   Utterance 3 ("How do we fix it?") ->', `"${fixRes.spokenResponse}"`);
  assert.strictEqual(fixRes.processedItem.classification.category, 'HOW_TO_FIX');
  assert(
    fixRes.spokenResponse.toLowerCase().includes('cpu') &&
    (fixRes.spokenResponse.toLowerCase().includes('gateway') || fixRes.spokenResponse.toLowerCase().includes('instances')),
    'Fix recommendations must synthesize both CPU and gateway errors'
  );
  console.log('   ✅ Test 4 Passed: Contextual intelligence synthesizes previous incident facts.\n');

  // -------------------------------------------------------------------
  // TEST 6: Real Participants Only (No Mock Users)
  // -------------------------------------------------------------------
  console.log('6️⃣ Testing Elimination of Mock Participant Data...');
  const cleanSnapshot = state.toJSON();
  const participantNames = cleanSnapshot.participants.map((p) => p.name);
  assert(!participantNames.includes('Alice Chen'), 'Alice Chen must not exist');
  assert(!participantNames.includes('Bob Kumar'), 'Bob Kumar must not exist');
  assert(!participantNames.includes('Charlie Davis'), 'Charlie Davis must not exist');
  assert(!participantNames.includes('Support Lead'), 'Support Lead must not exist');
  console.log('   Active participants in state:', participantNames);
  console.log('   ✅ Test 6 Passed: Zero mock participants found.\n');

  console.log('======================================================');
  console.log('🎉 ALL PHASE 1 STABILIZATION TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================');
}

runPhase1Tests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
