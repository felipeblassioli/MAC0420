var CurveRenderer = function(canvas, closed){
	Renderer.prototype.constructor.call(this, canvas);
	this.controlPoints = [];
	this.buffers.controlPoints = this.gl.createBuffer();
	this.curvePoints = [];
	this.buffers.curvePoints = this.gl.createBuffer();

	this.k = 3;
	this.totalPoints = 100;
	this.closed = closed || false;
}

CurveRenderer.prototype = Object.create(Renderer.prototype);
CurveRenderer.prototype.constructor = CurveRenderer;
CurveRenderer.prototype.initShaders = function(){
	this.programs.default = initShaders(this.gl, "2d-vs", "2d-fs");

	var defaultProgram = this.programs.default;
	var gl = this.gl;
	defaultProgram.vertexPositionAttribute = gl.getAttribLocation(defaultProgram, "vPosition");
	gl.enableVertexAttribArray(defaultProgram.vertexPositionAttribute);
	defaultProgram.fColorUniform = gl.getUniformLocation(defaultProgram, "fColor");

	this.activateProgram(defaultProgram);
}
CurveRenderer.prototype.render = function(){
	var program = this.programs.default;
	var gl = this.gl;

	gl.clear( this.gl.COLOR_BUFFER_BIT );
	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.controlPoints);
	gl.vertexAttribPointer(program.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

	gl.uniform4fv(program.fColorUniform, [1.0,1.0,1.0,1.0]);
	gl.drawArrays(gl.POINTS, 0, this.controlPoints.length);

	gl.uniform4fv(program.fColorUniform, [1.0,1.0,0.0,1.0]);
	if(this.closed)
		gl.drawArrays(gl.LINE_LOOP, 0, this.controlPoints.length);
	else
		gl.drawArrays(gl.LINE_STRIP, 0, this.controlPoints.length);

	gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.curvePoints);
	gl.vertexAttribPointer(program.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

	//gl.uniform4fv(program.fColorUniform, [0.0,1.0,1.0,1.0]);
	//gl.drawArrays(gl.POINTS, 0, this.curvePoints.length);
	gl.uniform4fv(program.fColorUniform, [1.0,1.0,1.0,1.0]);
	gl.drawArrays(gl.LINE_STRIP, 0, this.curvePoints.length);
}
CurveRenderer.prototype.unproject = function(x,y){
	var viewport_x = x;
	var viewport_y = y;

	var ray_ndc = vec3(
		(2.0*viewport_x)/this.viewport.width - 1.0,
		1.0 - (2.0*viewport_y)/this.viewport.height,
		1.0
	);
	return ray_ndc;
}
CurveRenderer.prototype.addControlPoint = function(x,y){
	var point_ndc = this.unproject(x,y);
	if(this.closed && this.controlPoints.length > this.k-1){
		for(var i=0; i < this.k-1; i++)
			this.controlPoints.pop();
	}
	this.controlPoints.push(vec2( point_ndc[0], point_ndc[1]));
	if(this.closed && this.controlPoints.length > this.k - 1){
		for(var i=0; i<this.k-1; i++)
			this.controlPoints.push(this.controlPoints[i]);
	}
	this.updateControlPoints();

	this.updateCurve();
	this.render();
}
CurveRenderer.prototype.selectControlPoint = function(x,y){
	var point_ndc = this.unproject(x,y);
	var _bounds = function(p){
		var e = 0.05;
		var bbox = {
			x1: p[0] - e,
			x2: p[0] + e,
			y1: p[1] - e,
			y2: p[1] + e
		};

		return {
			intersect: function(point_ndc){
				return ((bbox.x1 <= point_ndc[0] && point_ndc[0] <= bbox.x2) && (bbox.y1 <= point_ndc[1] && point_ndc[1] <= point_ndc[1]));
			}
		}
	}
	for(var i=0; i<this.controlPoints.length; i++){
		if(_bounds(this.controlPoints[i]).intersect(point_ndc))
			return this.controlPoints[i];
	}

	return null;
}
CurveRenderer.prototype.updateCurve = function(){
	this.curvePoints = bspline(this.k, this.controlPoints, this.totalPoints);
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.curvePoints);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten(this.curvePoints), this.gl.STATIC_DRAW);
}
CurveRenderer.prototype.updateControlPoints = function(){
	this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.controlPoints);
	this.gl.bufferData(this.gl.ARRAY_BUFFER, flatten( this.controlPoints), this.gl.STATIC_DRAW);
	this.updateCurve();
}
CurveRenderer.prototype.clear = function(){
	this.controlPoints.length = 0;
	this.updateControlPoints();

	this.render();
}

