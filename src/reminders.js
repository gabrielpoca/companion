const PushNotifications = require("./push_notifications");
const db = require("./database");

module.exports.run = async () => {
  const list = await n.db.list();
  return await Promise.all(
    list
      .filter(l => l.startsWith("userdb-"))
      .map(async dbName => {
        const db = n.use(dbName);

        try {
          const found = await db.get("journalReminders");

          PushNotifications.send("new message", "body", found.value);
        } catch (e) {
          if (e.statusCode !== 404) console.error(e);
        }
      })
  );
};
