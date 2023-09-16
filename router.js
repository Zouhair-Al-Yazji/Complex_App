const express = require("express");
const router = express.Router();
const userController = require("./controllers/userControllers");
const postController = require("./controllers/postControllers");

// user related route
router.get("/", userController.home);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/logout", userController.logout);

// post related route
router.get("/create-post", userController.mustBeLoggedIn, postController.viewCreateScreen);

module.exports = router;
