
import mysql from 'mysql2/promise';

// Database configuration - ideally from environment variables
// For this exercise, using the requested direct values.
const dbConfig = {
  host: process.env.DB_HOST || 'localhost', // User can override with env var
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // No password as requested
  database: process.env.DB_NAME || 'sms',
  waitForConnections: true,
  connectionLimit: 20, // Increased limit for a larger app
  queueLimit: 0,
  dateStrings: true, // Important to get dates as strings
  timezone: '+00:00', // Recommended for consistency
};

let pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log("MySQL Connection Pool created successfully.");

  // Test connection
  pool.getConnection()
    .then(connection => {
      console.log(`Successfully connected to MySQL database '${dbConfig.database}' on ${dbConfig.host} as ${dbConfig.user}.`);
      connection.release();
    })
    .catch(err => {
      console.error("FATAL: Failed to connect to MySQL database during pool initialization test:", err);
      console.error("Please ensure MySQL server is running and credentials/database name are correct.");
      // process.exit(1); // Consider exiting if DB is critical for startup
    });

} catch (error) {
  console.error("FATAL: Error creating MySQL connection pool:", error);
  // process.exit(1);
}

export default pool;
