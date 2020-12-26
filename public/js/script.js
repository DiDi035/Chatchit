const videoGrid = document.getElementById("video-grid");
const socket = io("/");

const myPeer = new Peer(undefined, {
  host: "/",
  port: 3001,
});

faceapi.nets.tinyFaceDetector.loadFromUri("/models");

socket.on("user-disconnected", (userID) => {
  console.log("VO DAY ROI NE");
  $.ajax({
    type: "POST",
    url: "/disconnected",
    success: (res) => {
      if (res.redirect) {
        window.location.href = res.redirect_url;
      }
    },
    error: (request, error) => {
      console.log("Request: " + JSON.stringify(request));
    },
  });
});

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
  video.height = 560;
  video.width = 720;
  const displaySize = {
    width: video.width,
    height: video.height,
  };
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  video.addEventListener("playing", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    console.log(canvas);
    faceapi.matchDimensions(canvas, displaySize);
    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      );
      // console.log(detections[0]);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      if (detections[0] != undefined) {
        const box = detections[0].box;
        const x = box.x;
        const y = box.y;
        const width = box.width;
        const height = box.height;
        const img = new Image();
        img.src = "/images/spider-man.png";
        canvas.getContext("2d").drawImage(img, x, y, width, height);
      }
    }, 100);
    videoGrid.append(video);
    document.body.append(canvas);
  });
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
