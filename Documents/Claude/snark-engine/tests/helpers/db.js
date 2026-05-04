require('dotenv').config({ path: '.env.test' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST });

async function setupTestDb() {
  const schema = fs.readFileSync(path.join(__dirname, '../../db/schema.sql'), 'utf8');
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pool.query(schema);
}

async function teardownTestDb() {
  await pool.end();
}

async function clearTable(name) {
  await pool.query(`DELETE FROM ${name}`);
}

module.exports = { setupTestDb, teardownTestDb, clearTable };
