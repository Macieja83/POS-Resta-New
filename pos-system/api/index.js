// Vercel serverless handler: createApp() is async (initializes DB), so we must
// export a function(req, res) that resolves the app once and forwards requests.
const { createApp } = require('../apps/backend/dist/app');

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
