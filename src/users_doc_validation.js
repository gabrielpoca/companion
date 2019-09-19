module.exports = function(newDoc, oldDoc, userCtx, secObj) {
  if (newDoc._deleted === true) {
    // allow deletes by admins and matching users
    // without checking the other fields
    if (userCtx.roles.indexOf("_admin") !== -1 || userCtx.name == oldDoc.name) {
      return;
    } else {
      throw { forbidden: "Only admins may delete other user docs." };
    }
  }

  if (newDoc.type !== "user") {
    throw { forbidden: "doc.type must be user" };
  } // we only allow user docs for now

  if (!newDoc.name) {
    throw { forbidden: "doc.name is required" };
  }

  if (!newDoc.roles) {
    throw { forbidden: "doc.roles must exist" };
  }

  if (!isArray(newDoc.roles)) {
    throw { forbidden: "doc.roles must be an array" };
  }

  for (var idx = 0; idx < newDoc.roles.length; idx++) {
    if (typeof newDoc.roles[idx] !== "string") {
      throw { forbidden: "doc.roles can only contain strings" };
    }
  }

  if (newDoc._id !== "org.couchdb.user:" + newDoc.name) {
    throw {
      forbidden: "Doc ID must be of the form org.couchdb.user:name"
    };
  }

  if (oldDoc) {
    // validate all updates
    if (oldDoc.name !== newDoc.name) {
      throw { forbidden: "Usernames can not be changed." };
    }
  }

  if (newDoc.password_sha && !newDoc.salt) {
    throw {
      forbidden:
        "Users with password_sha must have a salt." +
        "See /_utils/script/couch.js for example code."
    };
  }

  var available_schemes = ["simple", "pbkdf2", "bcrypt"];
  if (
    newDoc.password_scheme &&
    available_schemes.indexOf(newDoc.password_scheme) == -1
  ) {
    throw {
      forbidden:
        "Password scheme `" + newDoc.password_scheme + "` not supported."
    };
  }

  if (newDoc.password_scheme === "pbkdf2") {
    if (typeof newDoc.iterations !== "number") {
      throw { forbidden: "iterations must be a number." };
    }
    if (typeof newDoc.derived_key !== "string") {
      throw { forbidden: "derived_key must be a string." };
    }
  }

  var is_server_or_database_admin = function(userCtx, secObj) {
    // see if the user is a server admin
    if (userCtx.roles.indexOf("_admin") !== -1) {
      return true; // a server admin
    }

    // see if the user a database admin specified by name
    if (secObj && secObj.admins && secObj.admins.names) {
      if (secObj.admins.names.indexOf(userCtx.name) !== -1) {
        return true; // database admin
      }
    }

    // see if the user a database admin specified by role
    if (secObj && secObj.admins && secObj.admins.roles) {
      var db_roles = secObj.admins.roles;
      for (var idx = 0; idx < userCtx.roles.length; idx++) {
        var user_role = userCtx.roles[idx];
        if (db_roles.indexOf(user_role) !== -1) {
          return true; // role matches!
        }
      }
    }

    return false; // default to no admin
  };

  if (!is_server_or_database_admin(userCtx, secObj)) {
    throw { unauthorized: "Only admins can perform updates." };
  }

  // no system roles in users db
  for (var i = 0; i < newDoc.roles.length; i++) {
    if (newDoc.roles[i][0] === "_") {
      throw {
        forbidden: "No system roles (starting with underscore) in users db."
      };
    }
  }

  // no system names as names
  if (newDoc.name[0] === "_") {
    throw { forbidden: "Username may not start with underscore." };
  }

  var badUserNameChars = [":"];

  for (var i = 0; i < badUserNameChars.length; i++) {
    if (newDoc.name.indexOf(badUserNameChars[i]) >= 0) {
      throw {
        forbidden:
          "Character `" + badUserNameChars[i] + "` is not allowed in usernames."
      };
    }
  }
};
