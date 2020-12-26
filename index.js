const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

const uniStack = {
  HCMUS: [],
  HCMUET: [],
  HCMUE: [],
  HCMUI: [],
};

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/chatroom/:roomID/:mode", (req, res) => {
  const { roomID, mode } = req.params;
  res.render("MainPage", { roomID, mode });
});

app.get("/", (req, res) => {
  res.render("WelcomePage");
});

app.get("/select", (req, res) => {
  res.render("StartView");
});

app.post("/start", (req, res) => {
  const { uni, mode } = req.body;
  if (uniStack[uni].length == 0) {
    const newIdRoom = uuidV4();
    uniStack[uni].push(newIdRoom);
    res.redirect("/chatroom/" + newIdRoom + "/" + mode);
  } else {
    let roomID = uniStack[uni].pop();
    res.redirect("/chatroom/" + roomID + "/" + mode);
  }
});

app.post("/disconnected", (req, res) => {
  res.json({
    redirect: true,
    redirect_url: "http://localhost:3000/select",
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomID, userID) => {
    socket.join(roomID);
    socket.to(roomID).broadcast.emit("user-connected", userID);
    socket.on("disconnect", () => {
      socket.to(roomID).broadcast.emit("user-disconnected", userID);
    });
  });
});

server.listen(3000);
