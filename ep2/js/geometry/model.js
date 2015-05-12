
var Model = function(){
	this.vertices = [];
	this.normals = [];
	this.isSelected = false;

	this.modelViewMatrix = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);
	this.scaleMatrix = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);
	this.rotationMatrix = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);
	this.translationMatrix = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);
}

Model.prototype.constructor = Model;
Model.prototype.render = function(gl, program, viewMatrix, projectionMatrix){

	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( this.getModelViewMatrix(viewMatrix) ) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( projectionMatrix ) );

	this._render( gl, program );
}

Model.prototype.getModelMatrix = function(){
	/* TranslationMatrix * RotationMatrix * ScaleMatrix */
	/* Translation is LAST */
	this.modelMatrix = this.scaleMatrix;
	this.modelMatrix = mult( this.rotationMatrix, this.modelMatrix );
	this.modelMatrix = mult( this.translationMatrix, this.modelMatrix );

	return this.modelMatrix;
}

Model.prototype.getModelViewMatrix = function(viewMatrix){
	this.modelViewMatrix = mult( viewMatrix, this.getModelMatrix() );
	return this.modelViewMatrix;
}

Model.prototype.translate = function( startW, endW ){
	var temp = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);
	if(startW===null || endW===null){
		return temp;
	}
	//console.log("Translate from "+startW+" to "+endW);
	var pixel_diff = startW[0] - endW[0];

	//pixel_diff = (2.0*pixel_diff)/width - 1.0;
	pixel_diff /= app.renderer.viewport.width;
	console.log( "pixel_diff= "+ pixel_diff );
	/*var t = length( sub( startW, endW ) );
	console.log("t="+t);*/
	if(pixel_diff)
		this.translationMatrix[0][3] += pixel_diff;
}