var bspline = function(k, P, totalPoints, knots){
	//http://www.ibiblio.org/e-notes/Splines/Basis.htm
	//return points for a B-spline of degree k and control points P
	// k = 2 is linear, k =3 is quadratic and k = 4 is cubic
	// for a given t value only k basis functions are non-zero
	// that is B-spline depends on k nearest-control points at any point t.
	//t is a knot vector
	if(P.length < 3) return [];
	//To make a Ck-2 continuous closed loop you need only, that the last k - 1 control points repeat the first k - 1 ones, i.e. [P0 , P1 , P2 , P0 , P1 , P2] for n = 5, k = 4 (in this applet the last 3 points are displaced a bit to make them visible).
	var N = function(i,k,t,T){
		//console.log('hah:')
		//console.log([i,k,t])
		// Cox-De-Boor recurrence. T is the knots vector.
		if(k===1){
			return (T[i] <= t && t < T[i+1])? 1.0 : 0.0;
		}else{
			return ( ( N(i,k-1, t, T)*(t-T[i])/(T[i+k-1] - T[i]) )
				+ ( N(i+1, k-1, t, T)*(T[i+k] - t)/(T[i+k] - T[i+1]) ) );
		}
	}

	var T = knots;
	if(!knots){
		T = [];
		//uniform knots vector
		var len = P.length+k;
		for(var i=0; i <= len; i++){
			T.push(i);
		}
	}
	var points = [];
	var t = 0;
	var sX = 0;
	var sY = 0;
	var step = (T[T.length-k-1] - T[k-1]) / totalPoints;
	var t = T[k-1];
	for(var c=0; c < totalPoints; c++){
		sX = 0; sY = 0;
		for(var i=0; i < P.length; i++){
			w = N(i,k,t,T);
			sX += P[i][0]*w;
			sY += P[i][1]*w;
		}
		points.push(vec2(sX,sY));

		t+=step;
	}
	return points;
}

var CurveDrawer = function(canvas,n, closed){
	this.canvas = canvas;
	this.renderer = new CurveRenderer(canvas, closed);

	document.getElementById('txt_k'+n).onchange = function(evt){
		//TODO: check number
		this.renderer.k = parseInt(evt.target.value);
		this.renderer.updateCurve();
		this.renderer.render();
	}.bind(this);

	document.getElementById('txt_segments'+n).onchange = function(evt){
		//TODO: check number
		this.renderer.totalPoints = parseInt(evt.target.value);
		this.renderer.updateCurve();
		this.renderer.render();
	}.bind(this);

	document.getElementById('bt_clear'+n).onclick = function(){
		this.renderer.clear();
	}.bind(this);

	this.canvas.addEventListener( "mousedown", this.mouseDownHandler.bind(this), false );
	this.canvas.addEventListener( "mouseup", this.mouseUpHandler.bind(this), false );
	this.canvas.addEventListener( "mousemove", this.mouseMoveHandler.bind(this), false);
}

CurveDrawer.prototype.draw = function(){
	this.renderer.render();
}

CurveDrawer.prototype.mouseDownHandler = function(evt){
	this.mousedown = true;
	var elemLeft = this.canvas.offsetLeft;
	var elemTop = this.canvas.offsetTop;

	var x = evt.pageX - elemLeft;
	var y = evt.pageY - elemTop;

	this.selectedControlPoint = this.renderer.selectControlPoint(x,y);
	if(!this.selectedControlPoint)
		this.renderer.addControlPoint(x,y);
}

CurveDrawer.prototype.mouseUpHandler = function(evt){
	this.mousedown = false;
	this.selectedControlPoint = null;
}

CurveDrawer.prototype.mouseMoveHandler = function(evt){
	if(this.mousedown === true){
		if(this.selectedControlPoint){
			var elemLeft = this.canvas.offsetLeft;
			var elemTop = this.canvas.offsetTop;

			var x = evt.pageX - elemLeft;
			var y = evt.pageY - elemTop;
			var ndc_point = this.renderer.unproject(x,y);
			this.selectedControlPoint[0] = ndc_point[0];
			this.selectedControlPoint[1] = ndc_point[1];
			this.renderer.updateControlPoints();
			this.renderer.render();
		}
	}
}
