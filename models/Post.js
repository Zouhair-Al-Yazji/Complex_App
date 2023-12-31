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

Post.reusablePostQuery = function (uniqueOperations, visitorId) {
	return new Promise(async (resolve, reject) => {
		let aggregateOperations = uniqueOperations.concat([
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
					authorId: '$author',
					author: { $arrayElemAt: ['$authorDocument', 0] },
				},
			},
		]);

		let posts = await postsCollection.aggregate(aggregateOperations).toArray();
		// clean up author property in each post object
		posts = posts.map((post) => {
			post.isVisitorOwner = post.authorId.equals(visitorId);
			post.author = {
				username: post.author.username,
				avatar: new User(post.author, true).avatar,
			};
			return post;
		});
		resolve(posts);
	});
};

Post.findSingleById = function (id, visitorId) {
	return new Promise(async (resolve, reject) => {
		if (typeof id !== 'string' || !ObjectId.isValid(id)) {
			reject();
			return;
		}

		let posts = await Post.reusablePostQuery([{ $match: { _id: new ObjectId(id) } }], visitorId);

		if (posts.length) {
			resolve(posts[0]);
		} else {
			reject();
		}
	});
};

Post.findByAuthorId = function (authorId) {
	return Post.reusablePostQuery([{ $match: { author: authorId } }, { $sort: { createdDate: -1 } }]);
};

module.exports = Post;
