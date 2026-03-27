require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started successfully");
    console.log(`Running on port: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
});