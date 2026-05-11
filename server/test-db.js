const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'neuronix',
  ssl: false,
});

async function test() {
  try {
    await client.connect();
    console.log('✅ PostgreSQL connected successfully');

    const res = await client.query('SELECT NOW()');
    console.log(res.rows);

    await client.end();
  } catch (err) {
    console.error('❌ Connection failed');
    console.error(err);
  }
}

test();