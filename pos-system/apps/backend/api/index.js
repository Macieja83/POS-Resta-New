// Vercel serverless handler when Root Directory = apps/backend.
// createApp() is async (initializes DB), so we export (req, res) => {} that resolves the app once.
const { createApp } = require('../dist/app');

let appPromise = null;

function getApp() {
  if (!appPromise) {
    appPromise = createApp();
  }
  return appPromise;
}

module.exports = async function handler(req, res) {
  try {
    const app = await getApp();
    app(req, res);
  } catch (err) {
    console.error('❌ Vercel handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({
        status: 'error',
        message: 'Backend failed to start. Check Vercel logs and DATABASE_URL.',
        error: err.message || String(err)
      });
    }
  }
};
