
var dictionaryID = new Map();
var dictionaryLinkID = new Map();
var dictionaryMetaLinkID = new Map();

var graph = {
    "nodes": [],
    "links": [],
    "mLinks": []
};


function adjacency(metadata) {
    var count = 0;
    if (!metadata.id) return count;

    graph.links.forEach(link => {
        if (link.source.id == metadata.id) {
            count++;
        }
    });
    return count;
}


function isNodeExistByName(pageName) {
    return (d3.select('[name=' + '"' + pageName + '"' + ']').size() > 0);
}

function isLinkExists(linkID) {
    return linkID in dictionaryLinkID;
}

function isLeaf(metadata) {
    return adjacency(metadata) == 0;
}


function addNode(metadata) {
    if (!dictionaryID.has(metadata.id)) {
        graph.nodes.push(metadata);
        dictionaryID.set(metadata.id, metadata);
    }
}

function getLinkID(metadataSrc, metadataDst) {
    return metadataSrc.id + "" + metadataDst.id;

}

function addLink(metadataSrc, metadataDst) {
    var linkID = getLinkID(metadataSrc, metadataDst)

    if (!dictionaryLinkID.has(linkID)) {

        graph.links.push({
            "source": metadataSrc,
            "target": metadataDst
        });

        dictionaryLinkID.set(linkID, undefined);
    }


}

function addMetaLink(metadataSrc, metadataDst) {
    var mlinkID = getLinkID(metadataSrc, metadataDst);

    if (dictionaryMetaLinkID.has(mlinkID)) {
        graph.mLinks.push({
            "source": metadataSrc,
            "target": metadataDst
        });

        dictionaryMetaLinkID.set(mlinkID, undefined);
    }

}

function recurseDelete(metadata) {

    graph.links.forEach(link => {
        if (metadata.id == link.source.id) {
            var metadataChild = d3.select('#name' + link.target.id).data()[0];

            recurseDelete(metadataChild);

        }
    });

    removeNode(metadata);

}

function removeNode(metadata) {
    graph.nodes = graph.nodes.filter(node => node.id != metadata.id);
    graph.links = graph.links.filter(link => (link.source.id != metadata.id && link.target.id != metadata.id));
    graph.mLinks = graph.mLinks.filter(link => (link.source.id != metadata.id && link.target.id != metadata.id));
    dictionaryID.delete(metadata.id);
}

function removeLink(source, destination) {
    graph.links = graph.links.filter(link => !(link.source.id == source.id && link.target.id == destination.id));
    dictionaryLinkID.delete(getLinkID(source, destination));
}

function getChildren(metadata) {
    return graph.links.filter(link => link.source.id == metadata.id);

}

function getMetaLinkCount(metadata) {
    return graph.mLinks.filter(link => link.source.id == metadata.id).length;
}

function recurseSearch(metadata, searchId) {
    var found = false;
    var children = getChildren(metadata);
    // search in children
    for (let i = 0; i < children.length && !found; i++) {
        const child = children[i].target;
        if (child.id == searchId) {
            found = true;
        }
    }

    if (!found) {
        // for each children recurseSearch
        for (let i = 0; i < children.length && !found; i++) {
            const child = children[i].target;
            found = recurseSearch(child, searchId);
        }
    }
    return found;
}


function recurse(current, mlinks) {
    graph.links.forEach(link => {
        var continueRecurse = false;
        if (!mlinks) {
            continueRecurse = true;
        } else {
            for (let i = 0; i < mlinks.length && !continueRecurse; i++) {
                const mlink = mlinks[i];
                continueRecurse = recurseSearch(dictionaryMetaLinkID.has(current.id), mlink.target.id);
            }
        }

        if (continueRecurse && current.id == link.source.id) {
            var child = {
                id: link.target.id,
                name: link.target.name,
                children: []
            };
            current.children.push(child);
        }
    });

    if (current.children.length > 0) {
        current.children.forEach(child => {
            recurse(child);
        });
    }

    // should be displayed ? 
    // criteria:
    // adjacency > 2
    // mlinks > 2
    // or leaf

    if (shouldShow(current)) {
        current.show = true;
    } else {
        current.show = false
    }
}

function shouldReallyShow(metadata) {
    return adjacency(metadata) >= 10 || getMetaLink(metadata) >= 10 || metadata.id == root.id;
}

function shouldShow(metadata) {
    return getChildren(metadata) == 0 || adjacency(metadata) >= 5 || getMetaLink(metadata) >= 5 || metadata.id == root.id;
}

function toHierarchy(mlinks) {

    var hierarchyRoot = {
        id: root.id,
        name: root.name,
        children: []
    }

    recurse(hierarchyRoot, mlinks);
    //console.log(hierarchyRoot);
    //return tree(d3.hierarchy(hierarchyRoot).sort((a, b) => d3.ascending(a.data.name, b.data.name)));
    return hierarchyRoot;
}

function metadataByName(pageName) {
    return d3.select('[name=' + '"' + pageName + '"' + "]").data()[0];
}

function metadataByID(id) {
    return d3.select('#name' + id).data()[0];
}


function clearGraph() {
    graph.links = [];
    graph.nodes = [];
    graph.mLinks = [];
}

function clearMLinks() {
    graph.mLinks = [];
}








// tests

function graphTEST() {
    var metadata1 = {
        id: 1369002155,
        name: "Philosophy"
    }

    var metadata2 = {
        id: 1369002155,
        name: "Philosophy"
    }


    addNode(metadata1);
    var test = dictionaryID.has(metadata1.id);
    console.log("TEST addNode : " + test);
    ////////////////////////////////////////////////////////////////////////////////
    removeNode(metadata1)
    test = !dictionaryID.has(metadata1.id);
    console.log("TEST removeNode : " + test);
    ////////////////////////////////////////////////////////////////////////////////
    addLink(metadata1, metadata2)
    test =  dictionaryLinkID.has(getLinkID(metadata1, metadata2));
    console.log("TEST addLink : " + test);
    ////////////////////////////////////////////////////////////////////////////////
    removeLink(metadata1, metadata2)
    test =  !dictionaryLinkID.has(getLinkID(metadata1, metadata2));
    console.log("TEST removeLink : " + test);
    ////////////////////////////////////////////////////////////////////////////////
    addMetaLink(metadata1, metadata2)
    test =  !dictionaryMetaLinkID.has(getLinkID(metadata1, metadata2));
    console.log("TEST addMetaLink : " + test);
    ////////////////////////////////////////////////////////////////////////////////
    
}

graphTEST();
