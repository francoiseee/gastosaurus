import { HttpError } from '../utils/HttpError.js';

/**
 * Validate req.body against a zod schema. On success, req.body is replaced
 * with the parsed (trimmed / defaulted) value. On failure, respond 400 with
 * per-field messages the form can show under each input.
 */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || 'form';
      fields[key] ??= issue.message;
    }
    throw HttpError.badRequest('Please check the highlighted fields.', fields);
  }
  req.body = result.data;
  next();
};
