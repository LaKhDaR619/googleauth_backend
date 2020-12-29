import express from "express";
import jwt from "jsonwebtoken";
import { authenticateToken } from "../controlers/jwt";

// our DB
const posts = [{ title: "news" }, { title: "drama" }];

const app = express.Router();

app.get("/", authenticateToken, async (req, res) => {
  res.send(posts);
});

export default app;
