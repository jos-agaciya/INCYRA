/**
 * INCYRA - Agora Integration Unit & Mock Verification Tests
 * Tests validation, Basic Auth generation, request construction, RTC token generation, and error handling without exposing secrets.
 */

const assert = require('assert');
const AgoraApiClient = require('../agora/conversational-ai/agoraApiClient');
const AgoraAgentManager = require('../agora/conversational-ai/agentManager');
const AgoraChannelManager = require('../agora/rtc/channelManager');
const AgoraTokenService = require('../agora/rtc/tokenService');

async function runAgoraUnitTests() {
  console.log('🧪 Starting Agora Integration Unit Tests...\n');

  // Test 1: Configuration check
  console.log('1️⃣ Testing Configuration Validator');
  const dummyClient = new AgoraApiClient({
    appId: '970ca35de60c44645bbae8a215061408',
    appCertificate: '5cfd2fd1755d40ecb72977518be15d3b',
    customerId: 'test-customer-id',
    customerSecret: 'test-customer-secret',
    pipelineId: 'test-pipeline-id',
    agentRtcUid: 999999,
    remoteRtcUids: ['*'],
    asrResourceId: 'test-asr-res',
    llmResourceId: 'test-llm-res',
    ttsResourceId: 'test-tts-res',
  });
  const configCheck = dummyClient.checkConfiguration();
  assert.strictEqual(configCheck.configured, true);
  assert.strictEqual(configCheck.missing.length, 0);
  console.log('   ✅ Fully configured client passes check');

  const unconfiguredClient = new AgoraApiClient({
    appId: '',
    customerId: '',
    customerSecret: '',
    pipelineId: '',
    agentRtcUid: '',
    remoteRtcUids: '',
    asrResourceId: '',
    llmResourceId: '',
    ttsResourceId: '',
  });
  const unconfiguredCheck = unconfiguredClient.checkConfiguration();
  assert.strictEqual(unconfiguredCheck.configured, false);
  assert.strictEqual(unconfiguredCheck.missing.length, 8);
  assert(unconfiguredCheck.missing.includes('AGORA_AGENT_RTC_UID'));
  console.log('   ✅ Unconfigured client lists missing variables safely');

  // Test 2: remote_rtc_uids parsing
  console.log('\n2️⃣ Testing remote_rtc_uids Parser');
  const wildcardClient = new AgoraApiClient({ remoteRtcUids: '*' });
  assert.deepStrictEqual(wildcardClient.parseRemoteRtcUids(), ['*']);

  const jsonArrayClient = new AgoraApiClient({ remoteRtcUids: '["*"]' });
  assert.deepStrictEqual(jsonArrayClient.parseRemoteRtcUids(), ['*']);

  const numericArrayClient = new AgoraApiClient({ remoteRtcUids: '1002, 1003' });
  assert.deepStrictEqual(numericArrayClient.parseRemoteRtcUids(), [1002, 1003]);

  const emptyClient = new AgoraApiClient({ remoteRtcUids: '' });
  assert.deepStrictEqual(emptyClient.parseRemoteRtcUids(), ['*']);
  console.log('   ✅ remote_rtc_uids handles wildcards, comma-separated lists, and defaults');

  // Test 3: Basic Authentication header generation
  console.log('\n3️⃣ Testing Basic Auth Header Generation');
  const authHeader = dummyClient.getBasicAuthHeader();
  assert(authHeader.startsWith('Basic '), 'Header must start with Basic');
  const encodedPayload = authHeader.replace('Basic ', '');
  const decoded = Buffer.from(encodedPayload, 'base64').toString('utf8');
  assert.strictEqual(decoded, 'test-customer-id:test-customer-secret');
  console.log('   ✅ Basic Auth header properly encodes Customer ID and Secret in base64');

  // Test 4: Channel Name validation on joinChannel
  console.log('\n4️⃣ Testing Channel Name Validation');
  try {
    await dummyClient.joinChannel('');
    assert.fail('Should have thrown error for empty channel name');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    console.log('   ✅ Empty channel name correctly rejected with 400 Bad Request');
  }

  // Test 5: Missing configuration error handling
  console.log('\n5️⃣ Testing Unconfigured Join Attempt');
  try {
    await unconfiguredClient.joinChannel('incident-room-101');
    assert.fail('Should have thrown error for unconfigured client');
  } catch (err) {
    assert.strictEqual(err.statusCode, 503);
    assert(err.missing && err.missing.length > 0);
    console.log('   ✅ Unconfigured join cleanly throws 503 without crashing');
  }

  // Test 6: Invalid Agent RTC UID validation
  console.log('\n6️⃣ Testing Agent RTC UID Validation');
  const invalidUidClient = new AgoraApiClient({
    appId: '970ca35de60c44645bbae8a215061408',
    customerId: 'test-customer-id',
    customerSecret: 'test-customer-secret',
    pipelineId: 'test-pipeline-id',
    agentRtcUid: 'invalid-string',
    asrResourceId: 'test-asr-res',
    llmResourceId: 'test-llm-res',
    ttsResourceId: 'test-tts-res',
  });
  try {
    await invalidUidClient.joinChannel('incident-room-101');
    assert.fail('Should have thrown error for invalid agent_rtc_uid');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert(err.message.includes('AGORA_AGENT_RTC_UID'));
    console.log('   ✅ Invalid AGORA_AGENT_RTC_UID correctly rejected with 400 Bad Request');
  }

  // Test 7: Mocked Agora API Success response with agent_rtc_uid, remote_rtc_uids, and full properties validation
  console.log('\n7️⃣ Testing Mocked Agora REST API Success with agent_rtc_uid, remote_rtc_uids & Properties');
  let capturedUrl = '';
  let capturedOptions = null;

  // Intercept global fetch for test
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    capturedUrl = url;
    capturedOptions = options;
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        code: 0,
        message: 'success',
        agent_id: 'mock-agent-xyz',
        status: 'JOINING',
      }),
    };
  };

  try {
    const response = await dummyClient.joinChannel('incident-room-alpha');
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.data.agent_id, 'mock-agent-xyz');
    assert.strictEqual(capturedUrl, 'https://api.agora.io/api/conversational-ai-agent/v2/projects/970ca35de60c44645bbae8a215061408/join');
    
    const parsedBody = JSON.parse(capturedOptions.body);
    assert.strictEqual(parsedBody.name, 'incident-room-alpha');
    assert.strictEqual(parsedBody.pipeline_id, 'test-pipeline-id');
    assert.strictEqual(parsedBody.agent_rtc_uid, 999999);
    assert.deepStrictEqual(parsedBody.remote_rtc_uids, ['*']);
    assert.strictEqual(capturedOptions.headers['Content-Type'], 'application/json');
    assert(capturedOptions.headers['Authorization'].startsWith('Basic '));

    // Validate Properties Structure
    assert(parsedBody.properties, 'properties must be defined');
    assert.strictEqual(parsedBody.properties.channel, 'incident-room-alpha');
    assert(parsedBody.properties.token, 'properties.token must be generated');
    assert(parsedBody.properties.token.startsWith('007'), 'Agent token must start with 007');
    
    // ASR
    assert.strictEqual(parsedBody.properties.asr.vendor, 'deepgram');
    assert.strictEqual(parsedBody.properties.asr.params.resource_id, 'test-asr-res');
    assert.strictEqual(parsedBody.properties.asr.params.model, 'nova-3');

    // LLM
    assert.strictEqual(parsedBody.properties.llm.vendor, 'openai');
    assert.strictEqual(parsedBody.properties.llm.params.resource_id, 'test-llm-res');
    assert.strictEqual(parsedBody.properties.llm.params.model, 'gpt-4o-mini');
    assert(Array.isArray(parsedBody.properties.llm.system_messages));
    assert(parsedBody.properties.llm.system_messages[0].content.includes('INCYRA'));
    assert(parsedBody.properties.llm.greeting_message.includes('INCYRA online'));
    assert.strictEqual(parsedBody.properties.llm.failure_message, 'Please hold on a second.');

    // TTS
    assert.strictEqual(parsedBody.properties.tts.vendor, 'minimax');
    assert.strictEqual(parsedBody.properties.tts.params.resource_id, 'test-tts-res');
    assert.strictEqual(parsedBody.properties.tts.params.model, 'speech-2.6-turbo');
    assert.strictEqual(parsedBody.properties.tts.params.voice_id, 'English_captivating_female1');

    console.log('   ✅ REST URL, agent_rtc_uid, remote_rtc_uids, agent RTC token, gpt-4o-mini LLM, properties, and JSON payload match Agora specification');
  } finally {
    global.fetch = originalFetch;
  }

  // Test 8: Mocked Agora API Error response
  console.log('\n8️⃣ Testing Mocked Agora REST API Error Handling');
  global.fetch = async () => {
    return {
      ok: false,
      status: 400,
      text: async () => JSON.stringify({
        code: 1001,
        message: 'Pipeline not found or invalid channel name',
      }),
    };
  };

  try {
    await dummyClient.joinChannel('incident-room-alpha');
    assert.fail('Should have thrown Agora API error');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    assert.strictEqual(err.message, 'Pipeline not found or invalid channel name');
    console.log('   ✅ Agora API errors captured and returned with safe error message');
  } finally {
    global.fetch = originalFetch;
  }

  // Test 9: Agora Agent Manager runtime tracking
  console.log('\n9️⃣ Testing Agora Agent Manager & Channel Tracking');
  const mockChannelManager = new AgoraChannelManager();
  const mockAgentManager = new AgoraAgentManager({
    apiClient: dummyClient,
    channelManager: mockChannelManager,
  });

  // Mock fetch for manager join
  global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ agent_id: 'agent-session-42', status: 'JOINED' }),
  });

  try {
    const joinResult = await mockAgentManager.joinIncidentAgent('incident-war-room');
    assert.strictEqual(joinResult.success, true);
    assert.strictEqual(joinResult.channelName, 'incident-war-room');
    assert.strictEqual(joinResult.agent.agentId, 'agent-session-42');

    const channelInfo = mockAgentManager.getAgentStatus('incident-war-room');
    assert.strictEqual(channelInfo.channel.channelName, 'incident-war-room');
    assert.strictEqual(channelInfo.channel.agentJoined, true);
    console.log('   ✅ Channel state accurately tracked in memory without secret leakage');
  } finally {
    global.fetch = originalFetch;
  }

  // Test 10: Agora RTC Token Service
  console.log('\n🔟 Testing Agora RTC Token Service');
  const testTokenService = new AgoraTokenService({
    appId: '970ca35de60c44645bbae8a215061408',
    appCertificate: '5cfd2fd1755d40ecb72977518be15d3b',
  });

  // Channel validation
  try {
    testTokenService.generateRtcToken('');
    assert.fail('Should fail on empty channel');
  } catch (err) {
    assert.strictEqual(err.statusCode, 400);
    console.log('   ✅ Token generation rejects empty channel with 400 Bad Request');
  }

  // Unconfigured service
  const unconfiguredTokenService = new AgoraTokenService({ appId: '', appCertificate: '' });
  try {
    unconfiguredTokenService.generateRtcToken('test-room');
    assert.fail('Should fail on unconfigured service');
  } catch (err) {
    assert.strictEqual(err.statusCode, 503);
    console.log('   ✅ Unconfigured token service cleanly returns 503');
  }

  // Successful token generation
  const tokenResult = testTokenService.generateRtcToken('incident-alpha-1', 123456);
  assert.strictEqual(tokenResult.success, true);
  assert.strictEqual(tokenResult.channelName, 'incident-alpha-1');
  assert.strictEqual(tokenResult.uid, 123456);
  assert.strictEqual(typeof tokenResult.token, 'string');
  assert(tokenResult.token.startsWith('007'), 'Agora RTC Token v4 starts with 007');
  assert.strictEqual(tokenResult.appCertificate, undefined, 'App certificate must never be in response');
  console.log('   ✅ RTC token successfully generated with valid v007 signature & zero secret leakage');

  console.log('\n✅ All Agora Unit Tests Passed Successfully!\n');
}

runAgoraUnitTests().catch((err) => {
  console.error('❌ Agora Unit Tests Failed:', err);
  process.exit(1);
});
