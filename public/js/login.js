const authToken = document.cookie.split("token=").pop().split(";")[0];
let url = window.location.href;

if (authToken) {
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: authToken,
    }),
  }).then((response) => {
    if (response.status == 200) {
      if (url.includes("?token=")) {
        url = url.split("?")[0];
      }

      response.json().then((json) => {
        generateCountdown(placeButton, json.cooldown);
      });
    } else {
      response.text().then((text) => {
        displayErrorMessage(text);
      });
    }
  });
} else {
  if (url.includes("?token=")) {
    const queryString = url.split("?").pop();

    const token = queryString.split("token=").pop();

    if (token) {
      document.cookie = `token=${token};max-age=31536000`;
      url = url.split("?")[0];
    }
  }
}
