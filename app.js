const express = require("express");
const connectDB = require("./src/config/connection");

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import all routes
const routes = require("./src/routes");
const errorHandler = require("./src/middlewares/error.middleware");

app.use("/", routes);

// Error handling middleware (must be after all routes)
app.use(errorHandler);

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
