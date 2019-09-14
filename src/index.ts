import Koa from "koa";
import Router from "koa-router";
import logger from "koa-logger";
import json from "koa-json";
import bodyParser from "koa-bodyparser";

import * as Reminders from "./reminders";

const port = process.env.PORT || 4000;
const app = new Koa();
const router = new Router();

router.get("/", async (ctx, next) => {
  ctx.body = {
    message: "Everything is fine"
  };

  return next();
});

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err.message;
  }
});

app.use(json());
app.use(logger());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
