'use strict';
const User = require('../models/User');
const Post = require('../models/Post');

exports.mustBeLoggedIn = (req, res, next) => {
	if (req.session.user) {
		next();
	} else {
		req.flash('errors', 'You must be logged in to perform this action.');
		req.session.save(() => res.redirect('/'));
	}
};

exports.login = (req, res) => {
	let user = new User(req.body);
	user
		.login()
		.then((foundUser) => {
			req.session.user = {
				avatar: foundUser.avatar,
				username: foundUser.username,
				_id: foundUser._id,
			};
			req.session.save(() => res.redirect('/'));
		})
		.catch((err) => {
			req.flash('errors', err);
			req.session.save(() => res.redirect('/'));
		});
};

exports.logout = (req, res) => {
	req.session.destroy(() => res.redirect('/'));
};

exports.register = async (req, res) => {
	let user = new User(req.body);
	user
		.register()
		.then(() => {
			req.session.user = {
				avatar: user.avatar,
				username: user.data.username,
				_id: user.data._id,
			};
			req.session.save(() => res.redirect('/'));
		})
		.catch((regErrors) => {
			regErrors.forEach((error) => {
				req.flash('regErrors', error);
			});
			req.session.save(() => res.redirect('/'));
		});
};

exports.home = (req, res) => {
	if (req.session.user) {
		res.render('home-dashboard');
	} else {
		res.render('home-guest', {
			errors: req.flash('errors'),
			regErrors: req.flash('regErrors'),
		});
	}
};

exports.ifUserExists = (req, res, next) => {
	User.findByUsername(req.params.username)
		.then((userDocument) => {
			req.profileUser = userDocument;
			next();
		})
		.catch(() => {
			res.status(404).render('404');
		});
};

exports.profilePostsScreen = (req, res) => {
	// asks our post modal for posts by a certain author id
	Post.findByAuthorId(req.profileUser._id)
		.then((posts) => {
			res.render('profile', {
				posts: posts,
				profileUsername: req.profileUser.username,
				profileAvatar: req.profileUser.avatar,
			});
		})
		.catch(() => {
			res.status(404).render('404');
		});
};
