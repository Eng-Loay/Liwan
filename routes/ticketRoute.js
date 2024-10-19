const express = require("express");
const ticketController = require("../controllers/ticketController");
const router = express.Router();

router.route("/").get(ticketController.getAll);

module.exports = router;
