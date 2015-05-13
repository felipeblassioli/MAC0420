
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
	this.q = new Quaternion();
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
	/* mvMatrix = TranslationMatrix * RotationMatrix * ScaleMatrix */
	/* Translation is the LAST transformation applied */
	this.modelMatrix = this.scaleMatrix;
	this.modelMatrix = mult( this.rotationMatrix, this.modelMatrix );
	this.modelMatrix = mult( this.translationMatrix, this.modelMatrix );

	return this.modelMatrix;
}

Model.prototype.getModelViewMatrix = function(viewMatrix){
	this.modelViewMatrix = mult( viewMatrix, this.getModelMatrix() );
	return this.modelViewMatrix;
}

Model.prototype.translate = function( startW, endW, axis ){
	this.selectedAxis = axis;

	var pixel_diff;
	var temp = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);
	if(startW===null || endW===null){
		return temp;
	}

	var _axis = axis || 0;
	switch(_axis){
		case 0:
			pixel_diff = startW[0] - endW[0];
			pixel_diff /= app.renderer.viewport.width;
			break;
		case 1:
			pixel_diff = startW[1] - endW[1];
			pixel_diff /= app.renderer.viewport.height;
			break;
		case 2:
			pixel_diff = startW[1] - endW[1];
			pixel_diff /= app.renderer.viewport.height;
			break;
	}
	//console.log("Translate from "+startW+" to "+endW);

	//console.log( "pixel_diff= "+ pixel_diff );
	/*var t = length( sub( startW, endW ) );
	console.log("t="+t);*/
	this.translationMatrix[_axis][3] += pixel_diff;
}

Model.prototype.rotate = function( startW, endW, axis ){
	this.selectedAxis = axis;

	var start = app.renderer.cvtb.getTrackBallVector( startW[0], startW[1] );
	var end = app.renderer.cvtb.getTrackBallVector( endW[0], endW[1] );

	var axis = end.clone().cross( start ).nor();
	var dis = 0 - end.clone().sub( start ).len()*2;

/*	console.log("Rotate from "+startW+" to "+endW);
	console.log("\tRotate from "+start+" to "+end);*/
	var curRP = new Quaternion();
	curRP.setFromAxisAngle(axis, dis);
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
	this.rotationMatrix = this.q.makeRotationFromQuaternion();
}

/*Model.prototype._toNDC = function( )*/
Model.prototype.scale = function( startW, endW, axis ){
	this.selectedAxis = axis;

	var pixel_diff;
	var ZOOM_SCALE = 1.0 / (12.0 * app.renderer.viewport.height);

	var dx = startW[0] - endW[0];
	var dy = startW[1] - endW[1];
	//var pixel_diff = Math.sqrt( (dx*dx)/app.renderer.viewport.width + (dy*dy)/app.renderer.viewport.height );
	
	//console.log("pixel_diff="+pixel_diff);

/*	http://web.cse.ohio-state.edu/~crawfis/Graphics/VirtualTrackball.html
	pixel_diff = point.x - lastPoint.x;
	zoom_factor = 1.0 + pixel_diff * m_ZOOMSCALE;
	glScalef( zoom_factor, zoom_factor, zoom_factor );*/

	//var s = 1.0 + pixel_diff * ZOOM_SCALE;
	
/*	this.scaleMatrix[0][0] += s;
	this.scaleMatrix[1][1] += s;
	this.scaleMatrix[2][2] += s;*/

	switch(axis){
		case 0:
			pixel_diff = dx;
			break;
		case 1:
			pixel_diff = dy;
			break;
		case 2:
			pixel_diff = dy;
			break;
	}
	var s = pixel_diff * ZOOM_SCALE;
	this.scaleMatrix[axis][axis] += s;
}