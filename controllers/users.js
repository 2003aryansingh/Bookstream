const User = require("../models/users");
const sendEmail = require("../nodemailer/index");
const Books = require("../models/books");
const waitingList = require("../models/waitinglist");

module.exports.renderRegisterForm = (req, res) => {
  res.render("users/student-register");
};

module.exports.renderLoginForm = (req, res) => {
  res.render("users/login");
};

module.exports.registerUser = async (req, res) => {
  try {
    const { collegeid, email, username, password, dept, phone} = req.body;
    const user = await User.findOne({collegeid: collegeid, username: username});
    if(user) {
      req.flash("error","User already exists with following credentials");
      return res.redirect("/user/register");
    }
    const newUser = new User({collegeid, email, username, dept, phone});
    await newUser.setPassword(password);
    await newUser.save();

    req.login(newUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to Bookstream!");
      req.session.user = true;
      req.session.username = newUser.username;
      req.session.collegeid = collegeid;
      res.redirect("/user/dashboard");
    });
  } catch (error) {
    req.flash("error", error.message);
    res.redirect("/user/register");
  }
};

module.exports.login = (req, res) => {
  req.flash("success", "Welcome Back!");
  const redirectUrl = req.session.returnTo || "/user/dashboard";
  delete req.session.returnTo;
  req.session.user = true;
  req.session.username = req.body.username;
  req.session.collegeid = req.body.collegeid;
  res.redirect(redirectUrl);
};

module.exports.renderDashboard = async (req,res)=>{
  const collegeid = req.session.collegeid;
  const user = await User.findById(req.user._id);
  const list = await waitingList.find({ collegeid: collegeid, type: "Approval", user: req.user._id }).populate('book');
  const { id } = req.params;
  const book = await Books.findById(id);
  const books = await Books.find({collegeid});
  const numOfBooks = await Books.countDocuments({collegeid});
  res.render('users/dashboard', { numOfBooks, books, book, user, list } );
};


module.exports.renderBooksPage = async (req,res)=>{
  const { title } = req.body;
  const filterObj = {};
  filterObj.title = new RegExp(title, 'i');
  const books = await Books.find(filterObj);
  res.render('users/books', { books });
};

// module.exports.renderShowBooksPage = async (req, res)=>{
//   const user = await User.findById(req.user._id);
//   const list = await waitingList.find({ user: req.user._id }).populate('book');
//   const { id } = req.params;
//   const book = await Books.findById(id);
//   res.render('users/showbooks', { book, user, list });
// };

module.exports.requestBook = async(req,res) =>{
  const collegeid = req.session.collegeid;
  const bookid = req.params.id; 
  const userid = req.user._id;
  const list = await waitingList.insertMany([{type: "Approval", collegeid: collegeid, user: userid, book: bookid}]);
  if(list) {
    req.flash("success", "Your request was made !");
    res.redirect("/user/dashboard");
  } else {
    res.flash("error", "Error processing request");
    res.redirect("/user/dashboard");
  }
};


module.exports.renderReturnBooks = async (req,res) => {
  const collegeid = req.session.collegeid;
  const user = await User.findById(req.user._id).populate("books_borrowed.bookid");
  const list = await waitingList.find({ collegeid: collegeid, type: "Confirmation", user: req.user._id }).populate('book');
  const { id } = req.params;
  const book = await Books.findById(id);
  const books = await Books.find({collegeid});
  const numOfBooks = await Books.countDocuments({collegeid});
  res.render("users/return-book", { numOfBooks, books, book, user, list });
};

module.exports.search = async (req,res) => {
  const collegeid = req.session.collegeid;
  const { search } = req.body;
  const username = req.session.username;
  const user = await User.findById(req.user._id);
  const list = await waitingList.find({ type: "Approval", user: req.user._id }).populate('book');
  const { id } = req.params;
  const book = await Books.findById(id);
  const numOfBooks = await Books.countDocuments({collegeid});
  const searchCriteria = {
    collegeid: collegeid,
  };

  if (search) {
    searchCriteria.title = { $regex: search, $options: 'i' }; // Case-insensitive regex search on title
  }

  const books = await Books.find(searchCriteria);

  res.render("users/dashboard", { numOfBooks, books, book, user, list, username });
};

module.exports.returnBook = async (req,res) => {
  
  const collegeid = req.session.collegeid;
  const bookid = req.params.id; 
  const userid = req.user._id;
  const list = await waitingList.insertMany([{type: "Confirmation", collegeid: collegeid, user: userid, book: bookid}]);
  if(list) {
    req.flash("success", "Book return request was made !");
    res.redirect("/user/return-books");
  } else {
    res.flash("error", "Error processing request ;(");
    res.redirect("/user/return-books");
  }
}

