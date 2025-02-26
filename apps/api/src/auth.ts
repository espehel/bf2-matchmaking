import { Context, Next } from 'koa';
import { assertString } from '@bf2-matchmaking/utils';
import { AccessRoles, SessionUser } from '@bf2-matchmaking/types/api';
import { verifyToken } from '@bf2-matchmaking/auth/token';
import { isString } from '@bf2-matchmaking/types';
import { error } from '@bf2-matchmaking/logging';
import { getPlayerRoles } from '@bf2-matchmaking/auth/roles';

assertString(process.env.API_KEY, 'API_KEY is not set.');

declare module 'koa' {
  interface Request {
    token?: string;
    user?: SessionUser;
  }
}

export function protect(...roles: Array<AccessRoles>) {
  return async (ctx: Context, next: Next) => {
    const providedApiKey = ctx.get('X-API-Key') || ctx.query.api_key;
    if (isString(providedApiKey)) {
      if (providedApiKey !== process.env.API_KEY) {
        ctx.throw(401, 'Invalid API key');
      }
      ctx.request.user = { id: 'system', nick: 'system', keyhash: 'system' };
      return await next();
    }

    const idToken = ctx.request.token;
    if (!idToken) {
      ctx.throw(401, 'Missing id token');
    }

    try {
      const userFromToken = await verifyToken(idToken);
      const userRoles = await getPlayerRoles(userFromToken.id);
      if (
        userRoles.includes('system_admin') ||
        roles.some((role) => userRoles.includes(role))
      ) {
        ctx.request.user = userFromToken;
        return await next();
      }
    } catch (e) {
      error('protect', e);
      ctx.throw(401, 'Invalid id token');
    }

    ctx.throw(401, 'Unauthorized');
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
