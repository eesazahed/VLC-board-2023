const authToken = document.cookie.split("token=").pop().split(";")[0];
let url = window.location.href;

if (authToken) {
  if (url.includes("?token=")) {
    window.location.href = url.split("?token=")[0];
  }

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: authToken,
    }),
  }).then((response) => {
    if (response.status === 200) {
      if (url.includes("?token=")) {
        url = url.split("?token=")[0];
      }
    } else {
      response.text().then((text) => {
        document.cookie = `token=null;max-age=0`;
        window.location.reload();
      });
    }
  });
} else {
  if (url.includes("?token=")) {
    const queryString = url.split("?").pop();

    const token = queryString.split("token=").pop();

    if (token) {
      document.cookie = `token=${token};max-age=31536000`;
      window.location.reload();
    }
  }
}

