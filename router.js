const express = require('express');
const router = express.Router();
const userController = require('./controllers/userControllers');
const postController = require('./controllers/postControllers');

// user related routes
router.get('/', userController.home);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// profile related route
router.get('/profile/:username', userController.ifUserExists, userController.profilePostsScreen);

// post related routes
router.get('/create-post', userController.mustBeLoggedIn, postController.viewCreateScreen);
router.post('/create-post', userController.mustBeLoggedIn, postController.createPost);
router.get('/post/:id', postController.viewSingle);

module.exports = router;
