const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const app = express();

let sessionOptions = session({
	secret: 'Javascript is soo awesome',
	store: MongoStore.create({ client: require('./config/db') }),
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 1000 * 60 * 60 * 24,
		httpOnly: true,
	},
});

app.use(sessionOptions);
app.use(flash());

// When we use app.use we tell the express to use that function on every request
app.use(function (req, res, next) {
	// make current user id available on the req object
	if (req.session.user) {
		req.visitorId = req.session.user._id;
	} else {
		req.visitorId = 0;
	}

	// The res.locals object is an object that can hold data that you want to make available to your view
	// templates (e.g., when rendering HTML views).
	res.locals.user = req.session.user;
	next();
});

const router = require('./router');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(express.static('public'));
app.set('views', 'views');
app.set('view engine', 'ejs');

app.use('/', router);

module.exports = app;
