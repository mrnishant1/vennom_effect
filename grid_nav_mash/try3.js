const canvas = goap_game;
console.log(canvas);
canvas.width = "600";
canvas.height = "600";
const CELL_SIZE = 8;

const ctx = canvas.getContext("2d");
const walkable = {};
const blocked = new Set();
let target_coordinate = { x: 500, y: 500 };
let shapes_cords = [];
let myInterval = null;

// function Astar(x, y) {
//   const coordinates = [
//     { x: x - 1, y },
//     { x, y: y - 1 },
//     { x: x + 1, y },
//     { x, y: y + 1 },
//   ];

//   let minCoordinate = null;
//   let minCost = Infinity;

//   let cords =[]
//   coordinates.forEach((c) => {
//     if (isBlocked({ x: c.x, y: c.y })) {
//       return
//     };

//     const g = isBlocked({ x: c.x, y: c.y })?Infinity:1;
//     const h = calculateDistance(target_coordinate, c);
//     const f = g + h;

//     if (f < minCost) {
//       minCost = f;
//       minCoordinate = { ...c };
//     }
//   });

//   if (minCoordinate) {
//     enemy.moveToCoordinate(minCoordinate.x, minCoordinate.y);
//   } else {
//     console.log(minCoordinate);
//   }
// }
function calculateDistance(target, current) {
  let distance =
    Math.abs(target.x - current.x) + Math.abs(target.y - current.y);
  return distance;
}
function hashIndex(x, y) {
  return ((x + y) * (x + y + 1)) / 2 + y;
}
function isBlocked(cordinate) {
  return blocked.has(
    hashIndex(
      Math.floor(cordinate.x / CELL_SIZE),
      Math.floor(cordinate.y / CELL_SIZE),
    ),
  );
}
class Node {
  constructor(x, y, g, h, parent) {
    ((this.x = x),
      (this.y = y),
      (this.g = 0), //cost to move to this tile
      (this.h = 0), //distance from here to target
      (this.f = g + h),
      (this.parent = parent || null));
  }
}

function Astar(startNode, target) {
  const open = [startNode];
  const closedHashes = new Set(); // Use hashes to track visited coords

  while (open.length > 0) {
    // 1. Find lowest F cost
    let currentIndex = 0;
    for (let i = 0; i < open.length; i++) {
      if (open[i].f < open[currentIndex].f) currentIndex = i;
    }

    let current = open[currentIndex];
    let currentHash = hashIndex(current.x, current.y);

    // 2. Check Target
    if (current.x === target.x && current.y === target.y) {
      return BuildPath(current);
    }

    // 3. Move from Open to Closed
    open.splice(currentIndex, 1);
    closedHashes.add(currentHash);

    // 4. Process Neighbors
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ];

    for (let [dx, dy] of directions) {
      let nx = current.x + dx;
      let ny = current.y + dy;
      let nHash = hashIndex(nx, ny);

      if (isBlocked({ x: nx, y: ny }) || closedHashes.has(nHash)) continue;

      let gScore = current.g + 1; // Cumulative cost
      let hScore = calculateDistance(target, { x: nx, y: ny });
      let neighbor = new Node(nx, ny, gScore, hScore, current);

      // Check if neighbor is already in open with a better path
      let existingOpen = open.find((n) => n.x === nx && n.y === ny);
      if (existingOpen && gScore >= existingOpen.g) continue;

      if (!existingOpen) open.push(neighbor);
    }
  }
  return []; // No path found
}
function BuildPath(current) {
  let path = [];
  while (current != null) {
    path.push({ x: current.x, y: current.y });
    current = current.parent;
  }
  return path;
}

