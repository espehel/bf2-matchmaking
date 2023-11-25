import Router from '@koa/router';
import {
  verifyKey,
  InteractionType,
  InteractionResponseType,
} from 'discord-interactions';
import { assertString } from '@bf2-matchmaking/utils';

export const interactionsRouter = new Router();

interactionsRouter.use(async (ctx, next) => {
  assertString(process.env.PUBLIC_KEY, 'PUBLIC_KEY not defined');
  const signature = ctx.get('X-Signature-Ed25519');
  const timestamp = ctx.get('X-Signature-Timestamp');
  const isValidRequest = verifyKey(
    ctx.req.rawBody,
    signature,
    timestamp,
    process.env.PUBLIC_KEY
  );
  if (!isValidRequest) {
    ctx.status = 401;
    ctx.body = 'Bad request signature';
  } else {
    await next();
  }
});

interactionsRouter.post('/interactions', (ctx) => {
  const message = ctx.req.body;

  if (message.type === InteractionType.PING) {
    ctx.body = { type: InteractionResponseType.PONG };
  }
});
