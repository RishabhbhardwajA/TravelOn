const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
        required: true
    },
    guest: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    host: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    checkIn: {
        type: Date,
        required: true
    },
    checkOut: {
        type: Date,
        required: true
    },
    guests: {
        adults: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        children: {
            type: Number,
            min: 0,
            default: 0
        }
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    nights: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    specialRequests: {
        type: String,
        maxlength: 500
    },
    payment: {
        razorpayOrderId: String,
        razorpayPaymentId: String,
        status: {
            type: String,
            enum: ["pending", "success", "failed"],
            default: "pending"
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for faster queries
bookingSchema.index({ listing: 1, status: 1 });
bookingSchema.index({ guest: 1 });
bookingSchema.index({ host: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
