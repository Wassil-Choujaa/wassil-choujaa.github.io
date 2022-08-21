// a ameliorer : link max size = 50
// auto fetch mlinks for each node display mlinks for each node

var labelType, useGradients, nativeTextSupport, animate, rgraphic;
var link;
var node;
var mLink;
var text;
var color;
var simulation;
var width = screen.width;
var height = screen.height;
var gTranslate;
var gScale;
var gGraph;
var padding = 12;
var borderRadius = 6;
var strokeWidth = 4;
var strokeColor = "rgba(0, 0, 0, 0.82)"
var hoverselectedpadding = 22;
var selected;
var zoom;
var svg;
var dezoomed;
var linkIteration = 0.5; // between 0 and 1
var linkStrength = 0.01;
var linkDistance = 100;
var velocityDecay = 0.51;
var repulsion = -37;
var maxRepulsion = -1.1;
var gravityX = 0.003;
var gravityY = 0.01;
var distanceMin = 0.5;
var distanceMax = 10000;
var distanceStrength = -100000; //default is -30

var dragXStart = 0;
var dragYStart = 0;
var gScaleX = 0;
var gScaleY = 0;
var alphaDecay = 0.009;
var alphaTarget = 1.5;
var alphaMin = 0.11;
var r = 5.5;
var collideStrength = 0.3;
var collideIteration = 0.1;
var startX = 0;
var startY = 0;
var fontSize = "";
var fontSizeZoomed = "42px";
var zoomTrshld = 3.5;
var zoomTrshld2x = 0.6;
var scaleExtent = [0.01, 10];
var rotation = 0;
var scale = 1;

var holder;


var inputZoom;
var inputAngle;
(function () {
    var ua = navigator.userAgent,
        iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
        typeOfCanvas = typeof HTMLCanvasElement,
        nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
        textSupport = nativeCanvasSupport &&
            (typeof document.createElement('canvas').getContext('2d').fillText == 'function');

    labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
    nativeTextSupport = labelType == 'Native';
    useGradients = nativeCanvasSupport;
    animate = !(iStuff || !nativeCanvasSupport);
})();

function init() {
    var rect = d3.select("svg").node().getBoundingClientRect();
    svg = d3.select("svg");
    width = rect.width;
    height = rect.height;
    startX = width / 2;
    startY = height / 2;

    svg.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    color = d3.scaleOrdinal(d3.schemeCategory10);

    gScale = svg.append("g");
    gTranslate = gScale.append("g")
        .attr("transform", "translate(" + startX + "," + startY + ")");
    gAngle = gTranslate.append("g");
    holder = gAngle;
    svg.call(d3.zoom()
        .extent([
            [0, 0],
            [width, height]
        ])
        .scaleExtent(scaleExtent)
        .on("zoom", zoomed));

    zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom", zoomed);

    // setup zoom slider
    inputZoom = d3.select("#input-zoom")
        .datum({})
        .attr("type", "range")
        .attr("min", zoom.scaleExtent()[0])
        .attr("max", zoom.scaleExtent()[1])
        .attr("step", (zoom.scaleExtent()[1] - zoom.scaleExtent()[0]) / 100)
        .attr("value", 1)
        .on("input", slided);

    // setup angle slider
    inputAngle = d3.select("#input-angle").on("input", function () {
        rotation = +this.value;
        rotateGraph(+this.value);
    });
}


function initGraph() {
    simulation = d3.forceSimulation(graph.nodes)
        .force("charge", d3.forceManyBody().distanceMax(distanceMax).strength(distanceStrength))
        .force("link", d3.forceLink())
        .force("collide", d3.forceCollide().radius(d => getRadius(d)).iterations(3))
        .force("center", d3.forceCenter() ) 
        .alphaDecay(alphaDecay)
        .on("tick", ticked);
    /*     simulation = d3.forceSimulation(graph.nodes)
            .force("charge", d3.forceManyBody().strength((d) => (isLeaf(d) ? maxRepulsion : repulsion)).distanceMin(distanceMin).distanceMax(distanceMax))
            .force("link", d3.forceLink().distance(linkDistance).strength(linkStrength).iterations(linkIteration))
            .force('x', d3.forceX().strength(gravity))
            .force('y', d3.forceY().strength(gravity))
            .alphaDecay(alphaDecay)
            .alphaMin(alphaMin)
            .velocityDecay(velocityDecay)
            .force("collision", d3.forceCollide(r + 0.5).strength(collideStrength).iterations(collideIteration))
            .on("tick", ticked); */

    gGraph = holder.append("g").attr("id", "graph");
    mLink = gGraph.append("g").attr("class", "mlinks").selectAll(".mlink");
    link = gGraph.append("g").attr("class", "links").selectAll(".link");
    node = gGraph.append("g").attr("class", "nodes").selectAll(".node");
    text = gGraph.append("g").attr("class", "text-node").selectAll(".text-node");


    restart(true);
    //test();
}


