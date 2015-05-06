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
	//TODO: dynamic load shader files
	this.currentProgram = initShaders(this.gl, "flat-vs", "flat-fs");
	this.gl.useProgram(this.currentProgram);

	// create light components
	var lightPosition = vec4( 10.0, 10.0, 10.0, 0.0 );
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

	this.gl.uniform4fv( this.gl.getUniformLocation(this.currentProgram, "ambientProduct"), flatten(ambientProduct) );
	this.gl.uniform4fv( this.gl.getUniformLocation(this.currentProgram, "diffuseProduct"), flatten(diffuseProduct) );
	this.gl.uniform4fv( this.gl.getUniformLocation(this.currentProgram, "specularProduct"), flatten(specularProduct) );  
	this.gl.uniform4fv( this.gl.getUniformLocation(this.currentProgram, "lightPosition"), flatten(lightPosition) );

	this.gl.uniform1f( this.gl.getUniformLocation(this.currentProgram, "shininess"), materialShininess );

}

Renderer.prototype.render = function(){
	//console.log("Render!");
	this.gl.clear( this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

	var modelViewMatrixLoc = this.gl.getUniformLocation(this.currentProgram, "modelViewMatrix");
	var projectionMatrixLoc = this.gl.getUniformLocation(this.currentProgram, "projectionMatrix");
    
	this.gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( this.getModelViewMatrix() ) );
	this.gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( this.getProjectionMatrix() ) );

	for (i = 0; i < this.loadedObjects.length; i++)
		this.loadedObjects[i].render( this.gl, this.currentProgram );
}

Renderer.prototype.tick = function(){
	//console.log("tick: "+this.getName());
	this.render();

	if(this.is_drawing) {
		requestAnimationFrame(this.tick.bind(this));
	} else {
		console.log("tick: STOP DRAWING!");
	}
}

Renderer.prototype.getProjectionMatrix = function(){
	var xleft = -1.0;
	var xright = 1.0;
	var ybottom = -1.0;
	var ytop = 1.0;
	var znear = -1.0;
	var zfar = 1.0;

	// Preserve Aspect Ratio
	var aspect = canvas.clientWidth/Math.max(1, canvas.clientHeight);
	return ortho(xleft, xright,ybottom/aspect, ytop/aspect, znear,zfar);
}

Renderer.prototype.getModelViewMatrix = function(){
	var eye = vec3(1.0, 0.0, 0.0);
	var at = vec3(0.0, 0.0, 0.0);
	var up = vec3(0.0, 1.0, 0.0);
	return lookAt(eye,at,up);
}