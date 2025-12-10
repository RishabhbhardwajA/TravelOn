const Listing = require("../model/listing.js");

// Keywords for categories
const CATEGORY_KEYWORDS = {
    "trending": ["trend", "popular", "hot", "top"],
    "rooms": ["room", "private", "stay"],
    "iconic": ["iconic", "famous", "landmark"],
    "mountains": ["mountain", "hill", "trek", "hike", "peak", "elevation"],
    "castles": ["castle", "palace", "fort", "royal"],
    "pools": ["pool", "swim", "water", "dive"],
    "camping": ["camp", "tent", "outdoor", "nature"],
    "farms": ["farm", "agri", "rural", "field"],
    "arctic": ["arctic", "snow", "ice", "cold", "winter"],
    "domes": ["dome", "round", "bubble"],
    "boats": ["boat", "ship", "cruise", "water", "lake", "sea"]
};

module.exports.chatBot = async (req, res) => {
    try {
        const { message } = req.body;
        const lowerMsg = message.toLowerCase();

        let query = {};
        let responseText = "";
        let intentFound = false;

        // 1. Check for Greetings
        if (lowerMsg.match(/\b(hi|hello|hey|yo|start)\b/)) {
            return res.json({
                response: "Hello! I'm Genie 🧞‍♂️. I can help you find the perfect place. Try saying 'Find me a villa with a pool' or 'Show listings in Goa'.",
                listings: []
            });
        }

        // 2. Extract Price Constraints (e.g., "under 5000", "below 2000", "cheap")
        const priceMatch = lowerMsg.match(/(?:under|below|less than)\s?(\d+)/);
        if (priceMatch) {
            query.price = { $lte: parseInt(priceMatch[1]) };
            intentFound = true;
        } else if (lowerMsg.includes("cheap") || lowerMsg.includes("budget")) {
            query.price = { $lte: 3000 }; // Default definition of "cheap"
            intentFound = true;
        } else if (lowerMsg.includes("luxury") || lowerMsg.includes("expensive")) {
            query.price = { $gte: 10000 };
            intentFound = true;
        }

        // 3. Extract Category Keywords
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some(keyword => lowerMsg.includes(keyword)) || lowerMsg.includes(category.toLowerCase())) {
                query.category = { $regex: category, $options: "i" };
                intentFound = true;
                break; // Prioritize one category
            }
        }

        // 4. Extract Location (Simple heuristics - looks for capitalized words or common locations)
        // This is basic; for better results, we'd regex against known DB locations.
        // For now, let's try to match against known locations in DB if possible, 
        // OR just search the query string in location/country fields if no other intent found.

        if (!intentFound || (!query.category && !query.price)) {
            // General text search if no specific filters found, or combined with filters
            query.$or = [
                { location: { $regex: lowerMsg, $options: "i" } },
                { country: { $regex: lowerMsg, $options: "i" } },
                { title: { $regex: lowerMsg, $options: "i" } }
            ];
            intentFound = true;
        }

        // Fetch Listings
        const listings = await Listing.find(query).limit(5);

        // Generate Response
        if (listings.length > 0) {
            const count = listings.length;
            const location = listings[0].location;

            if (query.price && query.category) {
                responseText = `I found ${count} ${query.category.replace(/[^a-zA-Z]/g, "")} listings for you within that budget!`;
            } else if (query.category) {
                responseText = `Here are some amazing ${query.category.replace(/[^a-zA-Z]/g, "")} places I found!`;
            } else if (query.price) {
                responseText = `Found these budget-friendly options for you!`;
            } else {
                responseText = `Here is what I found for "${message}". Check these out!`;
            }
        } else {
            responseText = "I looked everywhere but couldn't find an exact match 😕. Try searching for 'Pools', 'Mountains', or a specific location like 'Mumbai'.";
        }

        res.json({
            response: responseText,
            listings: listings.map(l => ({
                id: l._id,
                title: l.title,
                image: l.image.url,
                price: l.price,
                location: l.location
            }))
        });

    } catch (err) {
        console.error("Bot Error:", err);
        res.status(500).json({ response: "My brain is foggy today ☁️. Please try again later.", listings: [] });
    }
};
