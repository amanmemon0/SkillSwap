const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const dbConnection = await mongoose.connect(process.env.DATABASE_URI);
    console.log(`Database connected: ${dbConnection.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;