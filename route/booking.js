const express = require("express");
const router = express.Router();
const wrapAsync = require("../error/wrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const bookingController = require("../controller/bookings.js");

// ============== BOOKING PAGE ==============
// GET /bookings/:id/book - Show booking form for a listing
router.get("/:id/book", isLoggedIn, wrapAsync(bookingController.renderBookingPage));

// ============== AVAILABILITY CHECK ==============
// POST /bookings/:id/check-availability - Check if dates are available
router.post("/:id/check-availability", isLoggedIn, wrapAsync(bookingController.checkAvailability));

// ============== CREATE ORDER ==============
// POST /bookings/:id/create-order - Create a booking order (payment)
router.post("/:id/create-order", isLoggedIn, wrapAsync(bookingController.createOrder));

// ============== VERIFY PAYMENT ==============
// POST /bookings/verify-payment - Verify Razorpay or mock payment
router.post("/verify-payment", isLoggedIn, wrapAsync(bookingController.verifyPayment));

// ============== MY BOOKINGS ==============
// GET /bookings/my-bookings - Show user's bookings
router.get("/my-bookings", isLoggedIn, wrapAsync(bookingController.renderMyBookings));

// ============== HOST DASHBOARD ==============
// GET /bookings/host-dashboard - Show host's received bookings
router.get("/host-dashboard", isLoggedIn, wrapAsync(bookingController.renderHostDashboard));

// ============== CANCEL BOOKING ==============
// POST /bookings/:id/cancel - Cancel a booking
router.post("/:id/cancel", isLoggedIn, wrapAsync(bookingController.cancelBooking));

module.exports = router;
