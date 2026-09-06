/**
 * A thrown ApiError is turned into a clean JSON response by the error handler.
 * Using this everywhere keeps internal details (stack traces, SQL) out of
 * responses sent to the browser.
 */
export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }
  static unauthorized(message = 'Your session has expired. Please log in again.') {
    return new ApiError(401, message);
  }
  static forbidden(message = 'You are not authorised to perform this action.') {
    return new ApiError(403, message);
  }
  static notFound(message = 'Request could not be found.') {
    return new ApiError(404, message);
  }
  static conflict(message) {
    return new ApiError(409, message);
  }
}
