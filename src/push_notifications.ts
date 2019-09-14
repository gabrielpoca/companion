import Admin from "firebase-admin";
import assert from "assert";

assert(!!process.env.FIREBASE_DB);

Admin.initializeApp({
  credential: Admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DB
});

export const send = (title: string, body: string, token: string) =>
  Admin.messaging().send({
    notification: { title, body },
    token
  });
