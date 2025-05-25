import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product"
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryMethod: {
    type: String,
    required: true,
    enum: ["pickup", "home"]
  },
  deliveryDetails: {
    pickupTime: String,
    address: String,
    phone: String
  },
  specialInstructions: String,
  status: {
    type: String,
    required: true,
    enum: ["pending", "processing", "accepted", "shipped", "out_for_delivery", "delivered", "rejected", "cancelled", "delayed", "paid"],
    default: "pending"
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  estimatedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: Date,
  delayReason: String,
  trackingId: {
    type: String,
    unique: true
  },
  deliveryPartnerType: {
    type: String,
    enum: ["farmer", "third_party"],
    default: "farmer"
  },
  deliveryPartnerDetails: {
    name: String,
    contact: String,
    trackingUrl: String
  }
}, { timestamps: true });

// Generate tracking ID before saving
orderSchema.pre('save', function(next) {
  if (!this.trackingId) {
    this.trackingId = 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
