var BoundingBox = function( model, bbox ){
	Model.prototype.constructor.call( this );

	this.model = model;

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
		(bbox.right[0] + bbox.left[0])/2.0,
		(bbox.top[1] + bbox.bottom[1])/2.0,
		(bbox.far[2] + bbox.near[2])/2.0
	);
	//this.center = vec3(0,0,0);
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
    

	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( this.model.getModelViewMatrix(viewMatrix) ) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( projectionMatrix ) );
	gl.uniform4fv( gl.getUniformLocation(program, "fColor"), flatten( vec4( 1.0, 1.0, 0.0, 1.0 ) ) );

	gl.lineWidth(1.0);
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

BoundingBox.prototype.getCenter = function(){
	/*this.center = vec3(
		(this.right[0] + this.left[0])/2.0,
		(this.top[1] + this.bottom[1])/2.0,
		(this.far[2] + this.near[2])/2.0
	);*/
	this.center = this.model.centroid;
	this.center = multv( this.model.modelMatrix, this.center );
	return this.center;
}

function multv (m, v){
	var result = [];
	var i,j;

	for(i=0; i<v.length; i++)
		result[i] = 0.0;
	for(i=0 ; i < v.length; i++)
		for(j=0; j<v.length; j++)
			result[i] += m[i][j] * v[j];
	return result;
}