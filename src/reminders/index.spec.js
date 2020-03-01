import "jasmine";
import { getMinutes, getHours } from "date-fns";

import { db as dbs } from "../database";
import * as reminders from "./index";
import * as pushNotifications from "./pushNotifications";

describe("run", () => {
  beforeEach(async () => {
    await clearCouchDB();
    spyOn(pushNotifications, "send").and.returnValue(Promise.resolve(true));
  });

  it("sends a push notification", async () => {
    const endpoint = "1345";
    const userdb = await createUserDatabase();

    insertJournalReminder(userdb, {
      endpoint,
      hour: getHours(new Date()),
      minute: getMinutes(new Date())
    });

    await reminders.run();

    expect(pushNotifications.send).toHaveBeenCalledWith(
      `{endpoint:"${endpoint}"}`
    );
  });

  it("doesn't send a push notification if it's not time to run", async () => {
    const userdb = await createUserDatabase();
    insertJournalReminder(userdb, {
      hour: getHours(new Date()),
      minute: getMinutes(new Date()) + 31
    });

    await reminders.run();

    expect(pushNotifications.send).not.toHaveBeenCalled();
  });

  it("doesn't send a push notification if it already sent one today", async () => {
    const dbName = "userdb-1234";
    const userdb = await createUserDatabase(dbName);

    insertJournalReminder(userdb, {
      hour: getHours(new Date()),
      minute: getMinutes(new Date())
    });

    const remindersDB = await dbs.use("reminders");
    await remindersDB.insert({}, reminders.getTodayUserReminderID(dbName));

    await reminders.run();

    expect(pushNotifications.send).not.toHaveBeenCalled();
  });

  it("saves an entry in the reminders database when a push notification is sent", async () => {
    const dbName = "userdb-1234";
    const userdb = await createUserDatabase(dbName);

    insertJournalReminder(userdb, {
      hour: getHours(new Date()),
      minute: getMinutes(new Date())
    });

    const remindersDB = await dbs.use("reminders");

    await reminders.run();

    expect(pushNotifications.send).toHaveBeenCalled();
    expect(
      (await remindersDB.get(reminders.getTodayUserReminderID(dbName)))._id
    ).toBeTruthy();
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
