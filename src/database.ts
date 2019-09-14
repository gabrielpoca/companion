import Nano from "nano";

const nano = Nano("http://admin:admin@localhost:5984");

export { nano as n };
