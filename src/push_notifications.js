const Admin = require("firebase-admin");
const assert = require("assert");

assert(process.env.FIREBASE_DB);

Admin.initializeApp({
  credential: Admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DB
});

module.exports.send = (title, body, token) =>
  Admin.messaging().send({
    notification: { title, body },
    token
  });
