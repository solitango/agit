import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((ctx, next) => {
  ctx.locals.requestTime = new Date();
  return next();
});
