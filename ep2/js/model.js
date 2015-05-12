
var Model = function(){
	this.vertices = vertices || [];
	this.normals = normals || [];
}

Model.prototype.render = function(gl, program, viewMatrix, projectionMatrix){

	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( this.getModelViewMatrix(viewMatrix) ) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( projectionMatrix ) );

	this._render( gl, program );
}

Model.prototype.getModelViewMatrix = function(viewMatrix){
	return mult( viewMatrix, this.getModelMatrix() );
}

Model.prototype.getModelMatrix = function(){
	/* View */
	var modelMatrix = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);

	return modelMatrix;
}

var TriangleMesh = function(vertices, normals, centroid, bbox){
	this.vertices = vertices || [];
	this.normals = normals || [];
	this.centroid = centroid;

	this.bbox = new BoundingBox(bbox);
	this.boundingSphere = this.getBoundingSphere();
	this.activeManipulator = new TranslationManipulator(this);
}

TriangleMesh.prototype = Object.create(Model.prototype);
TriangleMesh.prototype.constructor = TriangleMesh;
TriangleMesh.prototype.getBoundingSphereRadius = function(){
	var d = Math.sqrt(
		Math.pow( this.bbox.right[0] - this.bbox.left[0], 2 )
		+ Math.pow( this.bbox.top[1] - this.bbox.bottom[1], 2 )
		+ Math.pow( this.bbox.far[2] - this.bbox.near[2], 2 )
	);
	return d/2;
}

TriangleMesh.prototype.getBoundingSphere = function(){
	var sphere = {};
	sphere.radius = this.getBoundingSphereRadius();
	sphere.center = this.bbox.center;
	return sphere;
}

TriangleMesh.prototype._render = function(gl, program){
	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal );

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW );

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length );
}

var BoundingBox = function(bbox){
	console.log("BoundingBox.constructor!");
	this.left = bbox.left;
	this.right = bbox.right;
	this.top = bbox.top;
	this.bottom = bbox.bottom;
	this.near = bbox.near;
	this.far = bbox.far;

/*	this.bottom[1] -= 0.1;
	this.top[1] += 0.1;
	this.left[0] -= 0.1;
	this.right[0] += 0.1;
	this.near[2] -= 0.1;
	this.far[2] += 0.1;
*/
	this.center = vec3(
		(bbox.right[0] - bbox.left[0])/2.0,
		(bbox.top[1] - bbox.bottom[1])/2.0,
		(bbox.far[2] - bbox.near[2])/2.0
	);
	//this.far[2] = -1 * this.far[2];
	this.wireframe = this.getWireFrame();
}

BoundingBox.prototype = Object.create(Model.prototype);
BoundingBox.prototype.constructor = BoundingBox;
BoundingBox.prototype.render = function(gl, program, viewMatrix, projectionMatrix){

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.wireframe.vertices), gl.STATIC_DRAW );

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    

	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( this.getModelViewMatrix(viewMatrix) ) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( projectionMatrix ) );

	gl.drawArrays( gl.LINES, 0, this.wireframe.vertices.length );
}

BoundingBox.prototype.getWireFrame = function(){
	var normals = [];
	var vertices = [
		vec3( this.left[0], this.bottom[1], this.near[2] ),
		vec3( this.right[0], this.bottom[1], this.near[2] ),

		vec3( this.left[0], this.bottom[1], this.far[2] ),
		vec3( this.right[0], this.bottom[1], this.far[2] ),

		vec3( this.left[0], this.top[1], this.near[2] ),
		vec3( this.right[0], this.top[1], this.near[2] ),

		vec3( this.left[0], this.top[1], this.far[2] ),
		vec3( this.right[0], this.top[1], this.far[2] ),

		vec3( this.right[0], this.top[1], this.far[2] ),
		vec3( this.right[0], this.bottom[1], this.far[2] ),

		vec3( this.left[0], this.top[1], this.far[2] ),
		vec3( this.left[0], this.bottom[1], this.far[2] ),

		vec3( this.right[0], this.top[1], this.near[2] ),
		vec3( this.right[0], this.bottom[1], this.near[2] ),

		vec3( this.left[0], this.top[1], this.near[2] ),
		vec3( this.left[0], this.bottom[1], this.near[2] ),

		vec3( this.left[0], this.top[1], this.near[2] ),
		vec3( this.left[0], this.top[1], this.far[2] ),

		vec3( this.right[0], this.top[1], this.near[2] ),
		vec3( this.right[0], this.top[1], this.far[2] ),

		vec3( this.left[0], this.bottom[1], this.near[2] ),
		vec3( this.left[0], this.bottom[1], this.far[2] ),

		vec3( this.right[0], this.bottom[1], this.near[2] ),
		vec3( this.right[0], this.bottom[1], this.far[2] ),
	];
	vertices.forEach(function(v){
		normals.push(vec4(1.0,1.0,1.0,0.0));
	});

	return {
		vertices: vertices,
		normals: normals
	};
}

BoundingBox.prototype.intersect = function(ray){

}

var TranslationManipulator = function(model){
	this.origin = model.boundingSphere.center;
	var len = model.boundingSphere.radius * 1.0;
	this.vertices = [
		vec3(0,0,0),
		vec3(len,0,0),
		vec3(0,0,0),
		vec3(0,len,0),
		vec3(0,0,0),
		vec3(0,0,len)
	];
}

TranslationManipulator.prototype = Object.create(Model.prototype);
TranslationManipulator.prototype.constructor = TranslationManipulator;
TranslationManipulator.prototype.render = function(gl, program, viewMatrix, projectionMatrix){

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW );

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    

	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( this.getModelViewMatrix(viewMatrix) ) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( projectionMatrix ) );

	gl.drawArrays( gl.LINES, 0, this.vertices.length );
}