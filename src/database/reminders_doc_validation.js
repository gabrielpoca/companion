module.exports = function(newDoc, oldDoc, userCtx) {
  if (userCtx.roles.indexOf("_admin") === -1) {
    throw { forbidden: "Only admins may perform this action." };
  }

  return true;
};
