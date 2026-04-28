const mongoose = require("mongoose");

const seed = async () => {
  const db = mongoose.connection.db;
  await db.collection("test_data").insertOne({ seeded: true, name: "test-second-success" });
};

module.exports = seed;
