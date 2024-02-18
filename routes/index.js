var express = require('express');
var router = express.Router();
const userModel=require("./users");
const complaintModel = require("./complaints")
const passport=require("passport");
const upload=require("./multer");


const localStratergy=require("passport-local");
passport.use(new localStratergy(userModel.authenticate()));


/* GET home page. */
router.get('/', function(req, res, next) {
  return res.render('home', { title: 'Express' });
});




//Register Route
router.post('/register', (req, res) => {
  const { username, email, fullname, rollNo } = req.body;
  const userData = new userModel({ username, email, fullName: fullname, rollNo});

  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
       return res.redirect("home");
      });
    })
    .catch(function (err) {
      // Handle any registration errors here
      console.error("Registration error:", err);
      return res.redirect("/register"); // Redirect to a registration error page or form
    });
});


router.get("/login",function(req,res){
  return res.render("login",{});
});

router.get("/register",function(req,res){
  return res.render("register",{});
});


router.get("/registerComplaint", isLoggedIn, function(req,res){
  return res.render("registerComplaint");
});


router.post("/login",passport.authenticate("local",{
  successRedirect:"/profile",
  failureRedirect:"/login",
}) , function(req,res){
  res.redirect('back');
});

router.get("/home",isLoggedIn, async function(req,res){
  // const user=await userModel.findOne({username:req.session.passport.user});
  // res.render('home', {footer: true,user});
  const user = await userModel.findOne({username: req.session.passport.user});
  return res.render("home",{user});
});

router.post('/createComplaint', async function(req, res) {
    const user=await userModel.findOne({username:req.session.passport.user});
  
    const complaint=await complaintModel.create({
      createdBy:user._id,
      title:req.body.title,
      content:req.body.content,
      category:req.body.category,
    })
  
      user.complaints.push(complaint._id);
      await user.save();
      return res.redirect('/allcomplaint');
      // res.json(complaint);
  });

  router.get("/allcomplaint", isLoggedIn, async function(req, res) {
    const complaints = await complaintModel.find().populate("createdBy");
    // const complaints = await complaintModel.find().populate({ path: 'createdBy', select: 'username' });


    // console.log("req.session:", req.session);
    // console.log("req.session.passport:", req.session.passport);
    // console.log("req.session.passport.user:", req.session.passport.user);


    const user = await userModel.findOne({username: req.session.passport.user }).populate("complaints");
    return res.render('allcomplaint',{user, complaints}); // Pass 'user' object here
});


router.get("/profile", isLoggedIn, async function(req,res){
  const user = await userModel.findOne({username: req.session.passport.user}).populate("complaints");
  return res.render("profile",{user});
});

router.get("/newcomplaint", isLoggedIn, async function(req,res){
  res.render("newcomplaint");
  return res.render("newcomplaint");
});


router.get("/logout",function(req,res){
  req.logout(function(err){
    if(err){ return next(err); }
    return res.redirect("/login");
  });
});



function isLoggedIn(req, res, next) {
  
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
  return res.redirect("/login");
}





router.post('/update',upload.single('image'), async function(req, res) {
  const user=await userModel.findOneAndUpdate(
    {username:req.session.passport.user},
    {new:true}
    );

    user.profileImage=req.file.filename;
    await user.save();
    return res.redirect('/profile');
});


router.get('/complaint/:id', async (req, res) => {
  try {
    const complaint = await complaintModel.findById(req.params.id);
    if (!complaint) {
      return res.status(404).send('Complaint not found');
    }

    // Render the complaint details page with the complaint data
    res.render('complaintDetails', { complaint});
  } catch (error) {
    console.error('Error retrieving complaint details:', error);
    return res.status(500).send('Internal Server Error');
  }
});


router.get('/user/:id', async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).populate("complaints");
    if (!user) {
      return res.status(404).send('Complaint not found');
    }

    // Render the complaint details page with the complaint data
    return res.render('userProfile', { user});
  } catch (error) {
    console.error('Error retrieving complaint details:', error);
    return res.status(500).send('Internal Server Error');
  }
});



  
  // Server-side route to render the next page and display the selected option
router.get('/next-page', (req, res) => {
  const selectedOption = req.session.selectedOption;
  res.render('newcomplaint', {selectedOption});
});
router.post('/store-option', (req, res) => {
  const selectedOption = req.body.selectedOption;
  req.session.selectedOption = selectedOption;
  res.sendStatus(200); // Send a success response
});


module.exports = router;
