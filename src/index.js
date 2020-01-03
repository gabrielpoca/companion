import Koa from "koa";
import Router from "koa-joi-router";
import logger from "koa-logger";
import json from "koa-json";
import bodyParser from "koa-bodyparser";
import helmet from "koa-helmet";
import cors from "@koa/cors";

import * as User from "./user.js";
import * as Database from "./database/index.js";
import * as Reminders from "./reminders.js";

const Joi = Router.Joi;
const port = process.env.PORT || 4000;
const app = new Koa();
const router = Router();

import * as emailAccountConfirmation from "./email/account_confirmation.js";

router.route({
  method: "post",
  path: "/sign_up",
  validate: {
    type: "json",
    body: {
      email: Joi.string().email(),
      password: Joi.string()
        .min(12)
        .max(50)
    },
    output: {
      201: {
        body: {
          id: Joi.string(),
          name: Joi.string(),
          email: Joi.string(),
          token: Joi.string()
        }
      }
    }
  },
  handler: async ctx => {
    ctx.status = 201;
    ctx.body = await User.create(ctx.request.body);
  }
});

router.route({
  method: "post",
  path: "/sign_in",
  validate: {
    type: "json",
    body: {
      email: Joi.string().email(),
      password: Joi.string()
        .min(12)
        .max(50)
    },
    output: {
      200: {
        body: {
          id: Joi.string(),
          name: Joi.string(),
          email: Joi.string(),
          token: Joi.string()
        }
      }
    }
  },
  handler: async ctx => {
    ctx.body = await User.get(ctx.request.body);
  }
});

router.route({
  method: "post",
  path: "/confirm_account",
  validate: {
    type: "json",
    body: {
      token: Joi.string()
    }
  },
  handler: async ctx => {}
});

app.use(logger());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error(err);
    ctx.status = err.status || 500;
    ctx.body = err.msg;
  }
});

if (process.env.NODE_ENV !== "production") app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(json());
app.use(bodyParser());
app.use(router.middleware()).use(router.router.allowedMethods());

Database.setup()
  .then(async () => {
    Reminders.start();
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
