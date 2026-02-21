// models/Delivery.js
import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  deliveryId: {
    type: String,
    // required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId, // ✅ REFERENCES User._id
        ref: "User",
        required: true,
        index: true
  },
  pickupLocation: {
    type: locationSchema,
    required: true
  },
  deliveryLocation: {
    type: locationSchema,
    required: true
  },
  productDetails: {
    type: String, // e.g., "Medical supplies: Insulin pack, 2 units"
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'], // e.g., 'emergency' for medical
    default: 'medium',
    index: true // Compound index potential with status for sorting
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
    index: true // For fast filtering by status
  },
  assignedOperatorId: {
    type: String,
    default: null
  },
  eta: {
    type: Number, // Estimated minutes
    default: null
  },
  notes: {
    type: String, // e.g., "Fragile medical item, handle with care"
    default: ''
  },
  cancellationReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // For chronological queries
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for high-performance queries: e.g., get pending emergencies by user or globally
deliverySchema.index({ userId: 1, status: 1, priority: -1 }); // Sort by priority descending for urgent first
deliverySchema.index({ status: 1, priority: -1, createdAt: 1 }); // Global pending list, prioritized and timed

// Pre-save middleware to generate unique deliveryId (e.g., DEL-YYYYMMDD-XXXX)
deliverySchema.pre('save', function(next) {
  if (!this.deliveryId) {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.deliveryId = `DEL-${datePrefix}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }
  this.updatedAt = new Date();
  next();
});

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;