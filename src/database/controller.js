import Router from "koa-router";
import axios from "axios";
import { pick } from "lodash";

export const router = Router({
  prefix: "/db"
});

router.use(async (ctx, next) => {
  if (
    !ctx.req.headers["x-auth-couchdb-username"] ||
    !ctx.req.headers["x-auth-couchdb-token"]
  ) {
    ctx.status = 400;
    ctx.body = "Missing CouchDB authentication headers";
  } else {
    await next();
  }
});

router.all("/userdb-:db(.*)", async ctx => {
  const response = await axios({
    params: ctx.request.query,
    method: ctx.req.method,
    url: `http://localhost:5984/userdb-${ctx.params.db}`,
    data: ctx.request.body,
    headers: pick(ctx.req.headers, [
      "x-auth-couchdb-username",
      "x-auth-couchdb-token"
    ])
  });

  ctx.body = response.data;
  ctx.status = response.status;
});

export const init = app => {
  app.use(router.middleware()).use(router.allowedMethods());
};
