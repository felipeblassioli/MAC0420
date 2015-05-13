var TranslationManipulator = function( model ){
	Model.prototype.constructor.call( this );
	this.model = model;
}

TranslationManipulator.prototype = Object.create(Model.prototype);
TranslationManipulator.prototype.constructor = TranslationManipulator;
TranslationManipulator.prototype.render = function(gl, program, viewMatrix, projectionMatrix){

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten( this.getVertices() ), gl.STATIC_DRAW );

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	var modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
	var projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    
	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten( viewMatrix ) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten( projectionMatrix ) );

	var fColorLoc = gl.getUniformLocation(program, "fColor");

	// x
	if(this.model.selectedAxis == 0 || this.model.selectedAxis == -1)
		gl.lineWidth(5.0);
	else
		gl.lineWidth(1.0);
	gl.uniform4fv( fColorLoc, flatten( vec4( 1.0, 0.0, 0.0, 1.0 ) ) );
	gl.drawArrays( gl.LINES, 0, 2 );

	// y
	if(this.model.selectedAxis == 1 || this.model.selectedAxis == -1)
		gl.lineWidth(5.0);
	else
		gl.lineWidth(1.0);
	gl.uniform4fv( fColorLoc, flatten( vec4( 0.0, 0.0, 1.0, 1.0 ) ) );
	gl.drawArrays( gl.LINES, 2, 2 );

	// z
	if(this.model.selectedAxis == 2 || this.model.selectedAxis == -1)
		gl.lineWidth(5.0);
	else
		gl.lineWidth(1.0);
	gl.uniform4fv( fColorLoc, flatten( vec4( 0.0, 1.0, 0.0, 1.0 ) ) );
	gl.drawArrays( gl.LINES, 4, 2 );

/*	gl.drawArrays( gl.TRIANGLES, 6, 9 );*/

}

TranslationManipulator.prototype.getVertices = function(){
	var c = this.model.bbox.getCenter();
	var center = vec3(c[0],c[1],c[2]);
	var len = this.model.boundingSphere.radius * 1.5;

	var x = add( center, vec3(len,0,0) );
	var y = add( center, vec3(0,len,0) );
	var z =add( center, vec3(0,0,len) );
	/* arrow length */
	var al = 0.1;

	//console.log("Center is "+center);
	this.vertices = [
		center, x,
		center, y,
		center, z/*,
		add( x, vec3( al, 0, 0 ) ),
		add( x, vec3( 0, al, 0 ) ),
		add( x, vec3( 0, 0, al ) ),
		add( y, vec3( al, 0, 0 ) ),
		add( y, vec3( 0, al, 0 ) ),
		add( y, vec3( 0, 0, al ) ),
		add( z, vec3( al, 0, 0 ) ),
		add( z, vec3( 0, al, 0 ) ),
		add( z, vec3( 0, 0, al ) )*/
	];
	//this.vertices = [];
	return this.vertices;
}

var RotationManipulator = function(model){
	var r = model.boundingSphere.radius;
	var c = model.boundingSphere.center;
	this.circles = [
		new Circle( c, r, 0 ),
		new Circle( c, r, 1 ),
		new Circle( c, r, 2 )
	];
}

RotationManipulator.prototype = Object.create(Model.prototype);
RotationManipulator.prototype.constructor = RotationManipulator;
RotationManipulator.prototype._render = function(gl,program){
	this.circles.forEach( function( c ) {
		c._render( gl, program );
	});
}

var Circle = function(center, radius, axis, filled){
	Model.prototype.constructor.call( this );
	this.filled = typeof filled !== 'undefined' ? filled : false;

	var numTris = 100;
	var degPerTri = (2 * Math.PI) / numTris;

	this.vertices = [];
	if(this.filled)
		//this.vertices.push( vec3(0,0,0) );
		this.vertices.push( center );

	for(var i = 0; i <= numTris; i++) {
		var angle = degPerTri * i;
		switch(axis){
			case 0:
				this.vertices.push( add( center, vec3( 0, radius * Math.cos(angle), radius * Math.sin(angle) ) ) );
				break;
			case 1:
				this.vertices.push( add ( center, vec3( radius * Math.cos(angle), 0, radius * Math.sin(angle) ) ) );
				break;
			case 2:
				this.vertices.push( add( center, vec3( radius * Math.cos(angle), radius * Math.sin(angle), 0 ) ) );
				break;
		}
		
	}
}

Circle.prototype = Object.create(Model.prototype);
Circle.prototype.constructor = Circle;
Circle.prototype._render = function( gl, program ){
	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW );
	
	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	if(this.filled)
		gl.drawArrays( gl.TRIANGLE_FAN, 0, this.vertices.length );
	else
		gl.drawArrays( gl.LINE_STRIP, 0, this.vertices.length );
}