const { exec } = require("child_process");

// Load .env
const dotenv = require("dotenv");
dotenv.config();

// Express
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());

// Socket
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// JWT
const jwt = require("jsonwebtoken");

// Gapi
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env["GOOGLE_SECRET"]);

// MongoDB
const { MongoClient, ServerApiVersion } = require("mongodb");
const client = new MongoClient(process.env["MONGO_URI"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
const client2 = new MongoClient(process.env["MONGO_URI2"], {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

let pixelArray, boardCollection;
const usersCollection = client.db("main").collection("users");

// how do I RESET THIS?
const placedCollection = client2.db("main").collection("placed");

const allowedUsers = [];

client.connect(async (err) => {
  if (err) {
    console.log(err);
    exec("kill 1");
    process.exit(1);
  }

  boardCollection = client.db("board").collection("pixels");

  const board = await boardCollection.findOne({ _id: "latestBoard" });
  try {
    pixelArray = board.pixelArray;
  } catch (err) {
    pixelArray = Array(50).fill(Array(50).fill(32));
    await boardCollection.updateOne(
      { _id: "latestBoard" },
      { $set: { _id: "latestBoard", pixelArray } },
      { upsert: true }
    );
  }
});

client2.connect();

const renderIndex = (req, res) => {
  if (!pixelArray) {
    // Retry render in 3s
    return setTimeout(() => {
      renderIndex(req, res);
    }, 3000);
  }
  res.render("board", {
    canvasHeight: pixelArray.length * 10,
    canvasWidth: pixelArray[0].length * 10,
  });
};

app.get("/", renderIndex);

const verifyjwt = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_KEY);
  } catch {
    return null;
  }
};

app.post("/", async (req, res) => {
  let token = req.body.token;
  let user = null;

  try {
    if (!token) return res.status(405).send("Unauthorized.");

    const verified = verifyjwt(token);
    if (!verified) return res.status(405).send("Unauthorized.");

    user = await usersCollection.findOne({
      username: verified.username,
    });
    if (!user) return res.status(405).send("Unauthorized.");

    user = { ...user, _id: user._id.toString() };
  } catch (err) {
    return res.status(405).send(err);
  }

  let cooldown;

  if (user) {
    cooldown = user.cooldown;
  } else {
    console.log("fix this later");
    cooldown = Date.now();
    usersCollection.insertOne({
      _id: userPayload.sub,
      name: userPayload.name,
      cooldown: cooldown,
      picture: userPayload.picture,
      ip: req.header("x-forwarded-for"),
    });
  }

  res.send({ cooldown: cooldown });
});

app.post("/placepixel", async (req, res) => {
  let token = req.body.token;
  let user = null;

  try {
    if (!token) return res.status(405).send("Unauthorized.");

    const verified = verifyjwt(token);
    if (!verified) return res.status(405).send("Unauthorized.");

    user = await usersCollection.findOne({
      username: verified.username,
    });

    if (!user) return res.status(405).send("Unauthorized.");

    user = { ...user, _id: user._id.toString() };
  } catch (err) {
    return res.status(405).send(err);
  }

  let cooldown;

  if (user) {
    cooldown = user.cooldown;
  } else {
    return res.status(405).send("Not a registered user!");
  }

  if (cooldown < Date.now()) {
    try {
      pixelArray[req.body.selectedY][req.body.selectedX] = parseInt(
        req.body.selectedColor,
        10
      );
    } catch (err) {
      return res.sendStatus(403);
    }

    io.emit("pixelUpdate", {
      x: req.body.selectedX,
      y: req.body.selectedY,
      color: req.body.selectedColor,
      pixelArray: pixelArray,
      u: user._id,
    });

    const cooldown = allowedUsers.includes(user.username)
      ? 10
      : Date.now() + 8000;
    res.send({ cooldown: cooldown });

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { cooldown: cooldown } }
    );

    let _id = `${req.body.selectedX}${req.body.selectedY}`;
    const pixel = await placedCollection.findOne({ _id });
    if (!pixel) {
      placedCollection.insertOne({
        _id,
        p: [{ c: req.body.selectedColor, u: user._id }],
      });
    } else {
      placedCollection.updateOne(
        { _id },
        { $push: { p: { c: req.body.selectedColor, u: user._id } } }
      );
    }
  } else {
    return res.status(403).send({ cooldown: cooldown });
  }
});

app.get("/about", (req, res) => {
  res.redirect("https://en.wikipedia.org/wiki/R/place");
});

app.post("/user", async (req, res) => {
  const user = await usersCollection.findOne({ _id: req.body.id });
  if (user) {
    res.json({ username: user.username });
  } else {
    res.json({});
  }
});

app.post("/pixel", async (req, res) => {
  const pixel = await placedCollection.findOne({
    _id: `${req.body.x}${req.body.y}`,
  });

  if (!pixel) {
    return res.sendStatus(404);
  }

  res.json(pixel.p[pixel.p.length - 1]);
});

const sendPixelArray = (socket) => {
  if (typeof pixelArray !== "undefined") {
    if (socket) {
      socket.emit("canvasUpdate", { pixelArray: pixelArray });
    }
  } else {
    setTimeout(() => {
      sendPixelArray(socket);
    }, 250);
  }
};

io.on("connection", sendPixelArray);

setInterval(() => {
  if (pixelArray) {
    boardCollection.updateOne({ _id: "latestBoard" }, { $set: { pixelArray } });
  }
}, 5000);

server.listen(8080, () => {
  console.log("Listening on port 8080\nhttp://localhost:8080");
});
