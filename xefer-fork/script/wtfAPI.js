var see;
var doct;
var ls2;

var dictionaryArticleLinks = new Map()



// fetch Wikipedia article by name, return list of link 
async function process(name, langage, percent) {
  var ls = []

  //if already in cache :
  if (dictionaryArticleLinks.has(name)) {
    ls = dictionaryArticleLinks.get(name);
  } else {
    //else fetch wikipedia page with links with wtf_wikipedia  
    await wtf.fetch(name, langage, (err, doc) => {
      if (err) {
        return ls;
      }
      doct = doc;

      ls = doc.links();
      ls = linkstoNames(ls);


      first_section = doc.section(0)
      if (!first_section) return ls;

    });
  } 

  dictionaryArticleLinks.set(name, ls);
 

  if (percent && ls.length > 0) {
    ls = ls.slice(0, ls.length * (percent / 100)); 
  }




  return ls;
}

function linkstoNames(articles) {
  var ls = [];
  var p;
  articles.forEach(article => {
    if (article.type() == "internal") {
      p = article.page();
      ls.push(p);
    }
  });
  return ls;
} 