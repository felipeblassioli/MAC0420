var TriangleMesh = function(vertices, normals, centroid, bbox){
	Model.prototype.constructor.call( this );

	this.vertices = vertices || [];
	this.normals = normals || [];
	this.centroid = centroid;

	this.bbox = new BoundingBox( this, bbox );
	this.boundingSphere = this.getBoundingSphere();
	this.activeManipulator = new TranslationManipulator( this, this.boundingSphere.radius );
	//this.activeManipulator = new TranslationManipulator(this.cent, this.boundingSphere.radius);
	//this.activeManipulator = new RotationManipulator(this);

	console.log("centroid: "+centroid);
	console.log("bbox.center: "+this.bbox.center);
	console.log("bSphere.center: "+this.boundingSphere.center);

	this.translationMatrix = mat4(
		[1, 0, 0, -this.centroid[0]/2 ],
		[0, 1, 0, -this.centroid[1]/2 ],
		[0, 0, 1, -this.centroid[2]/2 ],
		[0, 0, 0, 1 ]  
	);
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

/*
	c = new Circle(this.bbox.center, this.boundingSphere.radius * 0.5, 0, true);
	c._render(gl, program);*/
}

TriangleMesh.prototype.select = function(){
	this.isSelected = true;
	this.bbox.isSelected = true;
}

TriangleMesh.prototype.unselect = function(){
	this.isSelected = false;
	this.bbox.isSelected = false;
}