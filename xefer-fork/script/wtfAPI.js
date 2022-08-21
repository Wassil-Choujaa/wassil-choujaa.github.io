var see;
var doct;
var ls2;

var dictionaryArticleLinks = {}

// fetch Wikipedia article by ID, return list of link
async function process(id, langage, percent) {
  var ls = []
  //get the wikipedia plaintext with wtf_wikipedia
  //let text =  await wtf.fetch(article).then(doc=> doc.plaintext());
  if (!dictionaryArticleLinks[id]) {
    await wtf.fetch(id, langage, (err, doc) => {
      if (err || !id) {
        return ls;
      }
      doct = doc;

      ls = doc.links();

   
      ls = linkstoNames(ls);

      dictionaryArticleLinks[id] = ls;

      first_section = doc.section(0)
      if(!first_section) return ls; 
       
    });
  } else {
    ls = dictionaryArticleLinks[id];
  }
 

  
  if (percent && ls.length > 0){
    ls = ls.slice(0,  ls.length * (percent/100) );

  }
 
  return ls;
}


function linkstoNames(articles) {
  var ls = []; 
  var p ;
  articles.forEach(article => {  
    if(article.type() =="internal"){ 
      p = article.page();
      ls.push(p);
    }
  });

  return ls;
}


 