import Router from '@koa/router';
import {
  verifyKey,
  InteractionType,
  InteractionResponseType,
} from 'discord-interactions';
import { assertString } from '@bf2-matchmaking/utils';
import { Context, Next } from 'koa';

export const interactionsRouter = new Router();
// TODO: Not working
// https://github.com/discord/discord-interactions-js/pull/2/files#diff-a2a171449d862fe29692ce031981047d7ab755ae7f84c707aef80701b3ea0c80
function verifyKeyKoaMiddleware(clientPublicKey: string) {
  return async function (ctx: Context, next: Next) {
    const timestamp = ctx.get('X-Signature-Timestamp') || '';
    const signature = ctx.get('X-Signature-Ed25519') || '';
    const { rawBody } = ctx.request;
    const parsedBody = Buffer.from(rawBody);
    if (!(await verifyKey(parsedBody, signature, timestamp, clientPublicKey))) {
      ctx.status = 401;
      ctx.body = 'Invalid signature';
      return;
    }

    const body = JSON.parse(rawBody) || {};

    if (body.type === InteractionType.PING) {
      ctx.set('Content-Type', 'application/json');
      ctx.body = {
        type: InteractionResponseType.PONG,
      };
      return;
    }

    await next();
  };
}
assertString(process.env.PUBLIC_KEY, 'PUBLIC_KEY not defined');
interactionsRouter.use(verifyKeyKoaMiddleware(process.env.PUBLIC_KEY));

interactionsRouter.post('/interactions', (ctx) => {
  const message = ctx.req.body;

  if (message.type === InteractionType.APPLICATION_COMMAND) {
    ctx.body = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: { content: 'Hello' },
    };
  }
});
