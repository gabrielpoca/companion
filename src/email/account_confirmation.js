import mjml2html from "mjml";
import fs from "fs";
import path from "path";

const template = fs.readFileSync(
  path.join(__dirname, "../../src/email/account_confirmation.mjml")
);

module.exports.build = token => {
  return mjml2html(template.replace("%TOKEN", token));
};
