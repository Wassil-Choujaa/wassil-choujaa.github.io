
let img;
var cities = [];
var nodes = [];
var edges = [];
var totalCities = 9;
var recordDistance;
var bestEver;
var borderWidth = 200;
var borderHeight = 250;
let r, g, b;
var selected = false;
var selectedPoint;

function preload() {
  img = loadImage('carte.jpg');
}
 
function setup() {
  r = random(255);
  g = random(255);
  b = random(255);
  background(50);
    
  createCanvas(450, 600);
  image(img, 0, -70, 450, 600);

  for (var i = 0; i < totalCities; i++) {
    var x = 150 + random(borderWidth);
    var y = 100 + random(borderHeight)
    var v = createVector(x, y);
    cities[i] = v;
  }
  
  cities.push(createVector(250,70));
  cities.push(createVector(50,150));
  cities.push(createVector(150,350));

}

 
var radius = 18;
 
function draw() {

  image(img, 0, -70, 450, 600);

  stroke(255);
  strokeWeight(5);
  noFill();

  
  beginShape();
  for (var i = 0; i < edges.length; i++) {
    vertex(edges[i][0].x, edges[i][0].y);
    vertex(edges[i][1].x, edges[i][1].y);
  }
  endShape();

  
  fill(10);
  for (var i = 0; i < cities.length; i++) {
    ellipse(cities[i].x, cities[i].y, radius, radius);
  }
  fill(10, 0, 250, 255);

  if(selected){
    ellipse(selectedPoint.x, selectedPoint.y, radius, radius);
  }
  dragSegment();
  calcDistance(edges);
}

function dragSegment() {

  if(!selected) return;
  push();
  stroke(153);
  line(selectedPoint.x, selectedPoint.y, mouseX, mouseY);
  pop();

}

// When the user clicks the mouse
function mousePressed() {

  joinCities();

  

}

function joinCities(){
  var alreadySelected = selected;
  var prevPoint = selectedPoint;
  selcted = false;
  // Check if mouse is inside the circle
  for (var i = 0; i < cities.length; i++) {
    var point = cities[i];
    let d = dist(mouseX, mouseY, point.x-radius/2, point.y-radius/2);
    if (d < radius - 1) {
      selected = true;
      selectedPoint = point;
      // Pick new random color values
      r = random(255);
      g = random(255);
      b = random(255);
    }
  }
  deletePath();

  if(alreadySelected && selected){
    edges.push([prevPoint, selectedPoint]);
    selected= false;
  }

}

function deletePath(){
  for (var i = 0; i < edges.length; i++) {
    var v1 = edges[i][0];
    var v2 = edges[i][1];
    if(linePoint(v1, v2)){
      edges.splice(i, 1);
    }
  }  
}


function linePoint(v1,  v2) {

  // get distance from the point to the two ends of the line
  var d1 = dist(mouseX,mouseY, v1.x,v1.y);
  var d2 = dist(mouseX,mouseY, v2.x,v2.y);

  // get the length of the line
  var lineLen = dist(v1.x,v1.y, v2.x,v2.y);

  // since floats are so minutely accurate, add
  // a little buffer zone that will give collision
  var buffer = 0.1;    // higher # = less accurate

  // if the two distances are equal to the line's 
  // length, the point is on the line!
  // note we use the buffer here to give a range, 
  // rather than one #
  if (d1+d2 >= lineLen-buffer && d1+d2 <= lineLen+buffer) {
    return true;
  }
  return false;
}
