const Admin = require("../models/admin");
const sendEmail = require("../nodemailer/index");
const waitingList = require("../models/waitinglist");
const User = require("../models/users");
const Book = require("../models/books");
const Books = require("../models/books");

module.exports.renderRegisterForm = (req, res) => {
  res.render("admin/register");
};

module.exports.renderLoginForm = (req, res) => {
  res.render("admin/login");
};

module.exports.login = (req, res) => {
  const redirectUrl = req.session.returnTo || "/admin/dashboard";
  delete req.session.returnTo;
  req.session.admin = true;
  req.session.collegeid = req.body.collegeid;
  res.redirect(redirectUrl);
};

module.exports.renderWaitingListPage = async (req, res) => {
  const list = await waitingList.find({}).populate('user').populate('book');
  res.render('admin/waitingList', { list });
};

module.exports.approveRequest = async (req, res) => {
  const collegeid = req.session.collegeid;
  const bookid = req.params.bookid;
  const userid = req.params.userid;
  const deleteditem = await waitingList.findOneAndDelete({ collegeid: collegeid, user: userid, book: bookid });
  // console.log("item deleted");
  const user = await User.findById(userid);
  const book = await Book.findById(bookid);
  const newBook = {
    bookid: bookid
  };
  const updateBookArray = await User.updateOne({ _id: userid }, { $push: { books_borrowed: newBook } });
  const updateUserArray = await Book.updateOne({ _id: bookid }, { $push: { users: userid } });
  sendEmail(user.email, `Your request for the book ${book.title} was approved!`);
  req.flash("success", "The request was approved!");
  res.redirect("/admin/manage-requests");
};

module.exports.renderdashboard = async (req, res) => {
  const collegeid = req.session.collegeid;
  const numOfBooks = await Books.countDocuments({collegeid: collegeid});
  const numOfUsers = await User.countDocuments({collegeid: collegeid});
  const blacklists = await User.find({ collegeid: collegeid, isBlacklisted: true });
  const borrowedbooks = await Books.find({collegeid: collegeid}).populate('users');
  res.render("admin/librarian-dashboard", { numOfBooks, numOfUsers, blacklists, borrowedbooks });
};

module.exports.rendermanagebooks = async (req, res) => {
  const collegeid = req.session.collegeid;
  const books = await Books.find({collegeid: collegeid});
  res.render("admin/manage-books", { books });
};

module.exports.rendermanagerequests = async (req, res) => {
  const list = await waitingList.find({}).populate('user').populate('book');
  res.render("admin/manage-requests", { list });
};

module.exports.rendermanagesections = (req, res) => {
  res.render("admin/manage-sections");
};

module.exports.rendermanagestudents = (req, res) => {
  res.render("admin/manage-students");
};

module.exports.renderoverduebooks = async (req, res) => {
  const collegeid = req.session.collegeid;
  const today = new Date();
  const users = await User.find({
    collegeid: collegeid,
    'books_borrowed.returnAt': { $lt: today },
    isBlacklisted: false,
  });
  res.render("admin/overdue-books", { users });
};

module.exports.renderrequestbooks = async (req, res) => {
  const collegeid = req.session.collegeid;
  const list = await waitingList.find({collegeid: collegeid}).populate('user').populate('book');
  res.render("admin/request-book", { list });
};

module.exports.addbook = async (req, res) => {
  const { title, ISBN, author, cat } = req.body;
  const authors = [author];
  const category = [cat];
  const addbook = await Books.insertMany({ title, ISBN, authors, category });
  if (addbook) {
    req.flash("success", "added the book successfully");
    res.redirect("/admin/manage-books");
  }
};


module.exports.search = async (req,res) => {
  const collegeid = req.session.collegeid;
  const { search } = req.body;
  const searchCriteria = {
    collegeid: collegeid,
  };

  if (search) {
    searchCriteria.title = { $regex: search, $options: 'i' }; // Case-insensitive regex search on title
  }

  const books = await Book.find(searchCriteria);

  res.render("admin/manage-books", { books });
}