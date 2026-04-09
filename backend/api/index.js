let cachedHandler;

module.exports = async (req, res) => {
  try {
    if (!cachedHandler) {
      const { bootstrap } = await import('../dist/src/main.js');
      const app = await bootstrap();
      const expressApp = app.getHttpAdapter().getInstance();
      cachedHandler = expressApp;
    }
    return cachedHandler(req, res);
  } catch (error) {
    console.error('Error initializing NestJS app:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

