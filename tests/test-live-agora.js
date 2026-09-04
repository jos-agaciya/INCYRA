/**
 * INCYRA - Manual Live Agora API Test Script
 *
 * Use this script to test your actual Agora credentials configured in .env.
 * NOTE: This will make a real API call to Agora Conversational AI.
 * Run with: node tests/test-live-agora.js [optional_channel_name]
 *      or:  cd backend && npm run test:live -- [optional_channel_name]
 */

// Load backend environment configuration (safely loads ROOT .env via backend/node_modules/dotenv)
require('../backend/src/config/env');

const AgoraApiClient = require('../agora/conversational-ai/agoraApiClient');

async function testLiveAgoraJoin() {
  const channelName = process.argv[2] || 'incyra-manual-test-channel';

  console.log('====================================================');
  console.log('🎙️  INCYRA - Live Agora Conversational AI Test');
  console.log(`📡 Target Channel: "${channelName}"`);
  console.log('====================================================\n');

  const client = new AgoraApiClient();
  const configCheck = client.checkConfiguration();

  if (!configCheck.configured) {
    console.error('❌ Missing required Agora configuration in .env:');
    configCheck.missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\nPlease fill in your Agora credentials in .env and try again.');
    process.exit(1);
  }

  console.log('🔒 Agora configuration detected in .env (secrets masked).');

  // SAFE Payload Structure Verification
  const requestPayload = client.buildRequestBody(channelName);
  console.log('\n🔍 Safe Outgoing Payload Structure Verification:');
  console.log('   - name present:', Boolean(requestPayload.name));
  console.log('   - agent_rtc_uid present:', requestPayload.agent_rtc_uid !== undefined);
  console.log('   - agent_rtc_uid type:', typeof requestPayload.agent_rtc_uid);
  console.log('   - remote_rtc_uids present:', Boolean(requestPayload.remote_rtc_uids));
  console.log('   - remote_rtc_uids type:', Array.isArray(requestPayload.remote_rtc_uids) ? 'Array' : typeof requestPayload.remote_rtc_uids);
  console.log('   - remote_rtc_uids count:', Array.isArray(requestPayload.remote_rtc_uids) ? requestPayload.remote_rtc_uids.length : 'N/A');
  console.log('   - pipeline_id present:', Boolean(requestPayload.pipeline_id));
  console.log('   - properties present:', Boolean(requestPayload.properties));

  console.log('\n🚀 Sending join request to Agora Conversational AI REST API...');

  try {
    const response = await client.joinChannel(channelName);
    console.log('\n✅ Successfully joined Agora channel!');
    console.log('Status Code:', response.status);
    console.log('Safe Response Data:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('\n❌ Agora join request returned an error:');
    console.error(`Status Code: ${err.statusCode || 'N/A'}`);
    console.error(`Error Message: ${err.message}`);
    if (err.agoraResponse) {
      console.error('Details:', JSON.stringify(err.agoraResponse, null, 2));
    }
  }
}

testLiveAgoraJoin();
