const firstVideo = document.getElementById("firstVideo");
const secondVideo = document.getElementById("secondVideo");
const isModeFirst = true;
const isModeSecond = false;
const videoWrapperFirst = document.getElementById("videoWrapperFirst");
const videoWrapperSecond = document.getElementById("videoWrapperSecond");

const startVideo = () => {
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: true,
    })
    .then((stream) => {
      AddVideoStream(firstVideo, stream, isModeFirst, videoWrapperFirst);

      myPeer.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (userVideoStream) => {
          AddVideoStream(
            secondVideo,
            userVideoStream,
            isModeSecond,
            videoWrapperSecond
          );
        });
      });

      socket.on("user-connected", (newUserID) => {
        ConnectToNewUser(newUserID, stream);
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

const socket = io("/");

const myPeer = new Peer(undefined, {
  host: "/",
  port: 3001,
});

Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri("/models")]).then(
  startVideo
);

socket.on("user-disconnected", (userID) => {
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

myPeer.on("open", (userID) => {
  socket.emit("join-room", ROOM_ID, userID);
});

const AddVideoStream = (video, stream, isMode, wrapper) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  if (isMode) {
    const displaySize = {
      width: video.width,
      height: video.height,
    };
    video.addEventListener("playing", () => {
      const canvas = faceapi.createCanvasFromMedia(video);
      canvas.width = displaySize.width;
      wrapper.append(canvas);
      // document.body.append(canvas);
      faceapi.matchDimensions(canvas, displaySize);
      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        );
        if (MODE != "Normal" && detections[0] != undefined) {
          const box = detections[0].box;
          // console.log(box);
          const x = box.x;
          const y = box.y;
          const width = box.width;
          const height = box.height;
          const img = new Image();
          if (MODE == "Super-hero") img.src = "/images/spider-man.png";
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          canvas
            .getContext("2d")
            .drawImage(img, x + 20, y - 20, width + 40, height + 40);
        }
      }, 100);
    });
  }
};

const ConnectToNewUser = (newUserID, stream) => {
  const call = myPeer.call(newUserID, stream);
  call.on("stream", (userVideoStream) => {
    AddVideoStream(
      secondVideo,
      userVideoStream,
      isModeSecond,
      videoWrapperSecond
    );
  });
  call.on("close", () => {
    video.remove();
  });
};
