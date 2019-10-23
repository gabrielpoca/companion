const Nano = require("nano");
const axios = require("axios");
const assert = require("assert");
const url = require("url");

const usersDocValidation = require("./users_doc_validation");

assert(process.env.COUCHDB_URL);
assert(process.env.COUCHDB_USER);
assert(process.env.COUCHDB_PASSWORD);

const couchUrl = url.parse(process.env.COUCHDB_URL);
couchUrl.auth = `${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}`;

const n = Nano(couchUrl.format());

module.exports = n.db;

module.exports.setup = async () => {
  try {
    await n.db.create("_users");
  } catch (e) {
    console.log("_users database already exists");
  }
  try {
    await n.db.create("_replicator");
  } catch (e) {
    console.log("_replicator database already exists");
  }
  try {
    await n.db.create("_global_changes");
  } catch (e) {
    console.log("_global_changes database already exists");
  }

  try {
    await axios.put(
      `${process.env.COUCHDB_URL}/_node/_local/_config/couch_peruser/enable`,
      '"true"',
      {
        auth: {
          username: process.env.COUCHDB_USER,
          password: process.env.COUCHDB_PASSWORD
        }
      }
    );

    console.log("couch_peruser enabled");

    const auth = await n.db.use("_users").get("_design/_auth");
    auth.validate_doc_update = usersDocValidation.toString();
    n.db.use("_users").insert(auth);

    console.log("_users auth document updated");
  } catch (e) {
    console.error(e.response);
    throw new Error("Failed to setup CouchDB");
  }
};
