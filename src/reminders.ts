import * as PushNotifications from "./push_notifications";
import { n } from "./database";

interface Setting {
  id: string;
  value: string;
}

export const run = async () => {
  const list = await n.db.list();
  return await Promise.all(
    list
      .filter((l: string) => l.startsWith("userdb-"))
      .map(async (dbName: string) => {
        const db = n.use(dbName);

        try {
          const found = ((await db.get(
            "journalReminders"
          )) as unknown) as Setting;

          PushNotifications.send("new message", "body", found.value);
        } catch (e) {
          if (e.statusCode !== 404) console.error(e);
        }
      })
  );
};
