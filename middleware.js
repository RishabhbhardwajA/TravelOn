module.exports.isLoggedIn= (req,res,next)=> {
    console.log(req.user);
    if(!req.isAuthenticated()){
    req.flash("error","You must logged be in");
   return res.redirect("/login");
  }
  next();
}