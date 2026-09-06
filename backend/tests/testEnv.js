/**
 * Imported first by tests/helpers.js so that NODE_ENV is set to "test" BEFORE
 * src/config.js is evaluated. With ES modules the imports of a file run before
 * its own statements, so this has to live in its own module.
 * In test mode the app uses an in-memory SQLite database.
 */
process.env.NODE_ENV = 'test';
