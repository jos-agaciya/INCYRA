const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Calculate absolute path to ROOT .env (3 levels up from backend/src/config)
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const backendEnvPath = path.resolve(__dirname, '../../.env');
const cwdEnvPath = path.resolve(process.cwd(), '.env');

// Load environment variables with explicit priority for root .env
const candidatePaths = [rootEnvPath, backendEnvPath, cwdEnvPath];
for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

// Fallback to default search
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aiProvider: process.env.AI_PROVIDER || 'mock',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  agoraAppId: process.env.AGORA_APP_ID || '',
  agoraAppCertificate: process.env.AGORA_APP_CERTIFICATE || '',
  agoraCustomerId: process.env.AGORA_CUSTOMER_ID || '',
  agoraCustomerSecret: process.env.AGORA_CUSTOMER_SECRET || '',
  agoraPipelineId: process.env.AGORA_PIPELINE_ID || '',
  agoraAsrResourceId: process.env.AGORA_ASR_RESOURCE_ID || '',
  agoraLlmResourceId: process.env.AGORA_LLM_RESOURCE_ID || '',
  agoraTtsResourceId: process.env.AGORA_TTS_RESOURCE_ID || '',
  agoraAgentRtcUid: process.env.AGORA_AGENT_RTC_UID || '',
  agoraRemoteRtcUids: process.env.AGORA_REMOTE_RTC_UIDS || '',
};

module.exports = config;
