const healthCheck = (req, res) => {
  res.send("App is running...");
};

module.exports = { healthCheck };
