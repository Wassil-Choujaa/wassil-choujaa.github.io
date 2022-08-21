var maxLink = 5;


const VIZTYPE = {
	graph: "graph",
	wordCloud: "wordCloud",
	radialCluster: "radialCluster" 
} 

 
var vizType = VIZTYPE.wordCloud;
var typeIndex = 0; 
var aticleQueue = [];
var root;
var articleIntervalDuration = 21;
var articleLinkIntervalfloat = 7;
var lang;
var sliderController;

var rootDictionary = {
    'en': {
        id: 13692155,
        name: "Philosophy"
    },
    'de': {
        id: 490244,
        name: "Philosophie"
    },
    'fr': {
        id: 2403,
        name: "Philosophie"
    },
    'ja': {
        id: 110,
        name: "&#21746;&#23398;"
    },
    'it': {
        id: 1876512,
        name: "Filosofia"
    },
    'es': {
        id: 689592,
        name: "Filosof&iacute;a"
    },
    'ru': {
        id: 904,
        name: "&#1060;&#1080;&#1083;&#1086;&#1089;&#1086;&#1092;&#1080;&#1103;"
    }
};
var searching = false;
// contain definition of articles

// contain all article ?
var articleLink = [];
 

// main program
$(document).ready(function () { 

    lang = "en";
    loadRoot(rootDictionary[lang]);

 

    $("#submit").click(onSubmit);
    $('#title').submit(onSubmit);
 

    $('#branch').change(function () {
        maxLink = $('#branch').val();
    });

    $('#lang').change(function () {
        clearGraph();
        $('#articleName').val("");
        lang = $('#lang').val();
        loadRoot(rootDictionary[lang])
        restartVisualisation();
    });

    setInterval(processArticleQueue, articleIntervalDuration);
});

function loadRoot(node) {
    root = node;
    graph.nodes.push(node);
}

// visualisation

function restartVisualisation(resimulate) {
 
    if (vizType == VIZTYPE.graph) {
        restart(resimulate);
    } else if (vizType == VIZTYPE.radialCluster) {
        restartRadial();
    }else if (vizType == VIZTYPE.wordCloud) {
        displayWordCloud();
    }
}


function displayNode(text, metadata) {
    articleLink.push(metadata);
    var atExistingNode = dictionaryID.has(metadata);

    addToScroll(3000, metadata.name + (atExistingNode ? " (&middot;)" : ""));

    if (!atExistingNode) {

        addNode(metadata);
        addLink(metadata, root);

    }

    if (metadata.previous != null) {

        removeLink(metadata.previous, root);

        if (atExistingNode) {
            var previous = metadata.previous;
            metadata = d3.select('#name' + metadata.id).data()[0];
            metadata.previous = previous;
        }

        addLink(metadata, metadata.previous);
    }


    restartVisualisation(true);

    return atExistingNode;
}

// UI handlers
 

function addToScroll(fade, name) {
    var spanner = $('<span class="scroll">' + name + '<br/></span>')
    $('#listing').append(spanner);
    $('#listing>span').fadeOut(fade, function () {
        $(this).remove();
    });
}

// Event Handler

function onSubmit(e) {
    e.preventDefault();

    var names = $('#articleName').val().split(',');
    if (names == "") return false;

    for (i = 0; i < names.length; i++) {

        var pageName = names[i];
        aticleQueue.unshift(pageName);

    }


    return false;
}



// article processing

function processArticleQueue() {
    var link = aticleQueue.pop();
    if (link) {
        //for each article
        loadArticle(link).then(function (metadata) {
            if (metadata) { 
                process(metadata, lang, maxLink).then(function (links) { 
                    // load all articles inside it
                    for (var j = 0; j < links.length; j++) {
                        var linkName = links[j].page();
                        loadArticle(linkName);
                        if(j%100 == 0 ) processArticleLink(articleLink);

                    }
                });
            }
        })
    }
}

function processArticleLink() {
    console.log("buliding metadata links");
    if(searching) return;
    searching = true;
    var count = 0;
    articles = articleLink;
    clearMLinks();
    var interval = setInterval(() => { 
        if (count == articles.length) {
            clearInterval(interval);
            searching = false;
            restartVisualisation(true);

        } else {
            // main loop
            var article = articles[count];
            loadArticleLink(article);
        }
        count++;
    }, articleLinkIntervalfloat);
}

function updateDictionay(articleList) {

    articleList.forEach(article => {
        var metadata = metadataByName(article);
        if (metadata && shouldShow(metadata)) {
            processSummary(metadata, lang);
        }
    });
 
}




async function loadArticleLink(metadata) {
    if (!metadata) return;
    var notExist = !dictionaryID.has(metadata)
    if (notExist) return; // if deleted during async call

    process(metadata, lang).then(function (val) {
        notExist = !dictionaryID.has(metadata)
        if (notExist) return; // if deleted during async call
        var nameList = val;

        for (var j = 0; j < nameList.length; j++) {
            var linkName = nameList[j].page();
            exist = dictionaryID.hasByName(linkName)
            if (exist) {
                var metadataLink = metadataByName(linkName);
                addMetaLink(metadata, metadataLink);
            }
        }
    });


}


