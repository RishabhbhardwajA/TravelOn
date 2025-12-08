const User = require("../model/user.js");
const passport = require("passport");

module.exports.signupPage = (req, res) => {
    res.render("listing/userpage/signup.ejs")
};

module.exports.signup = async (req, res, next) => {
    try {
        let { username, email, password } = req.body;
        const NewUser = new User({ username, email });
        const newUser = await User.register(NewUser, password);
        console.log(newUser);
        req.login(newUser, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome to TravelOn");
            res.redirect("/listings");
        })

    }
    catch (e) {
        req.flash("error", e.message);
        res.redirect("/signup")
    }
};

module.exports.loginPage = (req, res) => {
    res.render("listing/userpage/login.ejs")
};

module.exports.login = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {

        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash("error", "Invalid username or password");
            return res.redirect("/login");
        }
        req.login(user, (err) => {
            if (err) {
                return next(err);
            }
            req.flash("success", "Welcome back to TravelOn!");
            req.session.save(() => {
                let redirectUrl = res.locals.redirectUrl || "/listings";
                res.redirect(redirectUrl);
            });
        });
    })(req, res, next);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "You are successfully logged out");
        res.redirect("/login");
    });
};
