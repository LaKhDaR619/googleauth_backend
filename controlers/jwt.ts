import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { refreshTokens } from "../routes/auth";

export const generateAccessToken = (data: { username: string }): string => {
  try {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) throw new Error("No Secret found");

    return jwt.sign(data, secret, { expiresIn: "10s" });
  } catch ({ message }) {
    console.error(message);
    throw new Error(message);
  }
};

export const generateRefreshToken = (data: { username: string }) => {
  try {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error("No Secret found");

    return jwt.sign(data, secret, { expiresIn: "1w" });
  } catch ({ message }) {
    console.error(message);
    throw new Error(message);
  }
};

// jwt middleware
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!token) return res.sendStatus(401);
  if (!secret) return res.sendStatus(500);

  try {
    const decoded = jwt.verify(token, secret);
    const user = { username: (decoded as any).username };

    const secondsToExpire = (decoded as any).exp - Date.now() / 1000;

    // refreshing the token if it expires in less than 30 seconds
    if (secondsToExpire < 30) {
      // creating the tokens
      const token = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // TODO: find a way to remove the old refresh token

      res.set("new-access-token", token);
      res.set("new-refresh-token", newRefreshToken);

      refreshTokens.push(newRefreshToken);
    }

    res.locals.user = user;
    next();
  } catch ({ message }) {
    console.log(message);
    if (message === "jwt expired") {
      res.set("should-refresh-tokens", message);
      return res.status(401).send({ message });
    }

    res.sendStatus(500);
  }
};
