const Nano = require("nano");
const axios = require("axios");
const assert = require("assert");

const usersDocValidation = require("./users_doc_validation");

assert(process.env.COUCHDB_URL);

const n = Nano(process.env.COUCHDB_URL);

module.exports = n;

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
      {}
    );

    const auth = await n.db.use("_users").get("_design/_auth");
    auth.validate_doc_update = usersDocValidation.toString();
    n.db.use("_users").insert(auth);
  } catch (e) {
    throw new Error("Failed to setup CouchDB");
  }
};