var menu = [{
    title: 'get links',
    action: function (elm, d, i) {
        customHierarchy(d);
    }
}, {
    title: '---------------'
}, {
    title: 'Remove Node',
    action: function (elm, d, i) {
        recurseDelete(d);

        restart();
    }
}];

function restart(resimulate) {


    // Apply the general update pattern to the links.

    node = node.data(graph.nodes, function (d) {
        return d.id;
    });

    node.exit().each(function () {
        d3.select(this).remove();
    });

    var nodeEnter = node.enter().append("g")
        .attr("id", (d) =>
            "name" + d.id
        ).attr("name", (d) => d.name)
        .on('contextmenu', d3.contextMenu(menu));

    nodeEnter
        .on('mouseover', mouseOverHandler)
        .on('mouseout', mouseOutHandler)
        .on("click", clicked)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    nodeEnter.append("circle")
        .attr("fill", function (d) {
            return color(d.group);
        });





    node = nodeEnter.merge(node);

    // Apply the general update pattern to the links.

    link = link.data(graph.links, function (d) {
        return d.source.id + "-" + d.target.id;
    });

    link.exit().remove();

    link = link.enter().append("line").merge(link);

    // Apply the general update pattern to the meta-links.

    mLink = mLink.data(graph.mLinks, function (d) {
        return d.source.id + "-" + d.target.id;
    });

    mLink.exit().remove();

    mLink = mLink.enter().append("line").merge(mLink);

    // Apply the general update pattern to the text-node.



    text = text.data(graph.nodes, function (d) {
        return d.id;
    });

    text.exit().each(function () {
        d3.select(this).remove();
    });

    var textEnter = text.enter()
        .append("text")
        .attr("class", "text-content")
        .text(function (d) {
            return d.name;
        })
        .attr('x', 12)
        .attr('y', 3).attr("font-size", fontSize);



    text = textEnter.merge(text);

    // Update and start the simulation.
    simulation.nodes(graph.nodes);
    simulation.force("link").links(graph.links);

    if (resimulate == true) {
        simulation.alpha(alphaTarget);
        simulation.restart();
    }


    zoomGraph();
    rotateGraph();
}


function getRadius(metadata) {

    var count = Math.pow(getMetaLink(metadata), 3)   + 5;
    return count;
}

function rotateGraph() {

    // adjust the text on the range slider
    d3.select("#angle-value")
        .text(rotation);
    inputAngle
        .property("value", rotation);
    // rotate the graph

    // rotate the graph
    gAngle
        .attr("transform", "  rotate(" + rotation + ")");
}

function zoomGraph() {

    // 100 * (1 - 1)/2
    // 100 * (1 - 0.5)/2

    //gScale.attr("transform", "scale(" + scale + ") ");
    // adjust the text, get 2 decimal places, put it on the range slider
    d3.select("#zoom-value")
        .text((Math.round(scale * 100) / 100).toFixed(2));


    d3.selectAll(".text-content")
        .attr("font-size", function (d) {
            var size = 24;
            if (shouldShow(d)) {
                size = size / scale;
            } else if (scale > 1) {
                size = size / scale;
            } else {
                size = 0;
            }

            return size + "px";
        });

}

function zoomed() {

    var value = d3.event.transform.k;
    gScale.attr("transform", d3.event.transform); // updated for d3 v4

    inputZoom.property("value", value);
    zoomValue(value);

}

function slided(d) {
    var value = d3.select(this).property("value");
    gScale.attr("transform", "scale(" + value + ")");
    zoomValue(value);
}

