import dotenv from "dotenv";
dotenv.config();
import express from "express";

import auth from "./routes/auth";
import posts from "./routes/posts";

const app = express();

// main middlwares
app.use(express.json());

// variables
const PORT = process.env.PORT || 5000;

// routes
app.use("/auth", auth);
app.use("/posts", posts);

app.listen(PORT, () => console.log(`listening on PORT: ${PORT}`));
