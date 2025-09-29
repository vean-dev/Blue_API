// [Section] Modules and Dependencies
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoutes = require("./routes/user");
// const productRoutes = require("./routes/product");
// const cartRoutes = require("./routes/cart");
// const orderRoutes = require("./routes/order");

const port = 4005;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// [Section] MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected on Mongo Database"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/b5/users", userRoutes);

if (require.main === module) {
  app.listen(process.env.PORT || port, () => {
    console.log(`API is now online on port ${process.env.PORT || port}`);
  });
}

module.exports = { app };
