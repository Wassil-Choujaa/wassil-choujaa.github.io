

var gRadial;

var stratify;

function initHierarchy() {
    gRadial = gTranslate.append("g").attr("id", "radial");

    stratify = d3.stratify()
        .parentId(function (d) {
            return d.id.substring(0, d.id.lastIndexOf("."));
        });

    tree = d3.cluster()
        .size([360, 390])
        .separation(function (a, b) {
            return (a.parent == b.parent ? 1 : 2) / a.depth;
        });

    restartRadial(graph);
}

var test2;
function restartRadial() {

    var rootData = toHierarchy();
    var root = tree(d3.hierarchy(rootData).sort((a, b) => d3.ascending(a.data.name, b.data.name)));
    if (!root) return;

    test2 = root;


    var link = gRadial.selectAll(".link")
        .data(root.descendants().slice(1))
        .enter().append("path")
        .attr("class", "link")
        .attr("d", function (d) {
            return "M" + project(d.x, d.y)
                + "C" + project(d.x, (d.y + d.parent.y) / 2)
                + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
                + " " + project(d.parent.x, d.parent.y);
        });
    var node = gRadial.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", function (d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
        .attr("transform", function (d) { return "translate(" + project(d.x, d.y) + ")"; });

    node.append("circle")
        .attr("r", 2.5);

    node.append("text")
        .attr("dy", ".31em")
        .attr("x", function (d) { return d.x < 180 === !d.children ? 6 : -6; })
        .style("text-anchor", function (d) { return d.x < 180 === !d.children ? "start" : "end"; })
        .attr("transform", function (d) { return "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")"; })
        .text(function (d) { return (adjacency(metadataByName(d.data.name)) == 1) ? "" : d.data.name.substr(0, 7) + ((d.data.name.length > 7) ? " ... " : ""); });



}





function project(x, y) {
    var angle = (x - 90) / 180 * Math.PI,
        radius = y;
    return [radius * Math.cos(angle), radius * Math.sin(angle)];
}

