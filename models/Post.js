const postCollection = require('../config/db').db().collection('posts');
const ObjectId = require('mongodb').ObjectId;

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
		createDate: new Date(),
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
			postCollection
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

module.exports = Post;