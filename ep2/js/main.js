var app = app || {};

app.renderer = new Renderer();

app.init = function(){
	canvas = document.getElementById( "gl-canvas" );
	app.UI.init();
	app.renderer.init(canvas);
}

app.UI = {
	init: function(){
		console.log("app.UI.init()");
		document.getElementById('files').onchange = app.UI.onFilesChange;
	},

	onFilesChange: function(evt){
		console.log("app.UI.onFilesChange()");
		var files = evt.target.files[0]; 

		if (files) {
		    var reader = new FileReader();
		    reader.onload = function(e) { 
		        var contents = e.target.result;
		        /*selectedData = contents;
		        loadObject(selectedData);*/

		        app.renderer.loadObject(contents);
		    }
		    reader.readAsText(files);
		} else { 
		    alert("Failed to load file");
		}
	}
};


window.onload = app.init;

