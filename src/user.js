import crypto from "crypto";
import bcrypt from "bcrypt";
import assert from "assert";
import _ from "lodash";

import db from "./database/index.js";

assert(process.env.COUCHDB_SECRET);

const usersDB = db.use("_users");
const saltRounds = 10;

const fieldsAllowedForUpdate = ["confirmed_at"];

const nameToToken = name => {
  const hmac = crypto.createHmac("sha1", process.env.COUCHDB_SECRET);
  hmac.update(name);
  return hmac.digest("hex");
};

export const create = async ({ email, password }) => {
  const name = Buffer.from(email).toString("base64");
  const id = `org.couchdb.user:${name}`;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  try {
    await usersDB.insert({
      _id: id,
      type: "user",
      name,
      roles: ["user"],
      email,
      hashed_password: hashedPassword,
      confirmation_token: "token",
      confirmed_at: null
    });

    return { id, email, name, token: nameToToken(name) };
  } catch (e) {
    if (e.statusCode === 409) {
      const error = new Error("User already registered");
      error.statusCode = 409;
      throw error;
    }
    throw e;
  }
};

export const update = async ({ user, changes }) => {
  return usersDB.insert({
    ...user,
    ..._._.pick(changes, fieldsAllowedForUpdate)
  });
};

export const get = async ({ email, password }) => {
  const name = Buffer.from(email).toString("base64");
  const id = `org.couchdb.user:${name}`;

  const user = await usersDB.get(id);

  const result = await bcrypt.compare(password, user.hashed_password);

  if (result) {
    return { id, name, email: user.email, token: nameToToken(name) };
  } else {
    const error = new Error();
    error.statusCode = 401;
    throw error;
  }
};
