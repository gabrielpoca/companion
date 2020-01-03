import Nano from "nano";
import axios from "axios";
import assert from "assert";
import url from "url";

import usersDocValidation from "./users_doc_validation.js";
import remindersDocValidation from "./reminders_doc_validation.js";

assert(process.env.COUCHDB_URL);
assert(process.env.COUCHDB_USER);
assert(process.env.COUCHDB_PASSWORD);

const couchUrl = url.parse(process.env.COUCHDB_URL);
couchUrl.auth = `${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}`;

const n = Nano(couchUrl.format());

export default n.db;

export const setup = async () => {
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
    await n.db.create("reminders");
  } catch (e) {
    console.log("reminders database already exists");
  }

  try {
    const auth = await n.db.use("reminders").get("_design/_auth");
    auth.validate_doc_update = remindersDocValidation.toString();
    n.db.use("reminders").insert(auth);
  } catch {
    n.db.use("reminders").insert({
      _id: "_design/_auth",
      validate_doc_update: remindersDocValidation.toString()
    });
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
