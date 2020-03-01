import Router from "koa-joi-router";

import * as User from "./user";

const Joi = Router.Joi;

export const router = Router();

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

export const init = app => {
  app.use(router.middleware()).use(router.router.allowedMethods());
};
