const crypto = require("crypto");
const bcrypt = require("bcrypt");
const assert = require("assert");

const db = require("./database");

assert(process.env.COUCHDB_SECRET);

const usersDB = db.use("_users");
const saltRounds = 10;

const nameToToken = name => {
  const hmac = crypto.createHmac("sha1", process.env.COUCHDB_SECRET);
  hmac.update(name);
  return hmac.digest("hex");
};

module.exports.create = async ({ email, password }) => {
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
      hashed_passord: hashedPassword
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

module.exports.get = async ({ email, password }) => {
  const name = Buffer.from(email).toString("base64");
  const id = `org.couchdb.user:${name}`;

  const user = await usersDB.get(id);

  if (await bcrypt.compare(password, user.hashed_passord)) {
    return { id, name, email: user.email, token: nameToToken(name) };
  } else {
    const error = new Error();
    error.statusCode = 401;
    throw error;
  }
};