function zoomValue(value) {
    scale = value;
    inputZoom.text(scale);

    zoomGraph();

}

function ticked() {

    mLink
        .attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });

    node
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    text
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ") rotate(" + -rotation + ")";
        });

    node
        .selectAll("circle")
        .attr("r", data => getRadius(data));

    link
        .attr("x1", function (d) {
            return d.source.x;
        })
        .attr("y1", function (d) {
            return d.source.y;
        })
        .attr("x2", function (d) {
            return d.target.x;
        })
        .attr("y2", function (d) {
            return d.target.y;
        });


}


function dragstarted(d) {

    d3.select(this).raise();
    svg.attr("cursor", "grabbing");
    if (d3.select(this).node().nodeName == "svg") {
        dragXStart = d3.event.x;
        dragYStart = d3.event.y;
    }
}

function dragged(d) {

    if (d3.select(this).node().nodeName == "svg") {
        var x = startX - (dragXStart - d3.event.x) / scale;
        var y = startY - (dragYStart - d3.event.y) / scale;
        gTranslate.attr("transform", "translate(" + x + "," + y + ") ")

    } else {
        simulation.alpha(1);
        simulation.restart();

        d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
    }
}

function dragended() {
    gTranslate.attr("cursor", "grab");
    if (d3.select(this).node().nodeName == "svg") {
        startX -= (dragXStart - d3.event.x) / scale;
        startY -= (dragYStart - d3.event.y) / scale;
    }
}

function clicked() {

    var metadata = d3.select(this).data()[0];
    metadata.selected = !metadata.selected;
    selected = metadata.selected;
    // open link
    //higlightNeighbours(metadata);
    d3.event.stopPropagation();
    var link = 'http://' + lang + '.wikipedia.org/wiki/' + metadata.name;
    window.open(link, '_blank');

}

function mouseOutHandler() {
    var metadata = d3.select(this).data()[0];
    if (!selected) {
        deselectNeighbours();
    }
}

function mouseOverHandler() {
    var metadata = d3.select(this).data()[0];
    //higlightNeighbours(metadata);
}

function higlightNeighbours(metadata) {
    var mLinks = graph.mLinks.filter(link => link.source.id == metadata.id);

    node.selectAll("circle")
        .attr("class", (d) => {
            return (mLinks.filter(link => link.target.id == d.id || d.id == link.source.id).length > 0) ? "highlight" : "";
        });

    mLink
        .attr("class", (d) => (mLinks.filter(link => d.source.id == link.source.id).length > 0) ? "highlight" : "");

    text.selectAll("text")
        .attr("class", (d) => {
            return (mLinks.filter(link => link.target.id == d.id || d.id == link.source.id).length > 0) ? "highlight" : "";
        });

    zoomGraph();
}

function deselectNeighbours() {
    node.selectAll("circle").attr("class", "");
    text.selectAll("text").attr("class", "")
    mLink.attr("class", "");
    zoomGraph();
}


 
function dblclick(d) {
    var value = d3.select(this).classed("fixed")
    d3.select(this).classed("fixed", !value);

    d3.event.stopPropagation();
}


function mouseTest() {

}

function test() {
    var a = {
        id: "a",
        name: "a"
    },
        b = {
            id: "b",
            name: "b"

        },
        c = {
            id: "c",
            name: "c"

        },
        nodes = [a, b, c],
        links = [];
    d3.timeout(function () {
        links.push({
            source: a,
            target: b
        }); // Add a-b.
        links.push({
            source: b,
            target: c
        }); // Add b-c.
        links.push({
            source: c,
            target: a
        }); // Add c-a.
        restart({
            "nodes": nodes,
            "links": links
        });
    }, 1000);

    d3.interval(function () {
        nodes.pop(); // Remove c.
        links.pop(); // Remove c-a.
        links.pop(); // Remove b-c.
        restart({
            "nodes": nodes,
            "links": links
        });
    }, 2000, d3.now());

    d3.interval(function () {
        nodes.push(c); // Re-add c.
        links.push({
            source: b,
            target: c
        }); // Re-add b-c.
        links.push({
            source: c,
            target: a
        }); // Re-add c-a.
        restart({
            "nodes": nodes,
            "links": links
        });
    }, 2000, d3.now() + 1000);


}