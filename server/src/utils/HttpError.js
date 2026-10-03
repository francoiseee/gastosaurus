// Throw one of these anywhere in a route/service and the error handler turns
// it into a JSON response:  { error: { code, message, fields? } }
export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message, fields) {
    return new HttpError(400, 'VALIDATION_ERROR', message, fields);
  }
  static unauthorized(message = 'Please log in to continue.') {
    return new HttpError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'You do not have access to this.') {
    return new HttpError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Not found.') {
    return new HttpError(404, 'NOT_FOUND', message);
  }
  static conflict(message, fields) {
    return new HttpError(409, 'CONFLICT', message, fields);
  }
}
