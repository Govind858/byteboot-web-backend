const mongoose = require('mongoose');
const dns = require('dns');

// This forces Node.js to use Google's DNS, which correctly resolves MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      family: 4, // Force IPv4
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // No process.exit(1) here so nodemon doesn't keep crashing in a loop if it fails
  }
};

module.exports = connectDB;
