import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  contactNo: String,
  age: Number,
  password: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    enum: ['super_operator', 'operator', 'client'],
    default: 'client'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

const User = mongoose.model('User', userSchema);
export default User;