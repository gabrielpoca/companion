require("jasmine");

const dbs = require("./database");
const reminders = require("./reminders");
const PushNotifications = require("./pushNotifications");
const config = require("./config");

describe("run", () => {
  beforeEach(async () => {
    const dbNames = await dbs.list();

    await Promise.all(
      dbNames
        .filter(
          dbName => ["_global_changes", "_replicaor"].indexOf(dbName) === -1
        )
        .map(dbName => dbs.destroy(dbName))
    );
  });

  it("it sends a push notification", async () => {
    mockTimeToRunNow();
    spyOn(PushNotifications, "send").and.returnValue(Promise.resolve(true));

    const userdb = await createUserDatabase();
    insertJournalReminder("123", userdb);

    await reminders.run();

    expect(PushNotifications.send).toHaveBeenCalledWith("123");
  });

  it("it doesn't send a push notification if it's not time to run", async () => {
    mockTimeToRunLater();
    spyOn(PushNotifications, "send").and.returnValue(Promise.resolve(true));

    const userdb = await createUserDatabase();
    insertJournalReminder("123", userdb);

    await reminders.run();

    expect(PushNotifications.send).not.toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.any(String),
      "123"
    );
  });

  it("it doesn't send a push notification if it already sent one today", async () => {
    mockTimeToRunNow();
    spyOn(PushNotifications, "send").and.returnValue(Promise.resolve(true));

    const userdb = await createUserDatabase();
    insertJournalReminder("123", userdb);

    await dbs.create("reminders");
    const remindersDB = await dbs.use("reminders");
    await remindersDB.insert({}, reminders.getRemindersID());

    await reminders.run();

    expect(PushNotifications.send).not.toHaveBeenCalledWith(
      jasmine.any(String),
      jasmine.any(String),
      "123"
    );
  });
});

function mockTimeToRunNow() {
  const currentHours = new Date().getHours();

  spyOnProperty(config.reminders.start, "hour", "get").and.returnValue(
    currentHours
  );

  spyOnProperty(config.reminders.finish, "hour", "get").and.returnValue(
    currentHours + 1
  );
}

function mockTimeToRunLater() {
  const currentHours = new Date().getHours();

  spyOnProperty(config.reminders.start, "hour", "get").and.returnValue(
    currentHours - 2
  );

  spyOnProperty(config.reminders.finish, "hour", "get").and.returnValue(
    currentHours - 1
  );
}

async function createUserDatabase() {
  await dbs.create("userdb-123");
  return dbs.use("userdb-123");
}

async function insertJournalReminder(token, db) {
  return db.insert({ value: token }, "journalReminders");
}
