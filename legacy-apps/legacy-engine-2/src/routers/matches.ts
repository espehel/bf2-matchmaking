import Router from '@koa/router';
import { generateMatchUsersXml } from '../generators/users';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';

export const matchesRouter = new Router({
  prefix: '/matches',
});

matchesRouter.get('/:id/users.xml', async (ctx) => {
  ctx.set('Content-Type', 'text/xml');
  const match = await client().getMatch(Number(ctx.params.id)).then(verifySingleResult);
  ctx.body = generateMatchUsersXml(match);
});
