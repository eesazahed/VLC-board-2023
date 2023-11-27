// main

let selectedX;
let selectedY;
let pixelArray, interval;

const coordElement = document.getElementById("pixel");
const ownerElement = document.getElementById("owner");
const placeButton = document.getElementById("placePixel");
const chatInput = document.getElementById("chatInput");
const messages = document.getElementById("messages");

const colors = {
  1: "#6d001a",
  2: "#be0039",
  3: "#ff4500",
  4: "#ffa800",
  5: "#ffd635",
  6: "#fff8b8",
  7: "#00a368",
  8: "#00cc78",
  9: "#7eed56",
  10: "#00756f",
  11: "#009eaa",
  12: "#00ccc0",
  13: "#2450a4",
  14: "#3690ea",
  15: "#51e9f4",
  16: "#493ac1",
  17: "#6a5cff",
  18: "#94b3ff",
  19: "#811e9f",
  20: "#b44ac0",
  21: "#e4abff",
  22: "#de107f",
  23: "#ff3881",
  24: "#ff99aa",
  25: "#6d482f",
  26: "#9c6926",
  27: "#ffb470",
  28: "#000000",
  29: "#515252",
  30: "#898d90",
  31: "#d4d7d9",
  32: "#ffffff",
};

let selectedColor;

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const renderPixels = (pixelArray) => {
  for (let y = 0; y < pixelArray.length; y += 1) {
    for (let x = 0; x < pixelArray[y].length; x += 1) {
      if (pixelArray[y][x] !== 32) {
        ctx.fillStyle = colors[pixelArray[y][x]];
        ctx.fillRect(x * 10, y * 10, 10, 10);
      }
    }
  }
};

const renderPixel = (x, y, color) => {
  ctx.fillStyle = colors[color];
  ctx.fillRect(x * 10, y * 10, 10, 10);
};

const updateColor = (event) => {
  selectedColor = event.target.getAttribute("color");
  new Audio("audio/Select Color.mp3").play();
  showPlaceButton();
};

const showPlaceButton = () => {
  if (typeof selectedX !== "undefined" && selectedColor) {
    placeButton.style.visibility = "visible";
  } else {
    placeButton.style.visibility = "hidden";
  }
};

const renderCrosshair = (selectedX, selectedY) => {
  coordElement.classList.add("show");
  coordElement.innerHTML = `(${selectedX + 1}, ${selectedY + 1})`;

  const x = selectedX * 10;
  const y = selectedY * 10;

  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";

  ctx.fillRect(x + 1, y, 2, 1);
  ctx.fillRect(x, y, 1, 3);

  ctx.fillRect(x + 7, y, 2, 1);
  ctx.fillRect(x + 9, y, 1, 3);

  ctx.fillRect(x, y + 7, 1, 2);
  ctx.fillRect(x, y + 9, 3, 1);

  ctx.fillRect(x + 7, y + 9, 2, 1);
  ctx.fillRect(x + 9, y + 7, 1, 3);

  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";

  ctx.fillRect(x, y - 1, 4, 0.7);
  ctx.fillRect(x - 1, y - 1, 0.7, 5);

  ctx.fillRect(x + 6, y - 1, 4, 0.7);
  ctx.fillRect(x + 10.3, y - 1, 0.7, 5);

  ctx.fillRect(x - 1, y + 6, 0.7, 5);
  ctx.fillRect(x, y + 10.3, 4, 0.7);

  ctx.fillRect(x + 10.3, y + 6, 0.7, 4);
  ctx.fillRect(x + 6, y + 10.3, 5, 0.7);

  showPlaceButton();
};

