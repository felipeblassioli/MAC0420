var Renderer = function(canvas, programs, defaultProgramName){
	this.canvas = canvas;
	this.programs = programs || {};
	this.defaultProgramName = defaultProgramName;
	this.buffers = {};
	
	this.initGL();
	this.initShaders();
}

Renderer.prototype.initGL = function(){
	var canvas = this.canvas;
	this.gl = WebGLUtils.setupWebGL(canvas);
	if(!this.gl){ alert("WebGL isn't available!"); }

	this.gl.viewport(0, 0, canvas.width, canvas.height);
	this.viewport = {
		width: canvas.width,
		height: canvas.height
	};(0,0,canvas.width, canvas.height);
	this.gl.clearColor(0,0,0,1);

	this.gl.enable(this.gl.DEPTH_TEST);
}

Renderer.prototype.activateProgram = function(program){
	this.gl.useProgram(program);
	this.activeProgram = program;
	if(program.init)
		program.init(this.gl)
}

Renderer.prototype.resizeIfNeeded = function(){
	// Get the canvas from the WebGL context
	var canvas = this.gl.canvas;

	// Lookup the size the browser is displaying the canvas.
	var displayWidth = canvas.clientWidth;
	var displayHeight = canvas.clientHeight;

	// Check if the canvas is not the same size.
	if (canvas.width != displayWidth ||
		canvas.height != displayHeight) {

		// Make the canvas the same size
		canvas.width = displayWidth;
		canvas.height = displayHeight;

		// Set the viewport to match
		this.gl.viewport(0, 0, canvas.width, canvas.height);
		this.viewport = {
			width: canvas.width,
			height: canvas.height
		};
	}
}
