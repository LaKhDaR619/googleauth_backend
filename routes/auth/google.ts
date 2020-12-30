import express from "express";

import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../controlers/jwt";

import { users, refreshTokens } from "./auth";

// Download your OAuth2 configuration from the Google
const keys = require("../../oauth2.keys.json");

const router = express.Router();

// google
router.get("/", async (req, res) => {
  try {
    // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
    // which should be downloaded from the Google Developers Console. (i might put secrets in env)
    const oAuth2Client = new OAuth2Client(
      keys.web.client_id,
      keys.web.client_secret,
      keys.web.redirect_uris[0]
    );

    // Generate the url that will be used for the consent dialog.
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });

    // sending the google conect screen
    return res.send({ url: authorizeUrl });
  } catch ({ message }) {
    console.error(message);
    res.sendStatus(500);
  }
});

router.get("/callback", async (req, res) => {
  try {
    // creating an oAuthClient
    const oAuth2Client = new OAuth2Client(
      keys.web.client_id,
      keys.web.client_secret,
      keys.web.redirect_uris[0]
    );

    // getting the code from the query string
    const code = req.query.code;
    if (!code) return res.sendStatus(401);
    // getting the tokens from the code
    const tokenResponse = await oAuth2Client.getToken(code.toString());
    oAuth2Client.setCredentials(tokenResponse.tokens);

    // requesting the info needed from google
    const url =
      "https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses";
    const response: any = await oAuth2Client.request({ url });
    console.log(response.data);

    // check the user and if it isn't in the db add it to it, and generate tokens for him
    const givenName = response.data.names[0].givenName;

    const found = users.find((user) => user.username === givenName);
    if (!found) users.push({ username: givenName, password: "" });

    // creating the tokens
    const token = generateAccessToken({ username: givenName });
    const refreshToken = generateRefreshToken({ username: givenName });

    refreshTokens.push(refreshToken);
    res.send({ token, refreshToken });
  } catch ({ message }) {
    console.error(message);
    res.sendStatus(401);
  }
});

export default router;
