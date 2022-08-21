// evaluation de la solution
function calcDistance(edges) {
  var sum = 0;
  for (var i = 0; i < edges.length - 1; i++) {
    var d = dist(edges[i][0].x, edges[i][0].y, edges[i][1].x, edges[i][1].y);
    sum += d;
  }
  
  var element = document.getElementById("sum"); 

  element.innerText = sum;
  return sum;
}