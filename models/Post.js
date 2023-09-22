const postsCollection = require('../config/db').db().collection('posts');
const ObjectId = require('mongodb').ObjectId;
const User = require('./User');

let Post = function (data, userId) {
	this.data = data;
	this.errors = [];
	this.userId = userId;
};

Post.prototype.cleanUp = function () {
	if (typeof this.data.title !== 'string') {
		this.data.title = '';
	}

	if (typeof this.data.body !== 'string') {
		this.data.body = '';
	}

	// get rid of any bogus properties
	this.data = {
		title: this.data.title.trim(),
		body: this.data.body.trim(),
		createdDate: new Date(),
		author: new ObjectId(this.userId),
	};
};

Post.prototype.validate = function () {
	if (this.data.title === '') {
		this.errors.push('You must provide a title.');
	}

	if (this.data.body === '') {
		this.errors.push('You must provide a post content.');
	}
};

Post.prototype.create = function () {
	return new Promise((resolve, reject) => {
		this.cleanUp();
		this.validate();
		if (!this.errors.length) {
			// save post into database
			postsCollection
				.insertOne(this.data)
				.then(() => {
					resolve();
				})
				.catch((error) => {
					this.errors.push(`Please try again later, ${error}.`);
					reject(this.errors);
				});
		} else {
			reject(this.errors);
		}
	});
};

Post.findSingleById = function (id) {
	return new Promise(async (resolve, reject) => {
		if (typeof id !== 'string' || !ObjectId.isValid(id)) {
			reject();
			return;
		}
		// Aggregate is great when you need to perform complex or multiple operations. (db operations)
		// Now aggregate is going to return data that makes sense from a MongoDB perspective, but maybe not just
		// from a plain JavaScript perspective.
		let posts = await postsCollection
			.aggregate([
				// So dollar sign Match will tell MongoDB that that's what we want to do.
				// is basically describing documents that we want to match with.
				// Okay, so that's our first operation. We're performing a match by the requested ID.
				{ $match: { _id: new ObjectId(id) } },
				/*
				So currently we are within the posts collection, but what we want to do here is look up
				documents from another collection, right?
				Remember, our ultimate goal here is to pull in the relevant user account document so that we can
				access its user name and email address for gravatars.
				we're currently in the posts collection and now we're saying the document that we want to
				look up should be pulled from the user's collection.
				So this is saying when we're looking in the user's collection for matching documents, the local field or the field from within the current post item that we want to perform that match on is the author field,
				So local means the current collection, that's the post collection, foreign means. The other collection that we're trying to look up within the field in those documents that we want to perform the lookup or match on is the ID field.

				*/
				{
					$lookup: {
						from: 'users',
						localField: 'author',
						foreignField: '_id',
						as: 'authorDocument',
					},
				},
				// So what project does is it allows us to spell out exactly what fields we want the resulting object
				// to have.
				{
					$project: {
						title: 1,
						body: 1,
						createdDate: 1,
						author: { $arrayElemAt: ['$authorDocument', 0] },
					},
				},
			])
			.toArray();
		// clean up author property in each post object
		posts = posts.map((post) => {
			post.author = {
				username: post.author.username,
				avatar: new User(post.author, true).avatar,
			};
			return post;
		});
		if (posts.length) {
			resolve(posts[0]);
		} else {
			reject();
		}
	});
};

module.exports = Post;
