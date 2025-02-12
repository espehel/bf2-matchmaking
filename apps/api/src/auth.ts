import { Context, Next } from 'koa';
import { assertString } from '@bf2-matchmaking/utils';
import { AccessRoles, SessionUser } from '@bf2-matchmaking/types/api';
import { verifyToken } from '@bf2-matchmaking/auth/token';

assertString(process.env.API_KEY, 'API_KEY is not set.');

declare module 'koa' {
  interface Request {
    token?: string;
    user?: SessionUser;
  }
}

export function protect(role: AccessRoles) {
  return async (ctx: Context, next: Next) => {
    if (role === 'system') {
      const providedApiKey = ctx.get('X-API-Key') || ctx.query.api_key;
      if (!providedApiKey || providedApiKey !== process.env.API_KEY) {
        ctx.throw(401, 'Invalid or missing API key');
      }
    }

    if (role === 'user') {
      const idToken = ctx.request.token;

      if (!idToken) {
        ctx.throw(401, 'Missing id token');
      }
      const userFromToken = await verifyToken(idToken);
      ctx.request.user = userFromToken;
    }

    await next();
  };
}

export function bearerToken() {
  return (ctx: Context, next: Next) => {
    const { header } = ctx.request;
    if (header.authorization) {
      const parts = header.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        ctx.request.token = parts[1];
      }
    }

    return next();
  };
}
