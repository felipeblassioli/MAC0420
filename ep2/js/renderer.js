var Renderer = function(){
	console.log("renderer.constructor()");
	this.is_drawing = false;
	this.gl = null;
	this.currentProgram = null;
	this.loadedObjects = [];
	this.reader = new ObjectReader();
	this.programs = {};
	this.activeObject;

	this.viewScaleZ = 0.0;

	this.activeCamera = new Camera(
		vec3( 0, 0, 4.0 ),
		vec3( 0.0, 0.0, 0.0 ), 
		vec3( 0.0, 1.0, 0.0 )
	);
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
	if(this.activeObject)
		this.activeObject.unselect();
	this.activeObject = obj;
	this.activeObject.select();

	//this.render();
}

Renderer.prototype.removeSelectedObject = function(){
	console.log("renderer.loadedObject()");

	var index = this.loadedObjects.indexOf(this.activeObject);
	console.log("Index to be removed: "+index);
	this.loadedObjects.splice(index, 1);
	this.switchSelectedObject();

	//this.render();
}

Renderer.prototype.switchSelectedObject = function(){
	var index = this.loadedObjects.indexOf(this.activeObject);
	var newIndex = ((index + 1) >= this.loadedObjects.length) ? 0 : (index + 1);
	
	console.log("index: "+index+" newIndex: "+newIndex);
	if(this.loadedObjects.length > 0 ){
		this.activeObject.unselect();
		this.activeObject = this.loadedObjects[newIndex];
		this.activeObject.select();
	}else{
		this.activeObject = null;
	}

	//this.render();
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
	this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

	var viewMatrix = this.getViewMatrix();
	var projectionMatrix = this.getProjectionMatrix();

	for (i = 0; i < this.loadedObjects.length; i++){
		this.activateProgram( this.programs.model );
		this.loadedObjects[i].render( this.gl, this.currentProgram, viewMatrix, projectionMatrix );

	/*	this.activateProgram( this.programs.wireframe );
		this.loadedObjects[i].bbox.render( this.gl, this.currentProgram, viewMatrix, projectionMatrix );

		if(this.loadedObjects[i].activeManipulator)
			this.loadedObjects[i].activeManipulator.render( this.gl, this.currentProgram, viewMatrix, projectionMatrix );
	*/}
	if(this.activeObject){
		this.activateProgram( this.programs.wireframe );
		this.activeObject.bbox.render( this.gl, this.currentProgram, viewMatrix, projectionMatrix );

		if(this.activeObject.activeManipulator)
			this.activeObject.activeManipulator.render( this.gl, this.currentProgram, viewMatrix, projectionMatrix );
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
	//console.log("tick");
	this.render();

	if(this.is_drawing) {
		requestAnimationFrame(this.tick.bind(this));
	} else {
		console.log("tick: STOP DRAWING!");
	}
}

Renderer.prototype.getProjectionMatrix = function(){
	var canvas = this.canvas;
	var aspect = canvas.clientWidth/Math.max(1, canvas.clientHeight);
	var near = 0.1;
	var far = 100;
	var fovy = 45.0;

	return _makeFrustrum(fovy, aspect, near, far);

}

Renderer.prototype.getViewMatrix = function(){
	var viewMatrix = this.activeCamera.getViewMatrix();
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

var Camera = function( eye, at, up ){
	this.eye = eye;
	this.at = at;
	this.up = up;

	this.q = new Quaternion();
}

Camera.prototype.constructor = Camera;
Camera.prototype.getViewMatrix = function(){
	return lookAt( this.eye, this.at, this.up );;
}

Camera.prototype.scale = function( startW, endW ){

	var pixel_diff, ZOOM_SCALE;
	var dx = startW[0] - endW[0];
	var dy = startW[1] - endW[1];

	pixel_diff = dy;
	ZOOM_SCALE = 1.0 / (1.0 * app.renderer.viewport.height);

	var s = pixel_diff * ZOOM_SCALE;

/*	this.scaleMatrix[0][0] += s;
	this.scaleMatrix[1][2] += s;
	this.scaleMatrix[1][2] += s;*/
	this.eye[2] += s;
}

Camera.prototype.rotate = function( startW, endW ){

	var start = app.renderer.cvtb.getTrackBallVector( startW[0], startW[1] );
	var end = app.renderer.cvtb.getTrackBallVector( endW[0], endW[1] );

	var axis = end.clone().cross( start ).nor();
	var dis = 0 - end.clone().sub( start ).len()*2;
/*
	console.log("Rotate from "+startW+" to "+endW);
	console.log("\tRotate from "+start+" to "+end);*/
	var curRP = new Quaternion();
	curRP.fromAxisAngle(axis, dis);
	this.q = curRP.multiply(this.q);

	var temp = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);
	if(this.q===null || this.q===undefined){
		return temp;
	}

	this.eye = multv( this.q.makeRotationFromQuaternion(), this.eye );
}