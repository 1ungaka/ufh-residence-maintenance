/**
 * Central error handling.
 * Users see a short, understandable message. Technical detail stays in the
 * server log and is never sent to the browser.
 */
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'That page or endpoint does not exist.' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  if (config.env !== 'test') {
    console.error('[error]', err);
  }

  res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
