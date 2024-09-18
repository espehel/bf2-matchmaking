import { Context, Next } from 'koa';
import { assertString } from '@bf2-matchmaking/utils';

assertString(process.env.API_KEY, 'API_KEY is not set.');

export function protect() {
  return async (ctx: Context, next: Next) => {
    const providedApiKey = ctx.get('X-API-Key') || ctx.query.api_key;

    if (!providedApiKey || providedApiKey !== process.env.API_KEY) {
      ctx.throw(401, 'Invalid or missing API key');
    }

    await next();
  };
}