class Create_Obstacle {
  constructor(ctx, CELL_SIZE) {
    this.ctx = ctx;
    this.isMouseDown = false;
    this.start = null;
    this.CELL_SIZE = CELL_SIZE;

    window.addEventListener("mousemove", (e) => this.#onMouseMove(e));
    window.addEventListener("mouseup", (e) => this.#onMouseUp(e));
  }

  hashIndex(x, y) {
    return ((x + y) * (x + y + 1)) / 2 + y;
  }

  BakeMesh() {
    for (let i = 0; i < canvas.height; i += CELL_SIZE) {
      for (let j = 0; j < canvas.width; j += CELL_SIZE) {
        let x = Math.floor(j / CELL_SIZE);
        let y = Math.floor(i / CELL_SIZE);
        // walkable[point] = true;
        if (!blocked.has(body.hashIndex(x, y))) {
          ctx.beginPath();
          ctx.fillStyle = "blue";
          ctx.arc(j, i, 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }
  }

  RigidBody(x, y, w, h) {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(x, y, w, h);
  }

  #addBlockedPoints(xmin, xmax, ymin, ymax) {
    const startCol = Math.floor(xmin / CELL_SIZE);
    const endCol = Math.floor(xmax / CELL_SIZE);
    const startRow = Math.floor(ymin / CELL_SIZE);
    const endRow = Math.floor(ymax / CELL_SIZE);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        blocked.add(this.hashIndex(col, row, CELL_SIZE));

        // debug draw at cell center
        const cx = col * CELL_SIZE + CELL_SIZE / 2;
        const cy = row * CELL_SIZE + CELL_SIZE / 2;

        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  #onMouseMove(e) {
    if (!this.isMouseDown) return;

    const w = e.clientX - this.start.x;
    const h = e.clientY - this.start.y;

    redraw({
      x1: this.start.x,
      y1: this.start.y,
      w,
      h,
    });
  }

  #onMouseUp(e) {
    if (!this.isMouseDown) return;

    this.isMouseDown = false;
    if (this.start.x == e.clientX && this.start.y == e.clientY) return;

    const x2 = e.clientX;
    const y2 = e.clientY;

    shapes_cords.push({
      x1: this.start.x,
      y1: this.start.y,
      x2,
      y2,
    });

    redraw();

    const xmin = Math.min(this.start.x, x2);
    const xmax = Math.max(this.start.x, x2);
    const ymin = Math.min(this.start.y, y2);
    const ymax = Math.max(this.start.y, y2);

    this.#addBlockedPoints(xmin, xmax, ymin, ymax);
    // console.log(blocked);
    this.BakeMesh();
  }

  create_rigid_obstacle(e) {
    this.isMouseDown = true;
    this.start = {
      x: e.clientX,
      y: e.clientY,
    };
  }
}

class Game_object {
  constructor(posX, posY, ctx) {
    this.ctx = ctx;
    this.next = null;
    this.height = 50;
    this.width = 50;
    this.color = "black";
    this.posX = posX || 0;
    this.posY = posY || 0;
  }
  draw() {
    this.ctx.beginPath();
    this.ctx.fillStyle = "orange";
    this.ctx.arc(this.posX, this.posY, 10, 0, 2 * Math.PI);
    this.ctx.fill();
    // console.log(this.posX, this.posY);
  }
  hashIndex(x, y) {
    return ((x + y) * (x + y + 1)) / 2 + y;
  }
  isBlocked(x, y, CELL_SIZE) {
    return !blocked.has(
      this.hashIndex(Math.floor(x / CELL_SIZE), Math.floor(y / CELL_SIZE)),
    );
  }

  move(speed, direction) {
    switch (direction) {
      case "ArrowLeft":
        if (this.isBlocked(this.posX - speed, this.posY, CELL_SIZE)) {
          this.posX -= speed;
          break;
        } else break;

      case "ArrowRight":
        if (this.isBlocked(this.posX + speed, this.posY, CELL_SIZE)) {
          this.posX += speed;
          break;
        } else break;

      case "ArrowUp":
        if (this.isBlocked(this.posX, this.posY - speed, CELL_SIZE)) {
          this.posY -= speed;
          break;
        } else break;
      case "ArrowDown":
        if (this.isBlocked(this.posX, this.posY + speed, CELL_SIZE)) {
          this.posY += speed;
          break;
        } else break;
    }

    redraw();
  }

  moveToCoordinate(x, y) {
    this.posX = x;
    this.posY = y;
    redraw();
  }
}

//============>
// re-renderer
//<===========
function redraw(preview = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw saved shapes
  shapes_cords.forEach(({ x1, y1, x2, y2 }) => {
    body.RigidBody(x1, y1, x2 - x1, y2 - y1);
  });
  enemy.draw();
  player.draw();

  // draw preview if exists
  if (preview) {
    body.RigidBody(preview.x1, preview.y1, preview.w, preview.h);
  }
}

//====================//
//    Class Use       //
//====================//

const body = new Create_Obstacle(ctx, CELL_SIZE);

window.addEventListener("mousedown", (estart) => {
  body.create_rigid_obstacle(estart);
});

const enemy = new Game_object(0, 0, ctx);
enemy.draw();

window.addEventListener("keydown", (e) => enemy.move(20, e.code));

let player = null;
window.addEventListener("mousedown", (estart) => {
  if (isBlocked({ x: estart.clientX, y: estart.clientY })) {
    return;
  }
  target_coordinate = { x: estart.clientX, y: estart.clientY };
  player = new Game_object(target_coordinate.x, target_coordinate.y, ctx);
  player.draw();

  const path = Astar(
    new Node(
      enemy.posX,
      enemy.posY,
      0,
      calculateDistance(target_coordinate, { x: enemy.posX, y: enemy.posY }),
    ),
    target_coordinate,
  );

  if (!path) return; // Safety check

  // 3. Clear existing movement
  if (window.myInterval) clearInterval(window.myInterval);

  // 4. Move at a human-readable speed (e.g., every 100ms)
  window.myInterval = setInterval(() => {
    if (path.length === 0) {
      clearInterval(window.myInterval);
      return;
    }

    // Get next tile and convert BACK to pixels for the drawing engine
    let nextTile = path.pop();
    // enemy.posX = nextTile.x * CELL_SIZE;
    // enemy.posY = nextTile.y * CELL_SIZE;

    enemy.moveToCoordinate(nextTile.x, nextTile.y);
    // Trigger your draw/render function here
    // requestAnimationFrame(renderLoop);
  }, 10);
});
