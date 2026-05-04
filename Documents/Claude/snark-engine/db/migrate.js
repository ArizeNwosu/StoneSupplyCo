require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./pg');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('[migrate] Schema applied to', process.env.DATABASE_URL || process.env.DATABASE_URL_TEST);
  await pool.end();
}

migrate().catch(err => {
  console.error('[migrate] Error:', err.message);
  process.exit(1);
});
