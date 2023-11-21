import Router from '@koa/router';
export const rootRouter = new Router();
rootRouter.get('/health', (ctx) => {
  ctx.body = 'Ok';
});
