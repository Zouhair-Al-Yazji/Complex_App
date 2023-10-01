const Post = require('../models/Post');

exports.viewCreateScreen = (req, res) => {
	res.render('create-post');
};

exports.createPost = (req, res) => {
	let post = new Post(req.body, req.session.user._id);
	post
		.create()
		.then(() => {
			res.send('New Post Created.');
		})
		.catch((errors) => {
			res.send(errors);
		});
};

exports.viewSingle = async (req, res) => {
	try {
		let post = await Post.findSingleById(req.params.id, req.visitorId);
		res.render('single-post-screen', { post: post });
	} catch (error) {
		res.status(404).render('404');
	}
};
