import { set, format, isAfter, isBefore } from "date-fns";

import * as PushNotifications from "./pushNotifications.js";
import db from "./database/index.js";

export const getTodayUserReminderID = dbName =>
  format(new Date(), `yyyy/MM/dd`) + dbName;

const isTimeToRun = (hour, minute) => {
  const start = set(new Date(), {
    hours: hour,
    minutes: minute - 30
  });
  const finish = set(new Date(), {
    hours: hour,
    minutes: minute + 30
  });

  const current = new Date();

  return isAfter(current, start) && isBefore(current, finish);
};

const didAlreadyRunForUser = async (dbName, remindersDB) => {
  try {
    await remindersDB.get(getTodayUserReminderID(dbName));
    return true;
  } catch (e) {
    if (e.statusCode === 404) return false;
    else throw e;
  }
};

const sendUserPushNotification = async pushNotification => {
  const { subscription, enabled, time } = pushNotification;

  if (!subscription || !enabled || !time) return;

  if (!isTimeToRun(time.hour, time.minute)) return;

  await PushNotifications.send(subscription);
};

const handleUserDatabase = async (dbName, remindersDB) => {
  const userDB = db.use(dbName);

  try {
    const found = await userDB.get("journalReminder");

    if (!found) return;
    if (await didAlreadyRunForUser(dbName, remindersDB)) return;

    await sendUserPushNotification(found);
    await remindersDB.insert({}, getTodayUserReminderID(dbName));
  } catch (e) {
    if (e.statusCode !== 404) console.error(e);
  }
};

export const run = async () => {
  const remindersDB = await db.use("reminders");

  const allDbs = await db.list();

  await Promise.all(
    allDbs
      .filter(l => l.startsWith("userdb-"))
      .map(dbName => handleUserDatabase(dbName, remindersDB))
  );
};

export const start = () => {
  run();
  return setInterval(run, 1000 * 60 * 60); // every hour
};
