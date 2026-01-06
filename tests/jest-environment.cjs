const NodeEnvironment = require('jest-environment-node').TestEnvironment;
const path = require('path');

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    // Set environment variables BEFORE calling super
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
    process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;
    
    super(config, context);
    
    // Prevent localStorage initialization error
    this.global.localStorage = undefined;
    
    // Also set in global context
    this.global.process.env.NODE_ENV = 'test';
    this.global.process.env.JWT_SECRET = 'votre_secret_jwt_de_32_caracteres_minimum';
    this.global.process.env.DATABASE_URL = `file:${path.resolve(process.cwd(), 'test.db')}`;
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }
}

module.exports = CustomEnvironment;
