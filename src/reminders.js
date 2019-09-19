const { format, set, isAfter } = require("date-fns");

const PushNotifications = require("./push_notifications");
const db = require("./database");

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
  const target = set(new Date(), { hours: 21, minutes: 0 });
  const current = new Date();

  return isAfter(current, target);
};

const didAlreadyRun = async () => {
  try {
    await remindersDB.get(getRemindersID());
    return true;
  } catch (e) {
    return false;
  }
};

const handleUserDatabase = async dbName => {
  const userDB = db.use(dbName);

  try {
    const found = await userDB.get("journalReminders");

    await PushNotifications.send("new message", "body", found.value);
  } catch (e) {
    if (e.statusCode !== 404) console.error(e);
  }
};

const run = async () => {
  const remindersDB = await getRemindersDB();

  if (!isTimeToRun()) return;
  if (await didAlreadyRun()) return;

  console.log("sending reminders");

  const allDbs = await db.db.list();

  await Promise.all(
    allDbs.filter(l => l.startsWith("userdb-")).map(handleUserDatabase)
  );

  return await remindersDB.insert({}, getRemindersID());
};

module.exports.start = () => {
  return setInterval(run, 1000 * 60 * 60); // every hour
};
