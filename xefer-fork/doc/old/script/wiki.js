var rgraphic;
var lang = 'en';

var rotate = 0;
var spread = 50;
var maxLink = 1;

$(document).ready(function () {

   lang = $('#lang').val();
   rgraphic = init();
   rgraphic.canvas.getElement().oncontextmenu = function () {
      return true
   };

   var parser = function () {
      console.log(maxLink);

      var names = $('#articleName').val().split(',');

      for (i = 0; i < names.length; i++) {
         console.log(names[i].page);

         loadArticle(names[i]).then(function (metadata) {
            console.log(metadata);
            
            process(metadata, maxLink).then(function (val) {
               var nameList = val;
               for (var j = 0; j < nameList.length; j++) {
                  loadArticle(nameList[j].page);
               }
            });
         });


      }
      return false;
   };

   $('#title').submit(parser);
   $('#submit').click(parser);

   $('#random').click(function () {
      loadRandomArticle();
      return false;
   });

   continuous('#left', function () {
      rotaterr(1);
   });

   continuous('#right', function () {
      rotaterr(-1);
   });

   continuous('#spread', function () {
      spreader(-1);
   });

   continuous('#squeeze', function () {
      spreader(1);
   });

   $('#image').click(function () {
      window.open(rgraphic.print());
   });

   $('#info').click(function () {
      window.open("/2011/05/wikipedia");
   });

   $('#lang').change(function () {
      lang = $('#lang').val();
      $('#test').val("");
      rgraphic.graph.empty();
      rgraphic.loadJSON(root[lang]);
      rgraphic.refresh();
   });

   $('#branch').change(function () {
      maxLink = $('#branch').val();
      if (maxLink == "max") {
         maxLink = -1;
      }
   });


   $(window).resize(function () {
      $('#opening').css('width', $(window).width() - 10).css('height', $(window).height() - 135);
      $('#infovis').css('width', $(window).width() + 500).css('height', $('#opening').height() + 1000);
      $('#infovis').css('left', -250).css('top', -250);
      rgraphic.canvas.resize($('#infovis').width(), $('#infovis').height());
      replot();
   });

   rgraphic.loadJSON(root[lang]);

   $(window).resize();

   // excanvas work-around...
   $('#infovis-canvas>div').css('overflow', '');
   rgraphic.graph.eachNode(function (n) {
      var pos = n.getPos();
      pos.setc(0, -400);
   });
   rgraphic.compute('end');
   rgraphic.fx.animate({
      modes: ['polar'],
      duration: 1500
   });
});

function continuous(btn, action) {
   var interval;

   $(btn).mousedown(function () {
      interval = setInterval(action, 150);
   }).mouseup(function () {
      clearInterval(interval);
   }).mouseout(function () {
      clearInterval(interval);
   }).click(function () {
      clearInterval(interval);
      action();
   });
};

function rotaterr(inc) {
   rotate = (rotate + inc) % 100;
   replot();
}

function spreader(inc) {
   spread = (spread + inc) % 100;
   replot();
}

function replot() {
   rgraphic.compute('current');
   rgraphic.graph.eachNode(function (n) {
      position = n.getPos('current');
      position.theta = plotter(position);
   });
   rgraphic.plot();
}

function plotter(position) {
   return position.theta = (Math.PI * 2) * ((100 - rotate) / (100)) - (position.theta * ((100 - spread) / 100)) + (Math.PI) * ((100 - spread) / 100) - (Math.PI / 2);
}

async function loadArticle(title, previousMetadata) {
   $.getJSON(
      "https://" + lang + ".wikipedia.org/w/api.php?callback=?", {
         titles: title,
         action: "query",
         prop: "revisions",
         rvprop: "content",
         format: "json"
      },
      function (data) {
         return extractField(data, previousMetadata);
      }
   );
}

