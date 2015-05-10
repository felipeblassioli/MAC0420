/*Object.prototype.getName = function() { 
   var funcNameRegex = /function (.{1,})\(/;
   var results = (funcNameRegex).exec((this).constructor.toString());
   return (results && results.length > 1) ? results[1] : "";
};*/

var Renderer = function(){
	console.log("renderer.constructor()");
	this.is_drawing = false;
	this.gl = null;
	this.currentProgram = null;
	this.loadedObjects = [];
	this.reader = new ObjectReader();
	this.programs = {};
}

Renderer.prototype.init = function(canvas){
	console.log("renderer.init()");
	this.canvas = canvas;
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
	if(!this.is_drawing){
		this.is_drawing = true;
		this.tick();
	} else
		console.log("renderer.start: Already drawing!");
}

Renderer.prototype.stop = function(){
	console.log("renderer.stop()");
	if(this.is_drawing){
		this.is_drawing = false;
	}
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
	this.programs.model = initShaders(this.gl, "flat-vs", "flat-fs");
	this.programs.model.init = function(gl){
		// create light components
		var lightPosition = vec4( 0.5, 1.25, -15.5, 0.0 );
		var lightAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
		var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
		var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

		var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
		var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
		var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
		var materialShininess = 100.0;
		var ambientProduct = mult(lightAmbient, materialAmbient);
	    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
	    var specularProduct = mult(lightSpecular, materialSpecular);

		gl.uniform4fv( gl.getUniformLocation(this, "ambientProduct"), flatten(ambientProduct) );
		gl.uniform4fv( gl.getUniformLocation(this, "diffuseProduct"), flatten(diffuseProduct) );
		gl.uniform4fv( gl.getUniformLocation(this, "specularProduct"), flatten(specularProduct) );  
		gl.uniform4fv( gl.getUniformLocation(this, "lightPosition"), flatten(lightPosition) );

		gl.uniform1f( gl.getUniformLocation(this, "shininess"), materialShininess );

	};
	
	this.programs.wireframe = initShaders(this.gl, "wireframe-vs", "wireframe-fs");
	this.activateProgram(this.programs.model);
}

Renderer.prototype.activateProgram = function(program){
	this.currentProgram = program;
	this.gl.useProgram(program);
	if(program.init)
		program.init(this.gl);
}

Renderer.prototype.render = function(){
	//console.log("Render!");
	//this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
	this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

	for (i = 0; i < this.loadedObjects.length; i++){
		this.activateProgram( this.programs.model );
		this.loadedObjects[i].render( this.gl, this.currentProgram, this.canvas );

		this.activateProgram( this.programs.wireframe );
		this.loadedObjects[i].bbox.render( this.gl, this.currentProgram, this.canvas );
	}
}

Renderer.prototype.resizeIfNeeded = function(){
/*	 
http://cs.nyu.edu/~yap/classes/visual/01f/lect/l2/
Here is a typical use of viewport: suppose you have an image to display and it has a particular aspect ratio R = Width/Height. If the user resize the window to a different aspect ratio, the image will be distorted. To avoid this, you set up the display callback function to use a viewport with the correct ratio R, and that is maximized to fit the current window. See [Hill, Chap.3.2.2, p.92].
*/
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

Renderer.prototype.tick = function(){
	//console.log("tick: "+this.getName());
	this.resizeIfNeeded();
	this.render();

	if(this.is_drawing) {
		requestAnimationFrame(this.tick.bind(this));
	} else {
		console.log("tick: STOP DRAWING!");
	}
}

Renderer.prototype.getProjectionMatrix = function(){

	/*We’re now in Camera Space. This means that after all theses transformations, a vertex that happens to have x==0 and y==0 should be rendered at the center of the screen. But we can’t use only the x and y coordinates to determine where an object should be put on the screen : its distance to the camera (z) counts, too ! For two vertices with similar x and y coordinates, the vertex with the biggest z coordinate will be more on the center of the screen than the other.
	*/
	var aspect = canvas.clientWidth/Math.max(1, canvas.clientHeight);

/*	var xleft = -1.0;
	var xright = 1.0;
	var ybottom = -1.0;
	var ytop = 1.0;
	var znear = -1.0;
	var zfar = 1.0;

	// Preserve Aspect Ratio
	return ortho(xleft, xright,ybottom/aspect, ytop/aspect, znear,zfar);
*/
	var near = -1.0;
	var far = 1.0;
	var fovy = 45.0;
	/*// Generates a really hard-to-read matrix, but a normal, standard 4x4 matrix nonetheless
	glm::mat4 projectionMatrix = glm::perspective(
	    FoV,         // The horizontal Field of View, in degrees : the amount of "zoom". Think "camera lens". Usually between 90° (extra wide) and 30° (quite zoomed in)
	    4.0f / 3.0f, // Aspect Ratio. Depends on the size of your window. Notice that 4/3 == 800/600 == 1280/960, sounds familiar ?
	    0.1f,        // Near clipping plane. Keep as big as possible, or you'll get precision issues.
	    100.0f       // Far clipping plane. Keep as little as possible.
	);*/
/*
We went from Camera Space (all vertices defined relatively to the camera) to Homogeneous Space 
(all vertices defined in a small cube. Everything inside the cube is onscreen).*/
	return perspective(fovy, 1/aspect, near, far);
}

Renderer.prototype.getModelViewMatrix = function(){
	var eye = vec3(1.0, 0.0, 0.0);// the position of your camera, in world space
	var at = vec3(0.0, 0.0, 0.0); // where you want to look at, in world space
	var up = vec3(0.0, 1.0, 0.0);  // probably glm::vec3(0,1,0), but (0,-1,0) would make you looking upside-down, which can be great too

	return lookAt(eye,at,up);
}

Renderer.prototype.unproject = function(viewport_x, viewport_y){
	/* ViewPort to NDC */
	var ray_ndc = vec3(
		(2.0*viewport_x)/this.viewport.width - 1.0,
		1.0 - (2.0*viewport_y)/this.viewport.height,
		1.0
	);

	console.log("ray_ndc: "+ray_ndc);
	/* NDC to Homogeneus Coordinates */
	var ray_clip = vec4(
		ray_ndc[0],
		ray_ndc[1],
		-1.0,
		1.0
	);
	console.log("ray_clip: "+ray_clip);
	/* Homogeneus Coordinates to Eye Coordinates */
	//var ray_eye = 
}