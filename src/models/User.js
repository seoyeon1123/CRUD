const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// UserSchema 생성
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // createAt,updateAt 자동 생성
  }
);

const User = mongoose.model('User', userSchema);
module.exports = User;
