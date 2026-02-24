const canvas = goap_game;
console.log(canvas);
canvas.width = "600";
canvas.height = "600";
const CELL_SIZE = 16;

const ctx = canvas.getContext("2d");
const walkable = {};
const blocked = new Set();

let target_coordinate = { x: 500, y: 500 };
let escape_door = { x: 560, y: 500 };
let shapes_cords = [];
let myInterval = null;

function calculateDistance(target, current) {
  let distance =
    Math.abs(target.x - current.x) + Math.abs(target.y - current.y);
  return distance;
}
function hashIndex(x, y) {
  return ((x + y) * (x + y + 1)) / 2 + y;
}
function isBlocked(cordinate) {
  if (
    cordinate.x < 0 ||
    cordinate.x > canvas.width ||
    cordinate.y < 0 ||
    cordinate.y > canvas.height
  ) {
    return true;
  }

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
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
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
      if (existingOpen && gScore >= existingOpen.g) continue; //In case of better neighbor pre-existe skip new push

      if (!existingOpen) open.push(neighbor); //If neighbor not found --push
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

  RigidBody(x, y, w, h, alpha = 1) {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(x, y, w, h, 100);
  }

  #addBlockedPoints(xmin, xmax, ymin, ymax) {
    const startCol = Math.floor(xmin / CELL_SIZE);
    const endCol = Math.floor(xmax / CELL_SIZE);
    const startRow = Math.floor(ymin / CELL_SIZE);
    const endRow = Math.floor(ymax / CELL_SIZE);
    // console.log("asked to add", startCol, startRow, endCol, endRow);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        blocked.add(this.hashIndex(col, row, CELL_SIZE));

        // debug draw at cell center
        const cx = col * CELL_SIZE;
        const cy = row * CELL_SIZE;

        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
  #deleteBlockedPoints(xmin, xmax, ymin, ymax) {
    // console.log("delete" + xmin, xmax, ymin, ymax);
    const startCol = Math.floor(xmin / CELL_SIZE);
    const endCol = Math.floor(xmax / CELL_SIZE);
    const startRow = Math.floor(ymin / CELL_SIZE);
    const endRow = Math.floor(ymax / CELL_SIZE);
    // console.log("asked to deletee", startCol, startRow, endCol, endRow);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (blocked.has(this.hashIndex(col, row, CELL_SIZE))) {
          // console.log("found");
          blocked.delete(this.hashIndex(col, row, CELL_SIZE));

          // debug draw at cell center
          const cx = col * CELL_SIZE;
          const cy = row * CELL_SIZE;

          ctx.beginPath();
          ctx.fillStyle = "blue";
          ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
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

  draw_Rigid_Body(e) {
    this.isMouseDown = true;
    this.start = {
      x: e.clientX,
      y: e.clientY,
    };
  }

  create_rigidBodyAt(x1, y1, x2, y2) {
    // console.log({ x1, x2, y1, y2 });
    shapes_cords.push({
      x1: x1,
      y1: y1,
      x2: x2,
      y2,
    });

    this.#addBlockedPoints(x1, x2, y1, y2);
  }

  delete_rigidBodyAt(x1, y1, x2, y2, index, wallThickness) {
    shapes_cords = shapes_cords.filter(
      (item) =>
        !(item.x1 === x1 && item.y1 === y1 && item.x2 === x2 && item.y2 === y2),
    );

    // console.log("delete" + x1, y1, x2, y2);
    //left,right,top,bottom
    if (index === 0)
      this.#deleteBlockedPoints(
        x1,
        x2,
        y1 + wallThickness / 0.8,
        y2 - wallThickness / 3.4,
      );
    if (index === 1)
      this.#deleteBlockedPoints(
        x1,
        x2,
        y1 + wallThickness / 0.8,
        y2 - wallThickness / 3.4,
      );
    if (index === 2)
      this.#deleteBlockedPoints(
        x1 + wallThickness / 0.8,
        x2 - wallThickness / 3.4,
        y1,
        y2,
      );
    if (index === 3)
      this.#deleteBlockedPoints(
        x1 + wallThickness / 0.8,
        x2 - wallThickness / 3.4,
        y1,
        y2,
      );
  }
}

