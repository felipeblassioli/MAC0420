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

var Model = function(vertices, normals, centroid, bbox){
	this.vertices = vertices || [];
	this.normals = normals || [];
	this.centroid = centroid;

	this.bbox = new BoundingBox(bbox);
	this.boundingSphere = this.getBoundingSphere();
}

Model.prototype.getBoundingSphereRadius = function(){
	var d = Math.sqrt(
		Math.pow( this.bbox.right[0] - this.bbox.left[0], 2 )
		+ Math.pow( this.bbox.top[1] - this.bbox.bottom[1], 2 )
		+ Math.pow( this.bbox.far[2] - this.bbox.near[2], 2 )
	);
	return d/2;
}

Model.prototype.getBoundingSphere = function(){
	var sphere = {};
	sphere.radius = this.getBoundingSphereRadius();
	sphere.center = this.bbox.center;
	return sphere;
}

Model.prototype.render = function(gl, program, canvas){

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

	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( this.getModelViewMatrix() ) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( this.getProjectionMatrix(canvas) ) );

	gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length );

	this.bbox.render(gl, program, canvas);
}

Model.prototype.getModelViewMatrix = function(){
	var eye = vec3(0.5, 1.25, -5.5);// the position of your camera, in world space
	//var eye = vec3(0.0, 0.0, -4.0);
	//var eye = vec3(0.0,0.0,0.0);
	var at = vec3(0.0, 0.0, 0.0); // where you want to look at, in world space
	var up = vec3(0.0, 1.0, 0.0);  // probably glm::vec3(0,1,0), but (0,-1,0) would make you looking upside-down, which can be great too

	/* View */
	var modelViewMatrix = lookAt(eye,at,up);

/*Vector3d toEye = Vector3d.Normalize(eye - target);

Next determine the distance to move along this vector based on the field of view and the point cloud's radius:

double sin = Math.Sin(Math.Min(fieldOfViewX, fieldOfViewY) * 0.5);
double distance = (radius / sin);

Finally position the eye:

eye = target + (distance * toEye);
*/
	/*var target = this.boundingSphere.center;
	var toEye = normalize( vec3( subtract( eye, target ) ) );
	var sin = Math.sin( Math.min( fovY, fovX ) * 0.5 );
	var dist = (radius/sin);

	eye = add(target, mult(distance, toEye) );
	*/
	/* modelMatrix = TranslationMatrix * RotationMatrix * ScaleMatrix */

/*	modelViewMatrix = mult(
		modelViewMatrix,
		mat4(
			[1, 0, 0, -this.centroid[0]/2 ],
			[0, 1, 0, -this.centroid[1]/2 ],
			[0, 0, 1, -this.centroid[2]/2 ],
			[0, 0, 0, 1 ]  )
	);

	var s = 1/this.radius;
	modelViewMatrix = mult(
		modelViewMatrix,
		mat4(
			[s, 0, 0, 0 ],
			[0, s, 0, 0 ],
			[0, 0, s, 0 ],
			[0, 0, 0, 1 ]  )
	);*/

	return modelViewMatrix;
}


Model.prototype.getProjectionMatrix = function(canvas){
	var aspect = canvas.clientWidth/Math.max(1, canvas.clientHeight);
	var near = 3.0;
	var far = 7.0;
	var fovy = 45.0;

	return _makeFrustrum(fovy, aspect, near, far);

/*	var xleft = -1.0;
	var xright = 1.0;
	var ybottom = -1.0;
	var ytop = 1.0;
	var znear = -1.0;
	var zfar = 1.0;

	// Preserve Aspect Ratio
	return ortho(xleft, xright,ybottom/aspect, ytop/aspect, znear,zfar);
*/
/*	var xleft = -1.0;
	var xright = 1.0;
	var ybottom = -1.0;
	var ytop = 1.0;
	var znear = -1.0;
	var zfar = 1.0;

	// Preserve Aspect Ratio
	return ortho(xleft, xright,ybottom/aspect, ytop/aspect, znear,zfar);
*/
}

var BoundingBox = function(bbox){
	console.log("BoundingBox.constructor!");
	this.left = bbox.left;
	this.right = bbox.right;
	this.top = bbox.top;
	this.bottom = bbox.bottom;
	this.near = bbox.near;
	this.far = bbox.far;

	//this.near[2] = -1 * this.near[2];
	this.bottom[1] -= 0.1;
	this.top[1] += 0.1;
	this.left[0] -= 0.1;
	this.right[0] += 0.1;
	this.near[2] -= 0.1;
	this.far[2] += 0.1;

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
BoundingBox.prototype.render = function(gl, program, canvas){
	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.wireframe.normals), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal );

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.wireframe.vertices), gl.STATIC_DRAW );

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( this.getModelViewMatrix() ) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( this.getProjectionMatrix(canvas) ) );

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