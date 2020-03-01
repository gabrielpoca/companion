import Koa from "koa";
import Router from "koa-joi-router";
import logger from "koa-logger";
import json from "koa-json";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import cors from "@koa/cors";
import ratelimit from "koa-ratelimit";

import * as database from "./database";
import * as reminders from "./reminders/index";
import * as accounts from "./accounts";

const port = process.env.PORT || 4000;
const app = new Koa();
const db = new Map();
let server;

app.use(logger());

if (process.env.NODE_ENV === "production") {
  app.use(
    ratelimit({
      driver: "memory",
      db,
      duration: 15000,
      errorMessage: "Sometimes You Just Have to Slow Down.",
      id: ctx => {
        return ctx.ip;
      },
      max: 5,
      disableHeader: true,
      whitelist: ctx => {
        if (ctx.status === 404 && ctx.method === "GET") return true;
        return false;
      }
    })
  );
}

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.log(err);
    if (err.isAxiosError) {
      ctx.status = err.response.status || 500;
      ctx.body = err.response.data;
    } else {
      ctx.status = err.status || 500;
      ctx.body = err.msg;
    }
  }
});

if (process.env.NODE_ENV !== "production") app.use(cors({ credentials: true }));

app.use(helmet());
app.use(json());
app.use(bodyParser());

accounts.init(app);
database.init(app);

function start(customPort) {
  return database
    .setup()
    .then(async () => {
      reminders.start();
      server = app.listen(customPort || port);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

function stop() {
  server.close();
}

if (!module.parent) {
  start();
}

export { start, stop };