const unrenderCrosshair = (selectedX, selectedY) => {
  // Old Pixel
  renderPixel(selectedX, selectedY, pixelArray[selectedY][selectedX]);

  // Old Pixel Left
  if (pixelArray[selectedY][selectedX - 1]) {
    renderPixel(selectedX - 1, selectedY, pixelArray[selectedY][selectedX - 1]);
  }

  // Old Pixel Right
  if (pixelArray[selectedY][selectedX + 1]) {
    renderPixel(selectedX + 1, selectedY, pixelArray[selectedY][selectedX + 1]);
  }

  // Old Pixel Up
  if (pixelArray[selectedY - 1]) {
    renderPixel(selectedX, selectedY - 1, pixelArray[selectedY - 1][selectedX]);
  }

  // Old Pixel Down
  if (pixelArray[selectedY + 1]) {
    renderPixel(selectedX, selectedY + 1, pixelArray[selectedY + 1][selectedX]);
  }

  // Old Pixel Top
  if (pixelArray[selectedY - 1]) {
    // Old Pixel Top Right
    if (pixelArray[selectedY - 1][selectedX + 1]) {
      renderPixel(
        selectedX + 1,
        selectedY - 1,
        pixelArray[selectedY - 1][selectedX + 1]
      );
    }

    // Old Pixel Top Left
    if (pixelArray[selectedY - 1][selectedX - 1]) {
      renderPixel(
        selectedX - 1,
        selectedY - 1,
        pixelArray[selectedY - 1][selectedX - 1]
      );
    }
  }

  // Old Pixel Bottom
  if (pixelArray[selectedY + 1]) {
    // Old Pixel Bottom Right
    if (pixelArray[selectedY + 1][selectedX + 1]) {
      renderPixel(
        selectedX + 1,
        selectedY + 1,
        pixelArray[selectedY + 1][selectedX + 1]
      );
    }

    // Old Pixel Bottom Left
    if (pixelArray[selectedY + 1][selectedX - 1]) {
      renderPixel(
        selectedX - 1,
        selectedY + 1,
        pixelArray[selectedY + 1][selectedX - 1]
      );
    }
  }
};

const socket = io();

socket.on("pixelUpdate", (event) => {
  pixelArray = event.pixelArray;
  renderPixel(event.x, event.y, event.color);
  cachedPixels[`${event.x}${event.y}`] = { c: event.color, u: event.u };
});

socket.on("canvasUpdate", (event) => {
  pixelArray = event.pixelArray;
  renderPixels(event.pixelArray);
});

socket.on("chat", (msg) => {
  if (msg) {
    const msgContent = JSON.parse(msg);

    const sender = `@${msgContent.sender}`;
    const textContent = msgContent.textContent;

    const newMsg = document.createElement("p");
    newMsg.className = sender;

    const msgId = messages.childElementCount || 0;

    let msgInnerHTML = `<p style="margin-bottom: 3px"><b>${sender}</b></p><span id="${msgId}"></span>`;

    if (msgId > 0) {
      if (messages.firstElementChild.className === sender) {
        msgInnerHTML = `<span id="${msgId}"></span>`;
      }
    }

    newMsg.innerHTML = msgInnerHTML;
    messages.prepend(newMsg);
    document.getElementById(`${msgId}`).innerText = textContent; // to prevent HTML tags
  }
});

const placePixel = (event) => {
  fetch("/placepixel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: authToken,
      selectedX: selectedX,
      selectedY: selectedY,
      selectedColor: selectedColor,
    }),
  }).then((response) => {
    if (response.status === 200) {
      new Audio("audio/Pixel Placed.mp3").play();
    }
    response.json().then((json) => {
      generateCountdown(placeButton, json.cooldown);
    });
  });
};

const generateCountdown = (element, timestamp) => {
  const enableTime = new Date(timestamp);

  if (interval) clearInterval(interval);

  const timeRemaining = Math.ceil(
    (enableTime.getTime() - new Date().getTime()) / 100
  );

  if (1 > timeRemaining) return

  element.classList.remove("enabled");
  element.innerHTML = "0:09";
  placeButton.disabled = true;

  interval = setInterval(() => {
    const timeRemaining = Math.ceil(
      (enableTime.getTime() - new Date().getTime()) / 1000
    );

    const minute = ~~(timeRemaining / 59.9).toString();
    const second = (timeRemaining % 60).toString();

    element.innerHTML = `${minute.length === 1 ? "0" : ""}${minute}:${second.length === 1 ? "0" : ""
      }${second}`;

    if (1 > timeRemaining) {
      element.classList.add("enabled");
      element.innerHTML = `<i class="fa-sharp fa-solid fa-check"></i>`;
      clearInterval(interval);
      interval = undefined;
      placeButton.disabled = false;

      new Audio("audio/Pixel Ready.mp3").play();
    }
  }, 1000);
};

chatInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const message = {
      textContent: chatInput.value,
      token: authToken,
    };

    socket.emit("chat", JSON.stringify(message));

    chatInput.value = "";
  }
});

// camera

const main = document.getElementById("main");
const zoomElement = document.getElementById("zoom-container");
const board = document.getElementById("board");

let zoom = window.screen.availHeight / (canvas.height * 1.5);
zoomElement.style.transform = `scale(${zoom})`;

let dragging = false;
let currentX = 0;
let currentY = 0;
let initialX, initialY;
let focusTimeout, pixelQueryTimeout;
let cachedUsers = {};
let cachedPixels = {};

const zoom_camera = (event) => {
  const isTouchPad = event.wheelDeltaY
    ? event.wheelDeltaY === -3 * event.deltaY
    : event.deltaMode === 0;

  if (event.deltaY < 0) {
    if (zoom >= 7) return;
    zoomElement.style.transform = `scale(${(zoom += isTouchPad ? 0.1 : 0.5)})`;
  } else {
    if (zoom <= 1) return;
    zoomElement.style.transform = `scale(${(zoom -= isTouchPad ? 0.1 : 0.5)})`;
  }
};

const dragStart = (e) => {
  if (e.type === "touchmove") {
    x = e.touches[0].clientX;
    y = e.touches[0].clientY;
  } else {
    x = e.clientX;
    y = e.clientY;
  }

  initialX = x - currentX * zoom;
  initialY = y - currentY * zoom;

  dragging = true;
  board.classList.add("dragging");
};

const drag = (e) => {
  if (dragging) {
    e.preventDefault();

    const currentNextX = (x - initialX) / zoom;
    const currentNextY = (y - initialY) / zoom;

    const selectedNextX = ~((currentNextX - canvas.width / 2) / 10) + 1;
    const selectedNextY = ~((currentNextY - canvas.height / 2) / 10) + 1;

    let moveDeltaX = Math.abs(x - e.clientX);
    let moveDeltaY = Math.abs(y - e.clientY);

    if (focusTimeout && (moveDeltaX > 1 || moveDeltaY > 1)) {
      clearTimeout(focusTimeout);
      focusTimeout = null;
    }

    const { outOfBoundsX, outOfBoundsY } = crosshairBorderRender(
      selectedNextX,
      selectedNextY
    );

    if (e.type === "touchmove") {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else {
      x = e.clientX;
      y = e.clientY;
    }

    if (!outOfBoundsX) {
      currentX = (x - initialX) / zoom;
    }
    if (!outOfBoundsY) {
      currentY = (y - initialY) / zoom;
    }

    board.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  }
};

const dragEnd = (e) => {
  dragging = false;
  board.classList.remove("dragging");
};

const crosshairBorderRender = (selectedNextX, selectedNextY) => {
  const outOfBoundsX = selectedNextX < 0 || selectedNextX > pixelArray.length;
  const outOfBoundsY =
    selectedNextY < 0 || selectedNextY > pixelArray[0].length;

  if (selectedNextX !== selectedX || selectedNextY !== selectedY) {
    if (pixelQueryTimeout) {
      clearTimeout(pixelQueryTimeout);
      pixelQueryTimeout = null;
    }

    if (typeof selectedX !== "undefined") {
      unrenderCrosshair(selectedX, selectedY);
    }

    if (selectedNextX < 0) {
      selectedX = 0;
    } else if (selectedNextX > pixelArray[0].length - 1) {
      selectedX = pixelArray[0].length - 1;
    } else {
      selectedX = selectedNextX;
    }

    if (selectedNextY < 0) {
      selectedY = 0;
    } else if (selectedNextY > pixelArray.length - 1) {
      selectedY = pixelArray.length - 1;
    } else {
      selectedY = selectedNextY;
    }

    renderCrosshair(selectedX, selectedY);
    pixelInfo(selectedNextX, selectedNextY);
  }

  return outOfBoundsX, outOfBoundsY;
};

const renderPixelOwner = (pixel) => {
  if (pixel === "open") {
    ownerElement.innerHTML = "";
    return;
  }

  const displayInnerHTML = (username) => `<p title="Pixel was placed by @${username}" class="ownerUsername">@${username}</p>`;

  let pixelOwner = pixel.u;
  if (!cachedUsers[pixelOwner]) {
    fetch("/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: pixelOwner,
      }),
    }).then((response) => {
      response.json().then((json) => {
        cachedUsers[pixelOwner] = json;
        ownerElement.innerHTML = displayInnerHTML(
          cachedUsers[pixelOwner].username
        );
      });
    });
  } else {
    ownerElement.innerHTML = displayInnerHTML(cachedUsers[pixelOwner].username);
  }
};

