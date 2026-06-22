const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { pool, getDatabaseConfig } = require('../lib/db');

async function runSchemaInitialization() {
  const schemaPath = path.resolve(__dirname, '../../database/init.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const dbConfig = getDatabaseConfig();

  const connection = await mysql.createConnection(dbConfig);

  try {
    const statements = schemaSql
      .split(';')
      .map((statement) => statement.trim())
      .filter((statement) => statement && !statement.startsWith('--'));

    for (const statement of statements) {
      await connection.query(statement);
    }

    console.log('Database schema initialized');
  } finally {
    await connection.end();
  }
}

async function connectDatabase() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    await runSchemaInitialization();
    console.log('MySQL connected');
    return;
  } catch (error) {
    if (error.code !== 'ER_BAD_DB_ERROR' && error.code !== 'ER_NO_DB_ERROR') {
      throw error;
    }

    const dbConfig = getDatabaseConfig();
    const adminConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    try {
      await adminConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``
      );
    } finally {
      await adminConnection.end();
    }

    const schemaConnection = await pool.getConnection();
    schemaConnection.release();
    await runSchemaInitialization();
    console.log('MySQL connected');
  }
}

async function disconnectDatabase() {
  await pool.end();
}

async function checkDatabaseHealth() {
  await pool.query('SELECT 1');
  return { database: 'ok' };
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
};
