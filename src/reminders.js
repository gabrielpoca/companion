const { format, set, isAfter, isBefore } = require("date-fns");

const PushNotifications = require("./pushNotifications");
const db = require("./database");
const config = require("./config");

const getRemindersID = () => format(new Date(), "yyyy/MM/dd");

const getRemindersDB = async () => {
  try {
    await db.create("reminders");
  } catch (e) {
    console.log("reminders database already exists");
  }

  return db.use("reminders");
};

const isTimeToRun = () => {
  const start = set(new Date(), {
    hours: config.reminders.start.hour,
    minutes: 0
  });
  const finish = set(new Date(), {
    hours: config.reminders.finish.hour,
    minutes: 0
  });
  const current = new Date();

  return isAfter(current, start) && isBefore(current, finish);
};

const didAlreadyRun = async remindersDB => {
  try {
    await remindersDB.get(getRemindersID());
    return true;
  } catch (e) {
    if (e.statusCode === 404) return false;
    else throw e;
  }
};

const handleUserDatabase = async dbName => {
  const userDB = db.use(dbName);

  try {
    const found = await userDB.get("journalReminders");

    if (found && found.values && found.values.enabled)
      await PushNotifications.send(found.values.token);
  } catch (e) {
    if (e.statusCode !== 404) console.error(e);
  }
};

const run = async () => {
  const remindersDB = await getRemindersDB();

  if (!isTimeToRun()) return;
  if (await didAlreadyRun(remindersDB)) return;

  const allDbs = await db.list();

  await Promise.all(
    allDbs.filter(l => l.startsWith("userdb-")).map(handleUserDatabase)
  );

  return await remindersDB.insert({}, getRemindersID());
};

const start = () => {
  run();
  return setInterval(run, 1000 * 60 * 60); // every hour
};

module.exports.start = start;
module.exports.getRemindersID = getRemindersID;
module.exports.run = run;
