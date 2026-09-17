import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, organizationId: user.organizationId.toString() },
    jwtConfig.accessSecret,
    { expiresIn: jwtConfig.accessExpiresIn }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, jwtConfig.accessSecret);
}
