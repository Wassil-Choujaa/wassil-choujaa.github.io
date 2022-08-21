

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

$(document).ready(function () {

    lang = "en";
    // set root node
    root = node;
    graph.nodes.push(node);
    HandleEvents();
    setInterval(processArticleQueue, articleIntervalDuration);
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
}

function onLanguageChange() {
    clearGraph();
    $('#articleName').val("");
    lang = $('#lang').val();
    loadRoot(rootDictionary[lang])
    restartVisualisation();
}


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


// WIKIPEDIA LINKS PROCESSING

/* 
    process each article from the articleQueue list at a rate of 
    %articleInterval%
*/
function processArticleQueue() {
    var link = aticleQueue.pop();
    if (link) {
        //for each article
        loadArticle(link).then(function (metadata) {
            if (metadata) {
                process(metadata, lang, maxLink).then(function (links) {

                    // process all links
                    for (var j = 0; j < links.length; j++) {
                        var linkName = links[j].page();
                        loadArticle(linkName);
                        if (j % 100 == 0) processArticleLink(articleLink);

                    }
                });
            }
        })
    }
}

/* 
    for each link in the base article, get all the links

*/
function processArticleLink(articleLink) {
    console.log("buliding metadata links");
    if (searching) return;
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


