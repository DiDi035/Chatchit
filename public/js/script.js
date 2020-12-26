const videoGrid = document.getElementById("video-grid");
const socket = io("/");

const myPeer = new Peer(undefined, {
  host: "/",
  port: 3001,
});

socket.on("user-disconnected", (userID) => {});

const myVideo = document.createElement("video");
myVideo.muted = true;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    AddVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        AddVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (newUserID) => {
      ConnectToNewUser(newUserID, stream);
    });
  })
  .catch((err) => {
    console.error(err);
  });

myPeer.on("open", (userID) => {
  socket.emit("join-room", ROOM_ID, userID);
});

const AddVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
};

const ConnectToNewUser = (newUserID, stream) => {
  const call = myPeer.call(newUserID, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    AddVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
};
