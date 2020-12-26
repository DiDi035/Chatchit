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
app.use(express.static("public"));

app.get("/chatroom", (req, res) => {
  if (curQueueChatRoom.length == 0) {
    const newIdRoom = uuidV4();
    curQueueChatRoom.push(newIdRoom);
    res.redirect("/chatroom/" + newIdRoom);
  } else {
    let roomID = curQueueChatRoom.pop();
    res.redirect("/chatroom/" + roomID);
  }
});

app.get("/chatroom/:roomID", (req, res) => {
  const { roomID } = req.params;
  res.render("MainPage", { roomID });
});

app.get("/", (req, res) => {
  res.render("WelcomePage");
});

app.get("/select", (req, res) => {
  res.render("StartView");
});

app.post("/disconnected", (req, res) => {
  res.json({
    redirect: true,
    redirect_url: "http://localhost:3000/select",
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomID, userID) => {
    // console.log("vo dc day roi ne");
    socket.join(roomID);
    socket.to(roomID).broadcast.emit("user-connected", userID);
    socket.on("disconnect", () => {
      console.log("DIS ROI KIA BA");
      socket.to(roomID).broadcast.emit("user-disconnected", userID);
    });
  });
});

server.listen(3000);
