import Router from '@koa/router';
import { generateUsersXml } from './users-generator';
import { client } from '@bf2-matchmaking/supabase';
import { Context } from 'koa';
import { protect } from '../auth';

export const playersRouter = new Router({
  prefix: '/players',
});

playersRouter.get('/users.xml', protect('system'), async (ctx: Context) => {
  const { data: players } = await client().getPlayers();
  ctx.assert(players, 500, 'Failed to get players');

  ctx.set('Content-Type', 'text/xml');
  ctx.body = generateUsersXml(players);
});
