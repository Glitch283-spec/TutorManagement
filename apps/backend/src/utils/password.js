const bcrypt = require("bcryptjs");

async function verifyPassword(inputPassword, storedPassword) {
  if (!storedPassword) return false;

  const isBcryptHash =
    storedPassword.startsWith("$2a$") ||
    storedPassword.startsWith("$2b$") ||
    storedPassword.startsWith("$2y$");

  if (isBcryptHash) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  return storedPassword === inputPassword;
}

module.exports = { verifyPassword };
