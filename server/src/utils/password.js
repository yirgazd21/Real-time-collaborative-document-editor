const bcrypt = require('bcrypt');

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d@$!%*?&]{8,}$/;

const validatePasswordStrength = (password) =>
  PASSWORD_REGEX.test(password);

const hashPassword = async (password) =>
  bcrypt.hash(password, 12);

const comparePassword = async (candidatePassword, hashedPassword) =>
  bcrypt.compare(candidatePassword, hashedPassword);

module.exports = {
  validatePasswordStrength,
  hashPassword,
  comparePassword,
};