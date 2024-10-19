const express = require('express');
const router = express.Router()

const ticketController = require('./test')




router.route('/').get(ticketController.test)



module.exports = router