// loard article, return 
async function loadArticle(title, previousMetadata) {

    var metadata = metadataByName(title);

    if (!metadata) {
         
        await $.getJSON(
            "https://" + lang + ".wikipedia.org/w/api.php?callback=?", {
            titles: title,
            action: "query",
            prop: "revisions",
            rvprop: "content",
            format: "json"
        },
            function (data) {
                metadata = extractField(data, previousMetadata)
            }
        );
    } 

    return metadata;
}

function extractField(data, previousMetadata) {

    if (!data.query) return null;
    var page = data.query.pages;
    var metadata;
    for (i in page) {
        var title = page[i].title;
        var pageid = page[i].pageid;
        if (page[i].revisions == null) {
            addToScroll(10000, page[i].title + " (Non trouv&eacute;)");
            break;
        }
        var text = page[i].revisions[0]["*"];
        metadata = {
            id: pageid,
            name: title,
            previous: previousMetadata
        };
        entry(text, metadata);
        break;
    }

    return metadata;
}


function entry(text, metadata) {

    if (dictionaryID.has(metadata)) {
        return;
    }

    var cleared = false;
    while (!cleared) {
        if (isNoteStart(text)) {
            text = clearLine(text);
        } else if (isDataBlock(text, "{")) {
            text = clearDataBlock(text, "{", "}");
        } else if (isDataBlock(text, "[")) {
            text = clearDataBlock(text, "[", "]");
        } else if (isInfoBox(text)) {
            text = clearInfoBox(text);
        } else if (isNoInclude(text)) {
            text = clearNoInclude(text);
        } else if (isXmlComment(text)) {
            text = clearXmlComment(text);
        } else {
            cleared = true;
        }
    }

    loadArticle(extractFirstLink(text, metadata), metadata);
}


function mapping(position) {
    return position;
}



function extractFirstLink(data, metadata) {
    var i;
    var found = false;

    while (!found) {
        if (isNoteStart(data) || isFileReference(data)) {
            data = clearLine(data);
        } else if (isDefinitionStart(data)) {
            data = clearDefinition(data);
        } else if (isReferenceStart(data)) {
            data = clearReference(data);
        } else if (isRedirect(data)) {
            return getRedirect(data);
        } else if (isDataBlock(data, "[")) {
            return getTerm(data, metadata);
        } else {
            data = data.slice(1);
        }
    }
}

function getTerm(data, previousMetadata) {
    var regex = /\[\[([^:\]]+?)\]\]/g;
    var match;

    while (match = regex.exec(data)) {
        term = match[1];
        var index = term.indexOf("|");
        term = (index == -1) ? term : term.slice(0, index);
        index = term.indexOf("#");
        term = (index == -1) ? term : term.slice(0, index);

        if (!formsLoop(term, previousMetadata)) {
            return term;
        }
    }
}

function isRedirect(data) {
    return data.indexOf("#REDIRECT") != -1;
}

function getRedirect(data) {
    var regex = /\[\[([^:\]]+?)\]\]/g;
    var match = regex.exec(data);

    return match[1];
}

function formsLoop(term, previousMetadata) {
    var metadata = previousMetadata;

    while (metadata != null) {
        if (term.toLowerCase() == metadata.name.toLowerCase()) {
            return true;
        }
        metadata = metadata.previous;
    }

    return false;
}

function isDataBlock(data, startChar) {
    return data.charAt(0) == startChar && data.charAt(1) == startChar;
}

function isDefinitionStart(data) {
    return data.charAt(0) == "(";
}

function isInfoBox(data) {
    return data.indexOf("{|") == 0;
}

function clearInfoBox(data) {
    var index = data.indexOf("|}");
    var size = "|}".length;
    return $.trim(data.slice(index + size));
}

function isNoInclude(data) {
    return data.indexOf("<noinclude>") == 0;
}

function clearNoInclude(data) {
    var index = data.indexOf("</noinclude>");
    var size = "</noinclude>".length;
    return $.trim(data.slice(index + size));
}

function isXmlComment(data) {
    return data.indexOf("<!--") == 0;
}

function clearXmlComment(data) {
    var index = data.indexOf("-->");
    var size = "-->".length;
    return $.trim(data.slice(index + size));
}

function isReferenceStart(data) {
    return (data.indexOf("<ref ") == 0) || (data.indexOf("<ref>") == 0);
}

function clearReference(data) {
    var index = data.indexOf("</ref>");
    var size = "</ref>".length;
    return $.trim(data.slice(index + size));
}

function isNoteStart(data) {
    return data.charAt(0) == ":";
}

function clearLine(data) {
    var index = data.indexOf('\n');
    return $.trim(data.slice(index));
}

function isFileReference(data) {
    return data.indexOf("[[File:") == 0 || data.indexOf("[[Image:") == 0;
}

function clearDefinition(data) {
    var j, count = 1;
    for (j = 1; j < data.length; j++) {
        if (data.charAt(j) == "(") {
            count++
        }
        if (data.charAt(j) == ")") {
            count--;
        }

        if (count == 0) {
            data = $.trim(data.slice(j + 1));
            return data;
        }
    }
}

function clearDataBlock(data, startChar, endChar) {
    var j, count = 2;
    for (j = 2; j < data.length; j++) {
        if (data.charAt(j) == startChar) {
            count++
        }
        if (data.charAt(j) == endChar) {
            count--;
        }

        if (count == 0) {
            data = $.trim(data.slice(j + 1));
            return data;
        }
    }
}