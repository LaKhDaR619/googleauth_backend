import express from "express";

// our DB
const posts = [{ title: "news" }, { title: "drama" }];

const app = express.Router();

app.get("/", async (req, res) => {
  res.send(posts);
});

export default app;
