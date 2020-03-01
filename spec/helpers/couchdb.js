import { db } from "../../src/database";
import * as app from "../../src";

jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

global.clearCouchDB = async () => {
  // delete all dbs
  const dbs = await db.list();
  await Promise.all(
    dbs.filter(name => !name.startsWith("_")).map(name => db.destroy(name))
  );

  // clear all users
  const usersDB = db.use("_users");
  const users = await usersDB.list();
  await Promise.all(
    users.rows.map(({ id, value: { rev } }) => usersDB.destroy(id, rev))
  );

  // clear all reminders
  await db.create("reminders");
  const remindersDB = db.use("reminders");
  const reminders = await remindersDB.list();
  await Promise.all(
    reminders.rows.map(({ id, value: { rev } }) => remindersDB.destroy(id, rev))
  );
};

global.startApp = port => app.start(port);
global.stopApp = () => app.stop();
