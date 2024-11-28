var create_game_button = document.getElementById("createGame");

function createGame(event) {
  event.preventDefault();

  const token = sessionStorage.getItem("token");

  fetch(backend_url + "/rrr-game", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: "",
  })
    .then((response) => {
      if (!response.ok) {
        response.json().then((data) => {
          console.error("Error body: " + JSON.stringify(data));
          alert("Error: " + data.error_message);
        });
        throw new Error(
          "status: " + response.status + ", errorcode: " + response.statusText
        );
      }

      return response.json();
    })
    .then((data) => {
      localStorage.setItem("initialGamestate", JSON.stringify(data));

      window.location.replace("./game.html");
    })
    .catch((error) => {
      console.error("Error is:", error);
    });
}

create_game_button.addEventListener("click", createGame);
