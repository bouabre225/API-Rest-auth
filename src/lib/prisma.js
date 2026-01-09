if (process.env.NODE_ENV === 'test') {
  module.exports = require('./prisma.mock');
} else {
  require('dotenv').config();
  const { PrismaClient } = require('@prisma/client');
  module.exports = new PrismaClient();
}
