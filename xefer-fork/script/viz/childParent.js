var navcontainer;
var data;

function initChildParent() {
    navcontainer = d3.select("#listvis-container > nav");
    var element = document.querySelector('#listvis-container')

    // And pass it to panzoom

    restartChildParent();
}


function displayList(element, parent) {
    var currentUl;
    if (element.show) {
        var current = parent.append("li");
        var a = current.append("a").text(element.name)
            .attr("href", 'http://' + lang + '.wikipedia.org/wiki/' + element.name)
            .attr("target", "_blank");

        if (dictionary[element.id]) {
            var span = current.append("span").text(dictionary[element.id]);
            a.on("mouseover", span.attr("class", "active"));
            a.on("mouseout", span.attr("class", ""))
        }
        currentUl = current.append("ul");
    } else {
        currentUl = parent;
    }

    if (element.children) {
        element.children.forEach(child => {

            displayList(child, currentUl);
        });
    }
}

function restartChildParent() {

    data = toHierarchy();
    navcontainer.select("ul").remove();
    var parent = navcontainer.append("ul").attr("class", "list");

    displayList(data, parent);
}


function customHierarchy(metadata) {


    data = toHierarchy(getMetaLink(metadata));

    

    var parent = navcontainer.append("ul").attr("class", "list");

    displayList(data, parent);
}