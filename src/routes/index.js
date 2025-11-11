const { Router } = require("express");
const healthRoutes = require("./health.routes");
const userRoutes = require("./user.routes");

const router = Router();

// Mount all routes
router.use("/health", healthRoutes);
router.use("/api/users", userRoutes);

module.exports = router;
