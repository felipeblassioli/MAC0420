var app = app || {};

app.renderer = new Renderer();

app.init = function(){
	canvas = document.getElementById( "gl-canvas" );
	app.UI.init();
	app.renderer.init(canvas);
	
	var help = "";
	help += "Aperte X para deletar o objeto selecionado. <br />";
	help += "Aperte T para transladar o objeto selecionado. <br />";
	help += "Aperte R para rotacionar o objeto selecionado. <br />";
	help += "Aperte S para escalar o objeto selecionado. <br />";
	help += "Botao ESQUERDO do mouse para rotacionar a camera. <br />";
	help += "Botao DIREITO do mouse para rotacionar a camera. <br />";

	app.showMessage(help);

	app.renderer.start();
}

app.UI = {
	init: function(){
		console.log("app.UI.init()");
		document.getElementById('files').onchange = app.UI.onFilesChange;
		//document.getElementById('gl-canvas').onclick = app.UI.onCanvasClick;
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
	},

	onCanvasClick: function(evt){
		var elemLeft = document.getElementById('gl-canvas').offsetLeft;
		var elemTop = document.getElementById('gl-canvas').offsetTop;

		var x = evt.pageX - elemLeft;
		var y = evt.pageY - elemTop;

		console.log("canvas ("+x+", "+y+")");

		var ray = app.renderer.unproject(x,y);
		//var dir = subtract( ray[1], ray[0] );
/*		console.log("Ray:");
		console.log(ray);*/
		// Collision detection between clicked offset and element.
		/*elements.forEach(function(element) {
		if (y > element.top && y < element.top + element.height 
		&& x > element.left && x < element.left + element.width) {
		alert('clicked an element');
		}
		});*/
/*https://github.com/sinisterchipmunk/jax/blob/d544efe78691593743ee72956ca6b670d013d37e/doc/input/using-mouse-to-interact-with-models.coffee*/
/*@mouse_pressed = (e) ->
ray = @activeCamera.unproject e.x, e.y
direction = vec3.subtract [], ray[1], ray[0]
@light.enabled = false
@sphere.mesh.eachTriangle (tri) =>
if tri.intersectRay(ray[0], direction, dest = [])
console.log "Point clicked: [#{dest[0]}, #{dest[1]}, #{dest[2]}] (distance: #{dest[3]})"
@light.enabled = true
null
*/
	}
};

app.showMessage = function(msg){
	document.getElementById("messages").innerHTML = msg;
}

app.clearMessages = function(){
	app.showMessage("");
}

window.onload = app.init;

