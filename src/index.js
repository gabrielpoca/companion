const Koa = require("koa");
const Router = require("koa-joi-router");
const logger = require("koa-logger");
const json = require("koa-json");
const bodyParser = require("koa-bodyparser");

const User = require("./user");

const Joi = Router.Joi;
const port = process.env.PORT || 4000;
const app = new Koa();
const router = Router();

router.get("/status", ctx => {
  ctx.body = {
    message: "Everything is good!"
  };
});

router.route({
  method: "post",
  path: "/sign_up",
  validate: {
    type: "json",
    body: {
      email: Joi.string().email(),
      password: Joi.string().max(100)
    },
    output: {
      201: {
        body: {
          id: Joi.string(),
          name: Joi.string(),
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
      password: Joi.string().max(100)
    },
    output: {
      200: {
        body: {
          id: Joi.string(),
          name: Joi.string(),
          token: Joi.string()
        }
      }
    }
  },
  handler: async ctx => {
    ctx.body = await User.get(ctx.request.body);
  }
});

app.use(json());
app.use(logger());

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err.msg;
  }
});

app.use(bodyParser());
app.use(router.middleware()).use(router.router.allowedMethods());

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
