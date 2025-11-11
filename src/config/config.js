const dbConfig = {
  connectionString:
    "mongodb+srv://prithwichanda1996_db_user:ItPNoQoYxPaTD2IE@cluster0.2qbugcq.mongodb.net/devTinder",
};

const jwtConfig = {
  secret: "devTinder_secret_key_2024", // Change this to a secure secret in production
  expiresIn: "7d", // Token expires in 7 days
};

module.exports = { dbConfig, jwtConfig };
