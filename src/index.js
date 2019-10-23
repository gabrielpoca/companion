const Koa = require("koa");
const Router = require("koa-joi-router");
const logger = require("koa-logger");
const json = require("koa-json");
const bodyParser = require("koa-bodyparser");
const helmet = require("koa-helmet");
const cors = require("@koa/cors");

const User = require("./user");
const Database = require("./database");
const Reminders = require("./reminders");

const Joi = Router.Joi;
const port = process.env.PORT || 4000;
const app = new Koa();
const router = Router();

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
      password: Joi.string().max(100)
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
    await Reminders.start();
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
