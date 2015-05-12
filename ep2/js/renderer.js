/*Object.prototype.getName = function() { 
   var funcNameRegex = /function (.{1,})\(/;
   var results = (funcNameRegex).exec((this).constructor.toString());
   return (results && results.length > 1) ? results[1] : "";
};*/
function invert4x4 (matrix) {
  var m = [];
  m = matrix[0].concat(matrix[1], matrix[2], matrix[3]);
  console.log(m);
  var r = [];
  
  r[0] = m[5]*m[10]*m[15] - m[5]*m[14]*m[11] - m[6]*m[9]*m[15] + m[6]*m[13]*m[11] + m[7]*m[9]*m[14] - m[7]*m[13]*m[10];
  r[1] = -m[1]*m[10]*m[15] + m[1]*m[14]*m[11] + m[2]*m[9]*m[15] - m[2]*m[13]*m[11] - m[3]*m[9]*m[14] + m[3]*m[13]*m[10];
  r[2] = m[1]*m[6]*m[15] - m[1]*m[14]*m[7] - m[2]*m[5]*m[15] + m[2]*m[13]*m[7] + m[3]*m[5]*m[14] - m[3]*m[13]*m[6];
  r[3] = -m[1]*m[6]*m[11] + m[1]*m[10]*m[7] + m[2]*m[5]*m[11] - m[2]*m[9]*m[7] - m[3]*m[5]*m[10] + m[3]*m[9]*m[6];

  r[4] = -m[4]*m[10]*m[15] + m[4]*m[14]*m[11] + m[6]*m[8]*m[15] - m[6]*m[12]*m[11] - m[7]*m[8]*m[14] + m[7]*m[12]*m[10];
  r[5] = m[0]*m[10]*m[15] - m[0]*m[14]*m[11] - m[2]*m[8]*m[15] + m[2]*m[12]*m[11] + m[3]*m[8]*m[14] - m[3]*m[12]*m[10];
  r[6] = -m[0]*m[6]*m[15] + m[0]*m[14]*m[7] + m[2]*m[4]*m[15] - m[2]*m[12]*m[7] - m[3]*m[4]*m[14] + m[3]*m[12]*m[6];
  r[7] = m[0]*m[6]*m[11] - m[0]*m[10]*m[7] - m[2]*m[4]*m[11] + m[2]*m[8]*m[7] + m[3]*m[4]*m[10] - m[3]*m[8]*m[6];

  r[8] = m[4]*m[9]*m[15] - m[4]*m[13]*m[11] - m[5]*m[8]*m[15] + m[5]*m[12]*m[11] + m[7]*m[8]*m[13] - m[7]*m[12]*m[9];
  r[9] = -m[0]*m[9]*m[15] + m[0]*m[13]*m[11] + m[1]*m[8]*m[15] - m[1]*m[12]*m[11] - m[3]*m[8]*m[13] + m[3]*m[12]*m[9];
  r[10] = m[0]*m[5]*m[15] - m[0]*m[13]*m[7] - m[1]*m[4]*m[15] + m[1]*m[12]*m[7] + m[3]*m[4]*m[13] - m[3]*m[12]*m[5];
  r[11] = -m[0]*m[5]*m[11] + m[0]*m[9]*m[7] + m[1]*m[4]*m[11] - m[1]*m[8]*m[7] - m[3]*m[4]*m[9] + m[3]*m[8]*m[5];

  r[12] = -m[4]*m[9]*m[14] + m[4]*m[13]*m[10] + m[5]*m[8]*m[14] - m[5]*m[12]*m[10] - m[6]*m[8]*m[13] + m[6]*m[12]*m[9];
  r[13] = m[0]*m[9]*m[14] - m[0]*m[13]*m[10] - m[1]*m[8]*m[14] + m[1]*m[12]*m[10] + m[2]*m[8]*m[13] - m[2]*m[12]*m[9];
  r[14] = -m[0]*m[5]*m[14] + m[0]*m[13]*m[6] + m[1]*m[4]*m[14] - m[1]*m[12]*m[6] - m[2]*m[4]*m[13] + m[2]*m[12]*m[5];
  r[15] = m[0]*m[5]*m[10] - m[0]*m[9]*m[6] - m[1]*m[4]*m[10] + m[1]*m[8]*m[6] + m[2]*m[4]*m[9] - m[2]*m[8]*m[5];

  var det = m[0]*r[0] + m[1]*r[4] + m[2]*r[8] + m[3]*r[12];
  
  for (var i = 0; i < 16; i++) 
      r[i] /= det;

  var result = mat4();
  result[0] = [r[0], r[1], r[2], r[3]];
  result[1] = [r[4], r[5], r[6], r[7]];
  result[2] = [r[8], r[9], r[10], r[11]];
  result[3] = [r[12], r[13], r[14], r[15]];

  return result;
}

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

	/*this.viewport = {
		width: canvas.width,
		height: canvas.height
	};*/
	this.cvtb = new CanvasVTB(canvas);
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

	var viewMatrix = this.getViewMatrix();
	var projectionMatrix = this.getProjectionMatrix();

	for (i = 0; i < this.loadedObjects.length; i++){
		this.activateProgram( this.programs.model );
		this.loadedObjects[i].render( this.gl, this.currentProgram, viewMatrix, projectionMatrix );

		this.activateProgram( this.programs.wireframe );
		this.loadedObjects[i].bbox.render( this.gl, this.currentProgram, viewMatrix, projectionMatrix );

		if(this.loadedObjects[i].activeManipulator)
			this.loadedObjects[i].activeManipulator.render( this.gl, this.currentProgram, viewMatrix, projectionMatrix );
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
		this.cvtb.setWinSize( this.viewport.width, this.viewport.height );
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

function _perspective( left, right, bottom, top, near, far ){
    return mat4(
        vec4( (2*near)/(right-left), 0, (right+left)/(right-left), 0 ),
        vec4( 0, (2*near)/(top-bottom), (top+bottom)/(top-bottom), 0 ),
        vec4( 0, 0, -(far+near)/(far-near), (-2*far*near)/(far-near) ),
        vec4( 0, 0, -1, 0)
    );
}

function _makeFrustrum(fovY, aspectRatio, front, back){
    var DEG2RAD = 3.14159265 / 180;
    var tangent = Math.tan(fovY/2*DEG2RAD);
    var height = front * tangent;
    var width = height * aspectRatio;

    return _perspective(-width,width, -height, height, front, back);
}

Renderer.prototype.getProjectionMatrix = function(){
	var canvas = this.canvas;
	var aspect = canvas.clientWidth/Math.max(1, canvas.clientHeight);
	var near = 3.0;
	var far = 7.0;
	var fovy = 45.0;

	return _makeFrustrum(fovy, aspect, near, far);

}

Renderer.prototype.getViewMatrix = function(){
	var eye = vec3(1.25, 3.25, +5.5);// the position of your camera, in world space
	var at = vec3(0.0, 0.0, 0.0); // where you want to look at, in world space
	var up = vec3(0.0, 1.0, 0.0);  // probably glm::vec3(0,1,0), but (0,-1,0) would make you looking upside-down, which can be great too

	var viewMatrix = lookAt(eye,at,up);

	return viewMatrix;
}

Renderer.prototype.unproject = function(viewport_x, viewport_y){
	/* ViewPort to NDC */
	var ray_ndc = vec3(
		(2.0*viewport_x)/this.viewport.width - 1.0,
		1.0 - (2.0*viewport_y)/this.viewport.height,
		1.0
	);

	console.log("win_x="+viewport_x+" ; win_y="+viewport_y);
	console.log("width="+this.viewport.width+" ; height="+this.viewport.height);
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
	//vec4 ray_eye = inverse (projection_matrix) * ray_clip;
	//ray_eye = vec4 (ray_eye.xy, -1.0, 0.0);

/*	vec3 ray_wor = (inverse (view_matrix) * ray_eye).xyz;
	// don't forget to normalise the vector at some point
	ray_wor = normalise (ray_wor);*/

	//vec3 ray_wor = (inverse (view_matrix) * ray_eye).xyz; // don't forget to normalise the vector at some point ray_wor = normalise (ray_wor);
/*
This should balance the up-and-down, left-and-right, and forwards components for us. So, assuming our camera is looking directly along the -Z world axis, we should get [0,0,-1] when the mouse is in the centre of the screen, and less significant z values when the mouse moves around the screen. This will depend on the aspect ratio, and field-of-view defined in the view and projection matrices. We now have a ray that we can compare with surfaces in world space. */
}