var see;
var doct;
var ls2;
async function process(article, percent) {
  //get the wikipedia plaintext with wtf_wikipedia
  //let text =  await wtf.fetch(article).then(doc=> doc.plaintext());
  let doc =  await wtf.fetch(article);
  doct = doc;
  //get all the nouns from the text
  //let nouns = nlp(text).nouns()
  //sort them by frequency
  //var ls = nouns.out('topk').slice(0,percent);
  var ls = doc.section(0).links();
  var seeAlsoSection = doc.sections('See also');
  var secondSection = doc.sections(1);
 
  if(percent && percent != -1)
    ls = ls.slice(0,percent);
  if(secondSection){
    ls = ls.concat(secondSection.links().slice(0,percent));   
  }
  if(seeAlsoSection){
    ls = ls.concat(seeAlsoSection.links().slice(0,percent));    
  }
  return ls;
}
