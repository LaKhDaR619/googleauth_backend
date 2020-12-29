import express from "express";
import jwt from "jsonwebtoken";

import {
  authenticateToken,
  generateAccessToken,
  generateRefreshToken,
} from "../controlers/jwt";

// our DB
const users = [
  { username: "lakhdar", password: "1234" },
  { username: "younes", password: "4321" },
];

// TODO: replace with redis cash

export const refreshTokens: string[] = [];

const app = express.Router();

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // authenticating user
  // checking if username and pass provided
  if (!username)
    return res
      .status(400)
      .send({ field: "username", message: "please provide a user name" });
  if (!password)
    return res
      .status(400)
      .send({ field: "username", message: "please provide a password" });

  const found = users.find(
    (user) => user.username === username && user.password === password
  );

  if (!found)
    return res.status(401).send({ message: "no user with this info" });
  // end authentication

  try {
    // creating the tokens
    const token = generateAccessToken({ username });
    const refreshToken = generateRefreshToken({ username });

    refreshTokens.push(refreshToken);
    res.send({ token, refreshToken });
  } catch ({ message }) {
    console.error(message);
    res.sendStatus(500);
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  // checking if username and pass provided
  if (!username || !password) return res.sendStatus(400);

  // checking if username isn't already in the DB
  const found = users.find((user) => user.username === username);

  if (found) return res.status(401).json("user already exists");

  // all good push to db
  users.push({ username, password });

  res.sendStatus(201);
});

// logout

// refresh the token
app.post("/token", (req, res) => {
  const refreshToken = req.body.token;
  const secret = process.env.REFRESH_TOKEN_SECRET;

  if (!refreshToken) return res.sendStatus(401);
  if (!secret) return res.sendStatus(500);

  // the refresh token isn't in our cashed tokens
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  refreshTokens.filter((token) => token !== refreshToken);

  try {
    const decoded = jwt.verify(refreshToken, secret);
    const username = (decoded as any).username;

    // creating the tokens
    const token = generateAccessToken({ username });
    const newRefreshToken = generateRefreshToken({ username });

    refreshTokens.push(newRefreshToken);
    res.send({ token, refreshToken: newRefreshToken });
  } catch ({ message }) {
    console.error(message);
    res.sendStatus(403);
  }
});

// checking if the user is logged in
app.get("/check", authenticateToken, async (req, res) => {
  res.status(200).json({ message: "You are logged In" });
});

export default app;