class Game_object {
  constructor(posX, posY, ctx, color = "black") {
    this.ctx = ctx;
    this.next = null;
    this.height = 50;
    this.width = 50;
    this.color = color;
    this.posX = posX || 0;
    this.posY = posY || 0;
    this.isMoving = false;
    this.gameWon = false;
  }
  draw(radius = 10, startAngle = 0, endAngle = 360) {
    this.ctx.beginPath();
    this.ctx.fillStyle = this.color;
    this.ctx.moveTo(this.posX, this.posY);
    // this.ctx.rotate(6 * Math.PI)
    this.ctx.arc(
      this.posX,
      this.posY,
      radius,
      (Math.PI / 180) * startAngle,
      (Math.PI / 180) * endAngle,
      true,
    );
    this.ctx.setTransform();

    this.ctx.closePath();
    this.ctx.fill();
    // console.log(this.posX, this.posY);
  }
  hashIndex(x, y) {
    return ((x + y) * (x + y + 1)) / 2 + y;
  }

  moveToCoordinate(x, y) {
    if (this.gameWon) return;
    this.posX = x;
    this.posY = y;
    redraw();
  }
}

class cell {
  constructor(
    posX,
    posY,
    cellDims,
    obstacleManager,
    visited = false,
    parent = null,
  ) {
    this.posX = posX;
    this.posY = posY;
    this.parent = parent;
    this.visited = visited;

    this.wall = [true, true, true, true];

    this.wallThickness = 20;
    this.cellSize = cellDims;

    this.obstacle = obstacleManager;
  }
  updateWall(index, params) {
    if (this.wall[index]) {
      this.obstacle.create_rigidBodyAt(...params);
    } else {
      this.obstacle.delete_rigidBodyAt(...params, index, this.wallThickness);
    }
  }
  leftwall() {
    const p = [
      this.posX,
      this.posY + 0,
      this.posX + this.wallThickness,
      this.posY + this.cellSize + 0,
    ];
    this.updateWall(0, p);
  }

  rightwall() {
    const x = this.posX + this.cellSize;
    const p = [
      x,
      this.posY + 0,
      x + this.wallThickness,
      this.posY + this.cellSize + 0,
    ];
    this.updateWall(1, p);
  }

  topwall() {
    const p = [
      this.posX + 0,
      this.posY,
      this.posX + this.cellSize + 0,
      this.posY + this.wallThickness,
    ];
    this.updateWall(2, p);
  }

  bottom() {
    const y = this.posY + this.cellSize;
    const p = [
      this.posX + 0,
      y,
      this.posX + this.cellSize + 0,
      y + this.wallThickness,
    ];
    this.updateWall(3, p);
  }

  deleteWall(index) {
    this.wall[index] = false;

    if (index === WALL.LEFT) this.leftwall();
    if (index === WALL.RIGHT) this.rightwall();
    if (index === WALL.TOP) this.topwall();
    if (index === WALL.BOTTOM) this.bottom();
  }
}

class Npc {
  constructor(posX, posY, radius, startAngle, endAngle) {
    this.posX = posX;
    this.posY = posY;
    this.radius = radius;
    this.startAngle = startAngle;
    this.endAngle = endAngle;
    this.NpcGameOver = false;
  }

