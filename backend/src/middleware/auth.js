/**
 * Authentication and authorisation.
 *
 * authenticate() - verifies the JWT sent in the Authorization header and loads
 *                  the user from the database (so a deleted user cannot keep
 *                  using an old token).
 * requireRole()  - role-based access control: students and maintenance staff
 *                  can only reach the endpoints meant for them.
 */
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { userModel } from '../models/userModel.js';
import { ApiError } from '../utils/ApiError.js';

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('You must be logged in to do that.'));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = userModel.findById(payload.sub);
    if (!user) return next(ApiError.unauthorized());
    req.user = user; // never contains the password hash
    next();
  } catch {
    next(ApiError.unauthorized());
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
