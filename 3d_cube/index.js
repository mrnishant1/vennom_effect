const canvas = game;
canvas.style.backgroundColor="gray" 
canvas.width = "1000"
canvas.height = "800"
const ctx = canvas.getContext("2d")

function screenCords(p){
    //-1,1=> +1=> (0,2)/2=> (0,1)*canvas dims. 
    // console.log(p.x,p.y);
    return{
        x: ((p.x+1)/2*canvas.width),
        y: ((p.y*(-1)+1)/2*canvas.height)
   }
}

function project({x,y,z}){
    return{
        x: x/z,
        y: y/z
    }
}
 
function makePoints(p){
    ctx.fillStyle="Black"
    s=10
    ctx.fillRect(p.x-s/2,p.y-s/2,s,s)
}
function makeLine(p,q){
    ctx.beginPath()
    ctx.moveTo(p.x,p.y)
    ctx.lineTo(q.x,q.y)
    ctx.lineWidth = 10;
    ctx.stroke()
}

const pts = [
  { x: -0.5, y: 0.5, z: 1 },
  { x: 0.5, y: 0.5, z: 1 },
  { x: 0.5, y: -0.5, z: 1 },
  { x: -0.5, y: -0.5, z: 1 },

  { x: -0.5, y: 0.5, z: 1.5 },
  { x: 0.5, y: 0.5, z: 1.5 },
  { x: 0.5, y: -0.5, z: 1.5 },
  { x: -0.5, y: -0.5, z: 1.5 },

  
];

const rect=[
    [0,1,2,3],
    [4,5,6,7],
    [0,4],
    [1,5],
    [2,6],
    [3,7]
]

function rotate_aboutY({x,y,z},angle){
    c=Math.cos(angle)
    s=Math.sin(angle)
    const cameraZ=changes //to prevent z from being z.... z=0----> x/z leads to infinity
    return{
        x: x*c-z*s,
        y: y,
        z: z*c+x*s + cameraZ
    }
}


function renderPoints(angle){  
  function cords(i){
    return {
      x: pts[i].x,
      y: pts[i].y,
      z: pts[i].z-(1.25),
    };
  }
  for (const [i] of pts.entries()) {
    makePoints(screenCords(project(rotate_aboutY(cords(i),angle))));
  }
  
  for (const j of rect) {
    // console.log(j);
    let localcords = j;
    let n = localcords.length;
    for (const [i] of localcords.entries()) {
      console.log(i % localcords.length);

      makeLine(
        screenCords(project(rotate_aboutY(cords(localcords[i]),angle))),
        screenCords(project(rotate_aboutY(cords(localcords[(i + 1) % n]),angle))),
      );
    }
  }


}

function clearCanvas(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


let fps=10
let dt = 1/fps 
let changes = 1.001
let angle =0
// clearCanvas();
// renderPoints(angle);
setInterval(() => {
    changes +=0
    angle +=0.02
    clearCanvas();
    renderPoints(angle);
}, 1000/fps );


function moveThem(){}