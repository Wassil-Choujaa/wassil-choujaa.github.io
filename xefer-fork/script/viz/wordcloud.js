// list should be [{"text": "Hello","size": 11.306790703894244},{"text": "world","size": 40.10139100527468}]
 
var myWordCloud = wordCloud('body');

var ls = []
function displayWordCloud(list) {
  d3.select("#cloud").selectAll("*").remove();
  ls = list;
  myWordCloud.update(ls);
}


function wordCloud(selector) {

  var fill = d3.scaleOrdinal(d3.schemeCategory10);

  var rect = d3.select("svg").node().getBoundingClientRect(); 
  width = rect.width;
  height = rect.height; 
  //Construct the word cloud's SVG element
  var svg = d3.select(selector).append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(" + width/2+ "," + height/2+ ")");


  //Draw the word cloud
  function draw(words) {
      var cloud = svg.selectAll("g text")
                      .data(words, function(d) { return d.text; })

      //Entering words
      cloud.enter()
          .append("text")
          .style("font-family", "Impact")
          .style("fill", function(d, i) { return fill(i); })
          .attr("text-anchor", "middle")
          .attr('font-size', (d) => getSize(d))
          .text(function(d) { return d.text; });

      //Entering and existing words
      cloud
          .transition()
              .duration(600)
              .style("font-size", (d) => getSize(d))
              .attr("transform", function(d) {
                  return "translate(" + [d.x, d.y] + ")";//rotate(" + d.rotate + ")";
              })
              .style("fill-opacity", 1);

      //Exiting words
      cloud.exit()
          .transition()
              .duration(200)
              .style('fill-opacity', 1e-6)
              .attr('font-size', (d) => getSize(d))
              .remove();
  }


  function getSize(d) {
    return 24  + d.size *2 + "px"; 
  }


  //Use the module pattern to encapsulate the visualisation code. We'll
  // expose only the parts that need to be public.
  return {

      //Recompute the word cloud for a new set of words. This method will
      // asycnhronously call draw when the layout has been computed.
      //The outside world will need to call this function, so make it part
      // of the wordCloud return value.
      update: function(words) {

        var rect = d3.select("svg").node().getBoundingClientRect(); 
        width = rect.width;
        height = rect.height; 

          d3.layout.cloud().size([width, height])
              .words(words)
              .padding(5) 
              .font("Impact")
              .fontSize((d) => getSize(d))
              .on("end", draw)
              .start();
      }
  }

}