function extractField(data, previousMetadata) {
   if (!data.query) return null;
   var page = data.query.pages;
   var metadata;
   for (i in page) {
      var title = page[i].title;
      var pageid = page[i].pageid;
      if (page[i].revisions == null) {
         addToScroll(10000, page[i].title + " (Not Found)");
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

function loadRandomArticle() {
   $.getJSON(
      "https://" + lang + ".wikipedia.org/w/api.php?callback=?", {
         rnlimit: "1",
         action: "query",
         rnnamespace: "0",
         list: "random",
         format: "json"
      },
      function (data) {
         extractRandomTitle(data)
      }
   );
}

function extractRandomTitle(data) {
   var title = data.query.random[0].title;
   var current = $('#test').val();
   var first = $.trim(current).length == 0;
   var newval = title + (first ? "" : ",") + current;
   $('#test').val(newval);
   loadArticle(title);
}

function addToScroll(fade, name) {
   var spanner = $('<div class="scroll">' + name + '<br/></div>')
   $('#listing').append(spanner);
   $('#listing>div').fadeOut(fade, function () {
      $(this).remove();
   });
}

function entry(text, metadata) {
   if (displayNode(text, metadata)) {
      return;
   }

   var cleared = false;
   while (!cleared) {
      if (isNoteStart(text)) {
         text = clearLine(text);
      } else if (isDataBlock(text, "{")) {
         text = clearDataBlock(text, "{", "}");
      }
      // can be a problem if this is the first bit of text; need to see a counter example
      else if (isDataBlock(text, "[")) {
         text = clearDataBlock(text, "[", "]");
      } else if (isInfoBox(text)) {
         text = clearInfoBox(text);
      } else if (isDivInfoBox(text)) {
         text = clearDivInfoBox(text);
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

function displayNode(text, metadata) {
   var graph = rgraphic.graph;
   var atExistingNode = (graph.getNode(metadata.id) != null);

   addToScroll(3000, metadata.name + (atExistingNode ? " &middot;" : ""));

   if (!atExistingNode) {
      graph.addNode(metadata);
      graph.addAdjacence(graph.getNode(metadata.id), graph.getNode(root[lang].id));
   }

   if (metadata.previous != null) {
      graph.removeAdjacence(metadata.previous.id, root[lang].id);
      graph.addAdjacence(graph.getNode(metadata.id), graph.getNode(metadata.previous.id));
   }

   rgraphic.compute('end');
   graph.eachNode(function (n) {
      position = n.getPos('end');
      position.theta = plotter(position);
   });
   rgraphic.fx.animate({
      modes: ['polar'],
      duration: 1250
   });

   return atExistingNode;
}

function extractFirstLink(data, metadata) {
   var i;
   var found = false;

   while (!found) {
      if (isFileReference(data)) {
         data = clearLine(data);
      } else if (isDefinitionStart(data)) {
         data = clearDefinition(data);
      } else if (isReferenceStart(data)) {
         data = clearReference(data);
      } else if (isRedirect(data)) {
         return getRedirect(data);
      } else if (isTermBlock(data)) {
         return getTerm(data, metadata);
      } else if (isXmlComment(data)) {
         data = clearXmlComment(data);
      } else if (isDataBlock(data, "{")) {
         data = clearDataBlock(data, "{", "}");
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
   var loop = false;
   if (metadata != null) {
      var node = rgraphic.graph.getNode(metadata.id);
      node.eachSubgraph(function (node) {
         if (node.name.toLowerCase() == term.toLowerCase()) {
            loop = true;
         }
      });
   }

   return loop;
}

function isDataBlock(data, startChar) {
   return data.charAt(0) == startChar && data.charAt(1) == startChar;
}

function isTermBlock(data, startChar) {
   return isDataBlock(data, '[') && data.charAt(2) != '#'; // no internal references
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

function isDivInfoBox(data) {
   return data.indexOf("<div") == 0;
}

function clearDivInfoBox(data) {
   var html = $.parseHTML(data);

   // skip passed all non-text elements
   for (i = 0; i < html.length; i++) {
      var node = html[i];
      if (node.nodeType == 3) {
         return node.textContent;
      }
   }
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
   var indexEndTag = data.indexOf("</ref>");
   var indexSelfClose = data.indexOf("/>");
   var index;
   var size;
   if (indexSelfClose != -1 && indexSelfClose < indexEndTag) {
      index = indexSelfClose;
      size = "/>".length;
   } else {
      index = indexEndTag;
      size = "</ref>".length;
   }

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