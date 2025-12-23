const Booking = require("../model/booking.js");
const Listing = require("../model/listing.js");

// Check if Razorpay is configured
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
        const Razorpay = require("razorpay");
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        console.log("✅ Razorpay initialized successfully");
    } catch (err) {
        console.error("❌ Razorpay initialization failed:", err.message);
    }
} else {
    console.log("⚠️ Running in MOCK PAYMENT mode (Razorpay keys not found)");
}

// ============== RENDER BOOKING PAGE ==============
module.exports.renderBookingPage = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate listing ID
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            req.flash("error", "Invalid listing ID");
            return res.redirect("/listings");
        }

        const listing = await Listing.findById(id).populate("owner");
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        // Get already booked dates
        const existingBookings = await Booking.find({
            listing: id,
            status: { $in: ["confirmed", "pending"] },
            checkOut: { $gte: new Date() }
        });

        const bookedDates = existingBookings.map(b => ({
            from: b.checkIn.toISOString().split("T")[0],
            to: b.checkOut.toISOString().split("T")[0]
        }));

        res.render("listing/booking.ejs", {
            listing,
            bookedDates,
            mockMode: !razorpay
        });
    } catch (err) {
        console.error("❌ renderBookingPage error:", err);
        req.flash("error", "Something went wrong. Please try again.");
        res.redirect("/listings");
    }
};

// ============== CHECK AVAILABILITY ==============
module.exports.checkAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut } = req.body;

        // Validate inputs
        if (!checkIn || !checkOut) {
            return res.json({ available: false, error: "Please select both dates" });
        }

        const start = new Date(checkIn);
        const end = new Date(checkOut);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.json({ available: false, error: "Invalid date format" });
        }

        if (start >= end) {
            return res.json({ available: false, error: "Check-out must be after check-in" });
        }

        if (start < new Date().setHours(0, 0, 0, 0)) {
            return res.json({ available: false, error: "Cannot book past dates" });
        }

        // Check for overlapping bookings
        const overlap = await Booking.findOne({
            listing: id,
            status: { $in: ["confirmed", "pending"] },
            $or: [
                { checkIn: { $lt: end }, checkOut: { $gt: start } }
            ]
        });

        if (overlap) {
            return res.json({ available: false, error: "These dates are already booked" });
        }

        return res.json({ available: true });
    } catch (err) {
        console.error("❌ checkAvailability error:", err);
        return res.json({ available: false, error: "Error checking availability" });
    }
};

// ============== CREATE ORDER ==============
module.exports.createOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, guests, totalPrice, specialRequests } = req.body;

        // Validate
        if (!checkIn || !checkOut || !totalPrice) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.json({ success: false, message: "Listing not found" });
        }

        // Prevent self-booking
        if (listing.owner.equals(req.user._id)) {
            return res.json({ success: false, message: "You cannot book your own listing" });
        }

        const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

        // Create booking
        const newBooking = new Booking({
            listing: id,
            guest: req.user._id,
            host: listing.owner,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            guests: guests || { adults: 1, children: 0 },
            totalPrice,
            nights,
            specialRequests: specialRequests || "",
            status: "pending"
        });

        await newBooking.save();
        console.log("✅ Booking created:", newBooking._id);

        // If Razorpay configured, create real order
        if (razorpay) {
            try {
                const order = await razorpay.orders.create({
                    amount: totalPrice * 100,
                    currency: "INR",
                    receipt: `booking_${newBooking._id}`
                });

                newBooking.payment.razorpayOrderId = order.id;
                await newBooking.save();

                return res.json({
                    success: true,
                    orderId: order.id,
                    keyId: process.env.RAZORPAY_KEY_ID,
                    bookingId: newBooking._id,
                    mockMode: false
                });
            } catch (err) {
                console.error("❌ Razorpay order creation failed:", err);
                return res.json({ success: false, message: "Payment initialization failed" });
            }
        } else {
            // Mock Mode
            return res.json({
                success: true,
                bookingId: newBooking._id,
                amount: totalPrice * 100,
                mockMode: true
            });
        }
    } catch (err) {
        console.error("❌ createOrder error:", err);
        return res.json({ success: false, message: err.message || "Booking creation failed" });
    }
};

// ============== VERIFY PAYMENT ==============
module.exports.verifyPayment = async (req, res) => {
    try {
        const { bookingId, razorpayPaymentId, razorpaySignature, mockPayment } = req.body;

        if (!bookingId) {
            return res.json({ success: false, message: "Booking ID required" });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        // Update booking status
        booking.status = "confirmed";
        booking.payment.razorpayPaymentId = razorpayPaymentId || "mock_" + Date.now();
        booking.payment.status = "success";
        await booking.save();

        console.log("✅ Payment verified for booking:", bookingId);
        req.flash("success", "Booking confirmed! Enjoy your trip.");

        return res.json({
            success: true,
            redirectUrl: "/bookings/my-bookings"
        });
    } catch (err) {
        console.error("❌ verifyPayment error:", err);
        return res.json({ success: false, message: "Payment verification failed" });
    }
};

// ============== MY BOOKINGS ==============
module.exports.renderMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ guest: req.user._id })
            .populate("listing")
            .populate("host")
            .sort({ createdAt: -1 });

        res.render("listing/my-bookings.ejs", { bookings });
    } catch (err) {
        console.error("❌ renderMyBookings error:", err);
        req.flash("error", "Could not load your bookings");
        res.redirect("/listings");
    }
};

// ============== HOST DASHBOARD ==============
module.exports.renderHostDashboard = async (req, res) => {
    try {
        const bookings = await Booking.find({ host: req.user._id })
            .populate("listing")
            .populate("guest")
            .sort({ createdAt: -1 });

        res.render("listing/host-bookings.ejs", { bookings });
    } catch (err) {
        console.error("❌ renderHostDashboard error:", err);
        req.flash("error", "Could not load host dashboard");
        res.redirect("/listings");
    }
};

// ============== CANCEL BOOKING ==============
module.exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("🚫 Cancel request for booking:", id);

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.json({ success: false, message: "Booking not found" });
        }

        // Check if user owns this booking
        if (booking.guest.toString() !== req.user._id.toString()) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        // Check if booking can be cancelled
        if (booking.status === "cancelled") {
            return res.json({ success: false, message: "Already cancelled" });
        }

        booking.status = "cancelled";
        await booking.save();

        console.log("✅ Booking cancelled:", id);
        return res.json({ success: true, message: "Booking cancelled successfully" });
    } catch (err) {
        console.error("❌ cancelBooking error:", err);
        return res.json({ success: false, message: "Failed to cancel booking" });
    }
};
