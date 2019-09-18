const crypto = require("crypto");

const db = require("./database");

const usersDB = db.use("_users");

const nameToToken = name => {
  console.log("name", name);
  const hmac = crypto.createHmac("sha256", "secret");
  hmac.update(name);
  return hmac.digest("hex");
};

module.exports.create = async ({ email, password }) => {
  const name = Buffer.from(email).toString("base64");
  const id = `org.couchdb.user:${name}`;

  try {
    await usersDB.insert({
      _id: id,
      type: "user",
      name,
      roles: ["user"],
      email,
      password
    });

    return { id, name, token: nameToToken(name) };
  } catch (e) {
    if (e.statusCode === 409) {
      const error = new Error("User already exists");
      error.statusCode = 409;
      throw error;
    }
    throw e;
  }
};

module.exports.get = async ({ email, password }) => {
  const name = Buffer.from(email).toString("base64");
  const id = `org.couchdb.user:${name}`;

  await usersDB.get(id);

  return { id, name, token: nameToToken(name) };
};
