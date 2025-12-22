import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // ✅ References User._id
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  modes: {
    military: { type: Boolean, default: false },
    disaster: { type: Boolean, default: false },
    delivery: { type: Boolean, default: false },
    surveillance: { type: Boolean, default: false },
    agricultural: { type: Boolean, default: false },
    recreational: { type: Boolean, default: false }
  },
  subscription: {
    duration: { type: Number, default: 3 },
    startDate: { type: Date },
    endDate: { type: Date },
    isActive: { type: Boolean, default: false }
  },
  queries: [{
    question: String,
    answer: String,
    progress: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
  }],
  userType: {
    type: String,
    enum: ['super_operator', 'operator', 'client'],
    required: true
  }
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
export default UserProfile;