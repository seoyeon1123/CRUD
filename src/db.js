const mongoose = require('mongoose');

const MONGO_URI =
  'mongodb+srv://lsy0906:iqPF0DhVNm6WytGV@cluster0.ddjdras.mongodb.net/mydatabase';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB 연결됨');
  } catch (err) {
    console.error('MongoDB 연결 오류:', err);
  }
};

module.exports = connectDB;
