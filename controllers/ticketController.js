const Ticket = require("../models/ticketModel");
const catchAsync = require("../utils/catchAsync");

exports.getAll = catchAsync(async (req, res) => {
  const tickets = await Ticket.find();

  res.status(200).json({
    status: "Success",
    results: tickets.length,
    data: {
      tickets,
    },
  });
});
