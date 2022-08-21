var see;
var doct;
var ls2;


async function process(metadata, langage, percent) {
  var ls = []
  //get the wikipedia plaintext with wtf_wikipedia
  //let text =  await wtf.fetch(article).then(doc=> doc.plaintext());
  if (!dictionaryLink[metadata.id]) {
    await wtf.fetch(metadata.name, langage, (err, doc) => {
      if (err || !metadata) {
        return ls;
      }
      doct = doc;

      ls = doc.links();
      dictionaryLink[metadata.id] = ls;

      first_section = doc.section(0)
      if(!first_section) return ls;
      var paragraphs = first_section.paragraphs();
      if ( paragraphs[0] && paragraphs[0].sentences()[0])
        dictionary[metadata.id] = paragraphs[0].sentences()[0].data.text;

    });
  } else {
    ls = dictionaryLink[metadata.id];
  }




  
  if (percent && ls.length > 0){
    ls = ls.slice(0,  ls.length * (percent/100) );

  }
 
  return ls;
}