// tests/setup.js
// ─── Environment variables set BEFORE any module is imported ─────────────────
// This prevents database.js from calling process.exit(1) (MONGODB_URI guard)
// and gives services a default URL for external services.

process.env.MONGODB_URI = 'mongodb://localhost:27017/deal_test_placeholder';
process.env.ML_SERVICE_URL = 'http://localhost:8001';
process.env.AI_SERVICE_URL = 'http://localhost:8000';
process.env.PORT = '3099';

// Suppress verbose console output from services during tests
const noop = () => {};
global.console.log  = noop;
global.console.warn = noop;
// Keep console.error so test failures are still visible