  draw(rotateBy = 0) {
    // console.log("draw");
    let x = this.posX - enemy.posX;
    let y = this.posY - enemy.posY;
    let alpha = 22350 - (x * x + y * y);
    // let alpha = 1;

    this.rotateBy = rotateBy;
    ctx.save();
    ctx.translate(this.posX, this.posY); // move origin to shape
    ctx.rotate((Math.PI / 180) * this.rotateBy); // rotate 90°
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
    ctx.arc(
      0,
      0,
      this.radius,
      (Math.PI / 180) * this.startAngle,
      (Math.PI / 180) * this.endAngle,
      false,
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
  Update(angle) {
    this.rotateBy = angle % 360;
    this.startAngle = (this.startAngle + this.rotateBy) % 360;
    this.endAngle = (this.endAngle + this.rotateBy) % 360;
    redraw();
    this.checkInRange({ x: enemy.posX, y: enemy.posY });
  }
  checkInRange(target) {
    if (this.NpcGameOver) return;
    const dx = target.x - this.posX;
    const dy = target.y - this.posY;

    let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    const start = ((this.startAngle % 360) + 360) % 360;
    const end = ((this.endAngle % 360) + 360) % 360;

    let inRange;

    if (start <= end) {
      inRange = angle >= start && angle <= end;
    } else {
      inRange = angle >= start || angle <= end;
    }

    if (inRange) {
      if (dx * dx + dy * dy <= this.radius * this.radius + 50) {
        alert("game Over");
        this.NpcGameOver = true;
        window.location.reload();
        return;
      }
    }
  }
}

const cell_store = new Map();

let cellDims = 100;
function createNodes() {
  let colls = canvas.width;
  let rows = canvas.height;
  const gridwall = new Create_Obstacle(ctx, CELL_SIZE);
  for (let j = 0; j < rows; j += cellDims) {
    for (let i = 0; i < colls; i += cellDims) {
      const gridCell = new cell(i, j, cellDims, gridwall);
      gridCell.leftwall();
      gridCell.rightwall();
      gridCell.topwall();
      gridCell.bottom();
      cell_store.set(hashIndex(gridCell.posX, gridCell.posY), gridCell);
    }
  }
}

createNodes();

const WALL = {
  LEFT: 0,
  RIGHT: 1,
  TOP: 2,
  BOTTOM: 3,
};

function createMaze(cellDims) {
  // stack for backtracking
  let stack = [];

  // pick first / random cell
  let currentCell = cell_store.get(hashIndex(0, 0));
  currentCell.visited = true;

  while (currentCell) {
    // neighbours
    let neighbours = [];

    let cell1 = cell_store.get(
      hashIndex(currentCell.posX + cellDims, currentCell.posY),
    );
    let cell2 = cell_store.get(
      hashIndex(currentCell.posX - cellDims, currentCell.posY),
    );
    let cell3 = cell_store.get(
      hashIndex(currentCell.posX, currentCell.posY + cellDims),
    );
    let cell4 = cell_store.get(
      hashIndex(currentCell.posX, currentCell.posY - cellDims),
    );

    if (cell1 && !cell1.visited) neighbours.push(cell1);
    if (cell2 && !cell2.visited) neighbours.push(cell2);
    if (cell3 && !cell3.visited) neighbours.push(cell3);
    if (cell4 && !cell4.visited) neighbours.push(cell4);

    if (neighbours.length > 0) {
      // choose random neighbour
      let next = neighbours[Math.floor(Math.random() * neighbours.length)];

      // push current for backtrack
      stack.push(currentCell);

      // link parent (or remove walls here)
      next.parent = currentCell;
      next.visited = true;

      let dx = next.posX - currentCell.posX;
      let dy = next.posY - currentCell.posY;

      // right
      if (dx === cellDims && dy === 0) {
        currentCell.deleteWall(WALL.RIGHT);
        next.deleteWall(WALL.LEFT);
      }

      // left
      if (dx === -cellDims && dy === 0) {
        currentCell.deleteWall(WALL.LEFT);
        next.deleteWall(WALL.RIGHT);
      }

      // bottom (depends on your coordinate system)
      if (dx === 0 && dy === cellDims) {
        currentCell.deleteWall(WALL.BOTTOM);
        next.deleteWall(WALL.TOP);
      }

      // top
      if (dx === 0 && dy === -cellDims) {
        currentCell.deleteWall(WALL.TOP);
        next.deleteWall(WALL.BOTTOM);
      }

      // move forward
      currentCell = next;
    } else if (stack.length > 0) {
      // backtrack
      currentCell = stack.pop();
    } else {
      break;
    }
  }
}
createMaze(cellDims);

const enemy = new Game_object(50, 50, ctx);
enemy.draw();

let npc_enemy = [];
const MIN_DIST = 200; //to change distance b/w npcc
function invalidSpawn(x, y, list, player) {
  // too close to other NPCs
  const nearNpc = list.some((n) => {
    const dx = n.posX - x;
    const dy = n.posY - y;
    return dx * dx + dy * dy < MIN_DIST * MIN_DIST;
  });

  if (nearNpc) return true;

  // too close to player
  const dxp = player.posX - x;
  const dyp = player.posY - y;

  const PLAYER_MIN = 120; // tweak

  const nearPlayer = dxp * dxp + dyp * dyp < PLAYER_MIN * PLAYER_MIN;

  return nearPlayer;
}

for (let i = 0; i < 10; i++) {
  let tries = 0;

  while (true) {
    const x = Math.floor(Math.random() * 60) * 10;
    const y = Math.floor(Math.random() * 60) * 10;

    if (!invalidSpawn(x, y, npc_enemy, enemy)) {
      npc_enemy.push(new Npc(x, y, 70, 0, 90));
      break;
    }

    if (++tries > 200) break;
  }
}

setInterval(() => {
  npc_enemy.forEach((item) => {
    if (npc_enemy.NpcGameOver) return;
    item.Update(Math.random() * 20);
  });
}, 70);

//============>
// re-renderer
//<===========
function redraw(preview = null) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "rgb(135, 206, 235)";
  ctx.fillRect(escape_door.x, escape_door.y, 50, 100);
  // draw saved shapes
  shapes_cords.forEach(({ x1, y1, x2, y2 }) => {
    let x = enemy.posX - x1;
    let y = enemy.posY - y1;
    let alpha = (22350 - (x * x + y * y)) / 70000;
    // let alpha = 1;
    // console.log("alpha", alpha);
    body.RigidBody(x1, y1, x2 - x1, y2 - y1, alpha);
  });

  npc_enemy.forEach((item) => {
    item.draw(10);
  });
  enemy.draw();
  ctx.fillStyle = "#8684849b"; // Black color for fog
  ctx.beginPath();
  ctx.arc(enemy.posX, enemy.posY, 150, 0, 2 * Math.PI);
  ctx.fill();

  // Reset globalAlpha for subsequent drawings if needed

  // draw preview if exists
  if (preview) {
    body.RigidBody(preview.x1, preview.y1, preview.w, preview.h);
  }
}

setTimeout(() => {
  redraw(null);
}, 100);

//====================//
//    Class Use       //
//====================//

const body = new Create_Obstacle(ctx, CELL_SIZE);

window.addEventListener("mousedown", (estart) => {
  body.draw_Rigid_Body(estart);
});

let player = null;

const moveAudio = new Audio("./walk2.mp3");
// moveAudio.loop = true;

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

  //Clear existing movement
  if (window.myInterval) clearInterval(window.myInterval);

  window.myInterval = setInterval(() => {
    if (path.length === 0) {
      clearInterval(window.myInterval);
      return;
    }
    let nextTile = path.pop();
    if (enemy.gameWon) return;
    enemy.moveToCoordinate(nextTile.x, nextTile.y);
    if (enemy.posX > 550 && enemy.posY > 500) {
      alert("Won");
      enemy.gameWon = true;
      window.location.reload();
    }
    moveAudio.play();
  }, 10);
});
