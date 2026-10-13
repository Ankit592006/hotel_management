const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartserve';
    console.log(`Connecting to MongoDB Atlas / Database...`);
    
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 8000,
      autoIndex: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host} (DB: ${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error('Make sure MONGODB_URI in backend/.env is set to your MongoDB Atlas connection string.');
    // Do not terminate process immediately so health-check and mock endpoints can report status cleanly
    return null;
  }
};

module.exports = connectDB;
