const canvas = snake_game;
const context = canvas.getContext("2d");
class Scene {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.context = context;
    this.canvas.width = "800";
    this.canvas.height = "800";
    this.canvas.style.backgroundColor = "gray";
    this.entities = [];
    this.stopAnimate = false;
    this.food = new class_food(this);
    this.direction = "";

    this.snake_speed = 50;

    this.snake_body = null;
  }
  clearCanvas() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  setGameObject(entity) {
    // this recieve an entire linkedList object
    this.snake_body = entity;
  }

  gameOver() {
    alert("Game Over");
    this.stopAnimate = true;
  }
  //what i want is to check colisioin b/w food and snake
  gameBorder() {
    const snake = this.snake_body.Head;
    if (!snake) return;
    const x1 = snake.posX + snake.width / 2;
    const y1 = snake.posY + snake.height / 2;
    const x2 = this.food.posX + this.food.width / 2;
    const y2 = this.food.posY + this.food.height / 2;
    const distance = Math.hypot(x2 - x1, y2 - y1); // use + inside sqrt
    // console.log(x2,x1,y2,y1);
    console.log(distance);

    if (distance <= 70) {
      this.food.spawn();
      this.snake_speed += 0.005;
      this.snake_body.appendLL(
        this,
        this.snake_body.Head.posX,
        this.snake_body.Head.posY,
      );
    }
  }

  renderAnimation() {
    if (this.stopAnimate) return;
    this.gameBorder();
    this.clearCanvas();
    this.food.draw();
    this.snake_body.moveHead_rest_follow(this.snake_speed);
  }
}

//Linked list of game_objects forms body of snake
class snake {
  constructor() {
    this.Head = null;
  }
  appendLL(scene, posX, posY) {
    const newNode = new Game_object(scene, posX, posY);

    if (!this.Head) {
      this.Head = newNode;
      newNode.color="red"
    } else {
      newNode.next = this.Head;
      this.Head = newNode;
    }
  }

  moveHead_rest_follow(speed
  ) {
    let tempX = this.Head.posX;
    let tempY = this.Head.posY;
    let current = this.Head;
    this.Head.move(speed);
    // this.Head.color="red"

    while (current) {
      current.draw();
      current.color="black"
      if (current.next) {
        //just checking 
        if (
          current.next.posX == this.Head.posX &&
          current.next.posY == this.Head.posY
        ) {
          // scene.gameOver();
          current.next=null
          console.log("game over");
          return;
        }
        let anotherTempX = current.next.posX;
        let anotherTempY = current.next.posY;
        current.next.posX = tempX;
        current.next.posY = tempY;
        tempX = anotherTempX;
        tempY = anotherTempY;
      }
      current = current.next;
    }
  }

  // Check_hit_itself(){

  // }
}

class Game_object {
  constructor(scene, posX, posY) {
    //this next points to next node ("game_object")
    this.next = null;

    this.height = 50;
    this.width = 50;
    this.color = "black";
    this.scene = scene;
    this.posX = posX || 0;
    this.posY = posY || 0;
  }
  draw() {
    this.scene.context.fillRect(this.posX, this.posY, this.width, this.height);
    this.scene.context.fillStyle = this.color;
  }

  checkCollision() {
    this.posX > this.scene.canvas.width - this.width ||
    this.posX < 0 ||
    this.posY > this.scene.canvas.height - this.height ||
    this.posY < 0
      ? this.scene.gameOver()
      : "";
  }

  move(speed) {
    this.checkCollision();

    switch (game.direction) {
      case "ArrowLeft":
        if (game.direction == "ArrowRight") break;
        this.posX -= speed;
        break;
      case "ArrowRight":
        if (game.direction == "ArrowLeft") break;
        this.posX += speed;
        break;
      case "ArrowUp":
        if (game.direction == "ArrowDown") break;
        this.posY -= speed;
        break;
      case "ArrowDown":
        if (game.direction == "ArrowUp") break;
        this.posY += speed;
        break;
    }
  }
}

class class_food {
  constructor(scene) {
    this.scene = scene;
    this.width = 50;
    this.height = 50;
    this.posX = Math.random() * this.scene.canvas.width - this.width;
    this.posY = Math.random() * this.scene.canvas.height - this.height;
    // this  
  }

  draw() {
    this.scene.context.fillRect(this.posX, this.posY, this.width, this.height);
    this.scene.context.fillStyle="black"
  }
  move() {}
  spawn() {
    this.posX = Math.random() * (this.scene.canvas.width - this.width);
    this.posY = Math.random() * (this.scene.canvas.height - this.height);
  }
}
