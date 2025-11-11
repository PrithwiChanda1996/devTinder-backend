const express = require("express");
const connectDB = require("./src/db/connection");

const app = express();
const port = 3000;

// Import all routes
const routes = require("./src/routes");

app.use("/", routes);

// Connect to database and start server
const startServer = async () => {
  try {
    // Establish database connection
    await connectDB();

    // Start Express server after successful DB connection
    app.listen(port, () => {
      console.log(`Server is running on ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the application
startServer();
