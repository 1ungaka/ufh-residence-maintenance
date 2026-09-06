/**
 * Registration, login and profile.
 * Only students can self-register; maintenance accounts are created by the
 * residence department (represented here by the seed script).
 */
import bcrypt from 'bcryptjs';
import { userModel } from '../models/userModel.js';
import { signToken } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import {
  requireString,
  requireEmail,
  requireStudentEmail,
  requirePassword,
  requireResidence,
  requireRoom
} from '../utils/validation.js';

const BCRYPT_ROUNDS = 10;

export function register(req, res) {
  const name = requireString(req.body.name, 'your full name', { min: 2, max: 80 });
  const email = requireStudentEmail(req.body.email);
  const password = requirePassword(req.body.password);
  const residence = requireResidence(req.body.residence);
  const room = requireRoom(req.body.room);

  if (userModel.emailExists(email)) {
    throw ApiError.conflict('An account with that email address already exists.');
  }

  const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  const user = userModel.create({
    name,
    email,
    passwordHash,
    role: 'student',
    residence,
    room
  });

  res.status(201).json({ token: signToken(user), user });
}

export function login(req, res) {
  const email = requireEmail(req.body.email);
  const password = requireString(req.body.password, 'your password', { max: 100 });

  const record = userModel.findByEmailWithHash(email);

  // The same message is used for an unknown email and a wrong password so that
  // the login form cannot be used to discover which accounts exist.
  const invalid = ApiError.unauthorized('Email or password is incorrect.');
  if (!record) throw invalid;
  if (!bcrypt.compareSync(password, record.password_hash)) throw invalid;

  const user = userModel.findById(record.id); // without the password hash
  res.json({ token: signToken(user), user });
}

export function me(req, res) {
  res.json({ user: req.user });
}

export function updateProfile(req, res) {
  const name = requireString(req.body.name, 'your full name', { min: 2, max: 80 });

  if (req.user.role === 'student') {
    const residence = requireResidence(req.body.residence);
    const room = requireRoom(req.body.room);
    return res.json({ user: userModel.updateProfile(req.user.id, { name, residence, room }) });
  }

  res.json({ user: userModel.updateProfile(req.user.id, { name, residence: null, room: null }) });
}
