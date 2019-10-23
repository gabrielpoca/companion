const Admin = require("firebase-admin");
const assert = require("assert");

assert(process.env.FIREBASE_DB);

Admin.initializeApp({
  credential: Admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DB
});

module.exports.send = token =>
  Admin.messaging().send({
    data: { type: "reminder" },
    token
  });
