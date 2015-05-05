var Renderer = function(){
	console.log("renderer.constructor()");
	this.is_drawing = false;
	this.gl = null;
	this.currentProgram = null;
	this.loadedObjects = [];
	this.reader = new ObjectReader();
}

Renderer.prototype.init = function(canvas){
	console.log("renderer.init()");



	this.initGL(canvas);
	this.initShaders();
}

Renderer.prototype.loadObject = function(data){
	console.log("renderer.loadedObject()");
	var obj = this.reader.loadObjFile(data);
	this.loadedObjects.push(obj);
}

Renderer.prototype.start = function(){
	console.log("renderer.start()");
}

Renderer.prototype.stop = function(){
	console.log("renderer.stop()");
}

Renderer.prototype.initGL = function (canvas){
	console.log("renderer.initGL()");
	this.gl = WebGLUtils.setupWebGL( canvas );
	if ( !this.gl ) { alert( "WebGL isn't available" ); }

	// create viewport and clear color
	this.gl.viewport( 0, 0, canvas.width, canvas.height );

	this.gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

	// enable depth testing for hidden surface removal
	this.gl.enable(this.gl.DEPTH_TEST);
}

Renderer.prototype.initShaders = function (){
	console.log("renderer.initShaders()");
	//TODO: dynamic load shader files
	this.currentProgram = initShaders(this.gl, "flat-vs", "flat-fs");
}