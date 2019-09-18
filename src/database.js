const Nano = require("nano");
const assert = require("assert");

assert(process.env.COUCHDB_URL);

module.exports = Nano(process.env.COUCHDB_URL);
