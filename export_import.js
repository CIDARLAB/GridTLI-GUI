// This script contains the functions for importing and exporting paper.js JSON files

// This function exports the paper canvas project as a json file
function saveCanvasJson() { 
	var the_json = project.exportJSON(); 
	var data = "text/json;charset=utf-8," + 
	encodeURIComponent(JSON.stringify(the_json)); 
	
	$('<a href="data:' + data + '"download="data.json">downloadJSON</a>').appendTo('#container');
	
}

/* // This function saves the paper.js
function saveText(text, filename){
  var a = document.createElement('a');
  a.setAttribute('href', 'data:text/plain;charset=utf-u,'+encodeURIComponent(text));
  a.setAttribute('download', filename);
  a.click()
}
 */