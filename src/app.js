const express = require("express");
require("dotenv").config();
require("./db/connection");
const userRouter = require("./Routes/userRouter");
// const { productRouter } = require("./Routes/productRouter");
const cors = require("cors");
const shopAdminRouter = require("./Routes/shopAdminRouter");
const adminRouter = require("./Routes/adminRouter");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));
const PORT = process.env.PORT || 8000;

app.use("/api/users", userRouter);
app.use("/api/shop-admin", shopAdminRouter);
app.use("/api/admin", adminRouter);
// app.use("/api/products", productRouter);

app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});
