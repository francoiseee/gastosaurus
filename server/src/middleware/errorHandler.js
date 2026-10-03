import { HttpError } from '../utils/HttpError.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(HttpError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

// Express 5 forwards errors thrown in async handlers here automatically.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.fields && { fields: err.fields }) },
    });
  }

  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_JSON', message: 'Request body is not valid JSON.' } });
  }

  // Database rule hit despite the service checks (e.g. two people clicking at
  // the same moment). Report it as a conflict instead of a crash.
  if (err.code === '23505') {
    return res.status(409).json({ error: { code: 'CONFLICT', message: 'That already exists. Refresh and try again.' } });
  }
  if (err.code === '23514' || err.code === '23503') {
    return res.status(409).json({
      error: { code: 'CONFLICT', message: 'That change would break the group\'s records. Refresh and try again.' },
    });
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong on our side. Please try again.',
      ...(!env.isProduction && { detail: err.message }),
    },
  });
}
