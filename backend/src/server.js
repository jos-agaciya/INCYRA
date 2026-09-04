const app = require('./app');
const config = require('./config/env');

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 INCYRA Backend running in [${config.nodeEnv}] mode`);
  console.log(`📡 URL: http://localhost:${config.port}`);
  console.log(`🩺 Health check: http://localhost:${config.port}/api/health`);
  console.log(`📝 Transcript API: http://localhost:${config.port}/api/incident/transcript`);
  console.log(`====================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection! Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = server;
