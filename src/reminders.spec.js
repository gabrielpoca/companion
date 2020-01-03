import "jasmine";
import { getMinutes, getHours } from "date-fns";
import dbs from "./database/index.js";
import * as reminders from "./reminders.js";
import * as PushNotifications from "./pushNotifications.js";

describe("run", () => {
  beforeEach(async () => {
    const dbNames = await dbs.list();
    await Promise.all(
      dbNames
        .filter(
          dbName =>
            ["_global_changes", "_replicaor", "reminders"].indexOf(dbName) ===
            -1
        )
        .map(dbName => dbs.destroy(dbName))
    );

    try {
      await dbs.create("reminders");
    } catch (e) {}

    const reminders = await dbs.use("reminders");

    reminders.list({ include_docs: true }).then(body => {
      body.rows.forEach(doc => {
        reminders.destroy(doc.doc._id, doc.doc._rev);
      });
    });
  });

  it("it sends a push notification", async () => {
    spyOn(PushNotifications, "send").and.returnValue(Promise.resolve(true));

    const endpoint = "1345";
    const userdb = await createUserDatabase();

    insertJournalReminder(userdb, {
      endpoint,
      hour: getHours(new Date()),
      minute: getMinutes(new Date())
    });

    await reminders.run();

    expect(PushNotifications.send).toHaveBeenCalledWith(
      `{endpoint:"${endpoint}"}`
    );
  });

  it("it doesn't send a push notification if it's not time to run", async () => {
    spyOn(PushNotifications, "send").and.returnValue(Promise.resolve(true));

    const userdb = await createUserDatabase();
    insertJournalReminder(userdb, {
      hour: getHours(new Date()),
      minute: getMinutes(new Date()) + 31
    });

    await reminders.run();

    expect(PushNotifications.send).not.toHaveBeenCalled();
  });

  it("it doesn't send a push notification if it already sent one today", async () => {
    spyOn(PushNotifications, "send").and.returnValue(Promise.resolve(true));

    const dbName = "userdb-1234";
    const userdb = await createUserDatabase(dbName);

    insertJournalReminder(userdb, {
      hour: getHours(new Date()),
      minute: getMinutes(new Date())
    });

    const remindersDB = await dbs.use("reminders");
    await remindersDB.insert({}, reminders.getTodayUserReminderID(dbName));

    await reminders.run();

    expect(PushNotifications.send).not.toHaveBeenCalled();
  });
});

async function createUserDatabase(optName) {
  const name =
    optName ||
    `userdb-${Math.random()
      .toString()
      .replace(".", "")}`;
  await dbs.create(name);
  return dbs.use(name);
}

function insertJournalReminder(db, opts) {
  const { hour, minute, endpoint } = opts;

  return db.insert(
    {
      enabled: true,
      subscription: `{endpoint:"${endpoint || 1234}"}`,
      time: {
        hour,
        minute
      }
    },
    "journalReminder"
  );
}