const pixelInfo = (x, y) => {
  if (!cachedPixels[`${x}${y}`]) {
    renderPixelOwner("open");

    pixelQueryTimeout = setTimeout(() => {
      fetch("/pixel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          x,
          y,
        }),
      }).then((response) => {
        if (response.status !== 200) {
          cachedPixels[`${x}${y}`] = "open";
          renderPixelOwner("open");
        } else {
          response.json().then(async (json) => {
            if (json) {
              cachedPixels[`${x}${y}`] = json;
              renderPixelOwner(cachedPixels[`${x}${y}`]);
            } else {
              cachedPixels[`${x}${y}`] = "open";
              renderPixelOwner("open");
            }
          });
        }
      });
    }, 100);
  } else {
    renderPixelOwner(cachedPixels[`${x}${y}`]);
  }
};

main.addEventListener("wheel", zoom_camera);

main.addEventListener("touchstart", dragStart);
main.addEventListener("touchend", dragEnd);
main.addEventListener("touchmove", drag);

main.addEventListener("mousedown", dragStart);
main.addEventListener("mouseup", dragEnd);
main.addEventListener("mousemove", drag);

let pointerdown = false;

const pixelFocus = (e) => {
  if (!pointerdown) {
    const rect = board.getBoundingClientRect();

    const selectedNextX = ~~((e.clientX - rect.left) / zoom / 10);
    const selectedNextY = ~~((e.clientY - rect.top) / zoom / 10);

    crosshairBorderRender(selectedNextX, selectedNextY);

    new Audio("audio/Select Tile & Open Color Select.mp3").play();

    currentX = canvas.width / 2 - (e.clientX - rect.left) / zoom;
    currentY = canvas.height / 2 - (e.clientY - rect.top) / zoom;
    board.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
  }
};

let holdTimeStart;

board.onpointerdown = (e) => {
  focusTimeout = setTimeout(() => {
    pixelFocus(e);
  }, 300);
  pointerdown = true;
};

board.onpointerup = (e) => {
  pointerdown = false;

  if (focusTimeout) {
    clearTimeout(focusTimeout);
    focusTimeout = null;
    pixelFocus(e);
  }
};

// auth

if (authToken) {
  document.getElementById("loginlink").remove();
  document.getElementById("chat-container").style.visibility = "visible";
  const colorElement = document.getElementById("colors");
  colorElement.innerHTML = "";

  for (const color of Object.keys(colors)) {
    colorElement.innerHTML += `<input ${color === selectedColor ? 'checked=""' : ""
      } onchange="updateColor(event);" type="radio" name="color" style="background-color: ${colors[color]
      };" color="${color}"></div>`;
  }
}
