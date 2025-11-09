const { Router } = require("express");
const healthRoutes = require("./health.routes");

const router = Router();

// Mount all routes
router.use("/health", healthRoutes);

module.exports = router;
