/**
 * Express application (the "server" half of the client-server architecture).
 * server.js starts it; the tests import it directly.
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Sensible security headers on every response.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // Only the frontend origin may call the API from a browser.
  app.use(cors({ origin: config.corsOrigin, credentials: false }));

  // Body parsers with a size limit.
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // Health check - useful when demonstrating the network setup.
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'UFH Residence Maintenance Portal API' });
  });

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
