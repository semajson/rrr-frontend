const tileSize = 16;

// Setup
const username = sessionStorage.getItem("username");
const create_game_rsp = JSON.parse(localStorage.getItem("initialGamestate"));
// console.log("create_game_rsp is: " + JSON.stringify(create_game_rsp));

const game_id = create_game_rsp.game_id;
document.getElementById("gameIdDisplay").textContent = "Game ID: " + game_id;
let user_coord = create_game_rsp.user_info.coord;
let user_dir = create_game_rsp.user_info.dir;
let gamestate = create_game_rsp.visible_gamestate;

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
context.canvas.width = tileSize * gamestate.terrain[0].length;
context.canvas.height = tileSize * gamestate.terrain.length;

let gameImages = null;
let action = null;

// Entry point
loadGameImages().then((foundGameImages) => {
  gameImages = foundGameImages;

  // Draw initial game (todo might be bad)
  // (Yes think this is bad - keep forgetting I need to change this!)
  drawTerrain(gamestate.terrain, gameImages);
  drawUsers(gamestate.users, gamestate.top_left_coord, gameImages);

  // Setup regular game tick
  setInterval(gameTick, 100);
});

// Main loop
window.addEventListener("keydown", handleKeyPress);
async function gameTick() {
  if (action != null) {
    // Todo - decide if should be async or not!
    doUserAction(action);
    action = null;
  }

  gamestate = await getGamestate();
  drawTerrain(gamestate.terrain, gameImages);
  drawUsers(gamestate.users, gamestate.top_left_coord, gameImages);
}

function loadGameImages() {
  const gameImages = {
    // Tiles
    tile_G: new Image(),
    tile_R: new Image(),
    tile_W: new Image(),

    // Sprites
    user_north: new Image(),
    user_south: new Image(),
    user_east: new Image(),
    user_west: new Image(),
    other_user_east: new Image(),
    other_user_north: new Image(),
    other_user_south: new Image(),
    other_user_west: new Image(),
  };

  gameImages["tile_G"].src = "images/grass.png";
  gameImages["tile_R"].src = "images/rock.png";
  gameImages["tile_W"].src = "images/water.png";
  gameImages["user_north"].src = "images/user_north.png";
  gameImages["user_south"].src = "images/user_south.png";
  gameImages["user_east"].src = "images/user_east.png";
  gameImages["user_west"].src = "images/user_west.png";
  gameImages["other_user_east"].src = "images/other_user_east.png";
  gameImages["other_user_south"].src = "images/other_user_south.png";
  gameImages["other_user_west"].src = "images/other_user_west.png";
  gameImages["other_user_north"].src = "images/other_user_north.png";

  // Return a promise that resolves when all images are loaded
  return Promise.all([
    new Promise((resolve) => (gameImages["tile_G"].onload = resolve)),
    new Promise((resolve) => (gameImages["tile_R"].onload = resolve)),
    new Promise((resolve) => (gameImages["tile_W"].onload = resolve)),
    new Promise((resolve) => (gameImages["user_east"].onload = resolve)),
    new Promise((resolve) => (gameImages["user_south"].onload = resolve)),
    new Promise((resolve) => (gameImages["user_west"].onload = resolve)),
    new Promise((resolve) => (gameImages["user_north"].onload = resolve)),
    new Promise((resolve) => (gameImages["other_user_north"].onload = resolve)),
    new Promise((resolve) => (gameImages["other_user_south"].onload = resolve)),
    new Promise((resolve) => (gameImages["other_user_east"].onload = resolve)),
    new Promise((resolve) => (gameImages["other_user_west"].onload = resolve)),
  ]).then(() => {
    return gameImages;
  });
}

// Handle key press
// This works by setting the global variable action,
// to be processed in gameTick().
// This assumes that the gameTick() interval is sufficient
// Might want to change this for client side prediction / better user response
// and have stuff handled all in handleKeyPress()
function handleKeyPress(event) {
  const key = event.key;

  if (key === "ArrowUp") {
    action = { move: "North" };
  } else if (key === "ArrowDown") {
    action = { move: "South" };
  } else if (key === "ArrowLeft") {
    action = { move: "West" };
  } else if (key === "ArrowRight") {
    action = { move: "East" };
  }
}

function drawTerrain(board, gameImages) {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const tileType = board[y][x];
      const tileImage = gameImages["tile_" + tileType];
      context.drawImage(
        tileImage,
        x * tileSize,
        y * tileSize,
        tileSize,
        tileSize
      );
    }
  }
}

function drawUsers(users, topLeftCoord, gameImages) {
  for (const [user, info] of Object.entries(users)) {
    if (user == username) {
      // Our user
      // For current user, use user_coord over gamestate user coord
      let image = NaN;
      if (info.dir == "West") {
        image = gameImages["user_west"];
      } else if (info.dir == "East") {
        image = gameImages["user_east"];
      } else if (info.dir == "South") {
        image = gameImages["user_south"];
      } else if (info.dir == "North") {
        image = gameImages["user_north"];
      }
      drawUser(info.coord, topLeftCoord, image);
    } else {
      // Other user
      let image = NaN;
      if (info.dir == "West") {
        image = gameImages["other_user_west"];
      } else if (info.dir == "East") {
        image = gameImages["other_user_east"];
      } else if (info.dir == "South") {
        image = gameImages["other_user_south"];
      } else if (info.dir == "North") {
        image = gameImages["other_user_north"];
      }
      drawUser(info.coord, topLeftCoord, image);
    }
  }
}

function drawUser(userCoord, topLeftCoord, image) {
  const x = userCoord.x - topLeftCoord.x;
  const y = userCoord.y - topLeftCoord.y;

  context.drawImage(image, x * tileSize, y * tileSize, tileSize, tileSize);
}

async function getGamestate() {
  const token = sessionStorage.getItem("token");

  // console.log("User coord is :" + user_coord.x + ", " + user_coord.y);

  const response = await fetch(
    backend_url +
      "/rrr-game/" +
      game_id +
      "?x=" +
      user_coord.x +
      "&y=" +
      user_coord.y,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        "ngrok-skip-browser-warning": "7878",
      },
    }
  );

  if (response.ok) {
    // console.log("Response is: " + response);
    const data = await response.json();
    return data;
  } else {
    const data = await response.json();
    console.error("Get gamestate error: " + JSON.stringify(data));
    return gamestate;
  }
}

async function doUserAction(userAction) {
  const token = sessionStorage.getItem("token");

  const response = await fetch(
    backend_url +
      "/rrr-game/" +
      game_id +
      "/actions?x=" +
      user_coord.x +
      "&y=" +
      user_coord.y,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
        "ngrok-skip-browser-warning": "7878",
      },
      body: JSON.stringify(userAction),
    }
  );

  if (response.ok) {
    const data = await response.json();
    user_dir = data.user_info.dir;
    user_coord = data.user_info.coord;
  } else {
    const data = await response.json();
    console.error("Action error: " + JSON.stringify(data));
  }
}
