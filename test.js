const catchAsync = require("./catchAsync");
const Ticket = require("./tesModel");

exports.test = catchAsync(async (req, res) => {
  const tickets = await Ticket.find();
  res.status(200).json({
    status: "Success",
    data: {
      tickets,
    },
  });
});
