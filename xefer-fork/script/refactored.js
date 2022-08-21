var depth = 2;
var articleIntervalDuration = 21;
var linksIntervalDuration = 2500;

var aticleQueue = [];
var maxLink = 5; //in percent
var linkRankDict = new Map(); // list of all article sorted by rank where rank is defined by amount of intralinks it has
var updating = false;



$(document).ready(function () {
    lang = "en";
    // set root node
    root = node;
    graph.nodes.push(node);
    HandleEvents();
    setInterval(processArticleQueue, articleIntervalDuration);
    setInterval(processLinksAlgorithm, linksIntervalDuration);

});


// EVENT HANDLERS

function HandleEvents() {
    $("#submit").click(onSubmit);
    $('#title').submit(onSubmit);
    $('#branch').change(onPercentChange);
    $('#lang').change(onLanguageChange);
}

function onPercentChange() {
    maxLink = $('#branch').val();
    console.log(maxLink);

}

function onLanguageChange() {
    clearGraph();
    $('#articleName').val("");
    lang = $('#lang').val();
}


function onSubmit(e) {
    e.preventDefault();

    var names = $('#articleName').val().split(',');
    if (names == "") return false;

    for (i = 0; i < names.length; i++) {
        var pageName = names[i];
        aticleQueue.unshift([pageName, 1]);
    }


    return false;
}


// WIKIPEDIA LINKS & ARTICLE PROCESSING

/* 
    process each article from the articleQueue list at a rate of 
    %articleInterval%
*/
function processArticleQueue() {
    if (aticleQueue.length == 0 ) {
        processLinksAlgorithm()
        updating = false;
        return;
    };
    var article = aticleQueue.pop();
    if(!article) return;
    updating = true;
    var name = article[0];
    addToScroll(3000, name);
    var currentDepth = article[1];
    if (currentDepth > depth) return;
    process(name, lang, maxLink).then(function (links) {
        // process all links
        links.forEach(link => {
            aticleQueue.unshift([link, currentDepth++]);
        });
    });
}


/* 
    for each article, find all links between him and all existing article in dictionary O(n2)  
*/
function processLinksAlgorithm() {
    if (!updating) return;
    // main loop
    dictionaryArticleLinks.forEach((links, name) => { 
        searchLinks(name); 
    })
    // display result

    ls = []

    linkRankDict.forEach((links, name) => { 
        ls.push({text:name, size:links.length})
    })

    displayWordCloud(ls)
}

function searchLinks(name1) {
    dictionaryArticleLinks.forEach((links, name2) => {
        if (name1 != name2) {
            links.forEach(link => {
                if (name1 == link) { // we found a link between two article (name1, name2) 
                    addIntraLink(name1, name2);
                }
            });
        }
    });
}


function addIntraLink(source, dest) {
    if (linkRankDict.has(source)) {
        var list = linkRankDict.get(source);
        if (!list.includes(dest)) list.push(dest);
        linkRankDict.set(source, list)
    } else {
        linkRankDict.set(source, [dest]);
    }
}


// USER INTERFACE

function addToScroll(fade, name) {
    var spanner = $('<span class="scroll">' + name + '<br/></span>')
    $('#listing').append(spanner);
    $('#listing>span').fadeOut(fade, function () {
        $(this).remove();
    });
}









