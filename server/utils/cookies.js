import { isProduction } from '../config/env.js';
import { jwtConfig } from '../config/jwt.js';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
};

export function setAuthCookies(res, { accessToken, refreshToken, csrfToken }) {
  res.cookie('accessToken', accessToken, {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...baseCookieOptions,
    maxAge: jwtConfig.refreshExpiresInDays * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });

  res.cookie('csrfToken', csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: jwtConfig.refreshExpiresInDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie('accessToken', baseCookieOptions);
  res.clearCookie('refreshToken', { ...baseCookieOptions, path: '/api/v1/auth' });
  res.clearCookie('csrfToken', { httpOnly: false, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
}
