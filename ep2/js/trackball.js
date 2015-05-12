var Vector = function(x, y, z) {

	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
};

Vector.prototype = {

	len : function() {
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	},

	nor : function() {
		var length = this.len();
		if (length == 0) {
			this.x = 0;
			this.y = 0;
			this.z = 0;
		} else {
			this.x = this.x / length;
			this.y = this.y / length;
			this.z = this.z / length;
		}
		return this;
	},

	clone : function() {
		return new Vector(this.x, this.y, this.z);
	},

	cross : function(a) {
		var x = this.x, y = this.y, z = this.z;
		this.x = y * a.z - z * a.y;
		this.y = z * a.x - x * a.z;
		this.z = x * a.y - y * a.x;
		return this;
	},

	sub : function(a) {
		this.x = this.x-a.x;
		this.y = this.y-a.y;
		this.z = this.z-a.z;
		return this;
	},
};

var Quaternion = function(x, y, z, w) {
	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
	this.w = (w !== undefined) ? w : 1;
};

Quaternion.prototype = {
	x : 0,
	y : 0,
	z : 0,
	w : 0,

	setFromAxisAngle : function(axis_normal_vector, angle) {
		var halfAngle = angle / 2; 
		var factor = Math.sin(halfAngle);
		this.x = axis_normal_vector.x * factor;
		this.y = axis_normal_vector.y * factor;
		this.z = axis_normal_vector.z * factor;
		this.w = Math.cos(halfAngle);
		return this;
	},

	//reference: THREE.js
	multiply : function(b) {
		var qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
		var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

		this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		return this;
	},

	//reference: THREE.js
	makeRotationFromQuaternion : function() {
		var x = this.x, y = this.y, z = this.z, w = this.w;
		var x2 = x + x, y2 = y + y, z2 = z + z;
		var xx = x * x2, xy = x * y2, xz = x * z2;
		var yy = y * y2, yz = y * z2, zz = z * z2;
		var wx = w * x2, wy = w * y2, wz = w * z2;

		//var result = Matrix.I(4);

		result = mat4(
			vec4( 1 - (yy + zz), xy - wz, xz + wy, 0 ),
			vec4( xy + wz, 1 - (xx + zz), yz - wx, 0 ),
			vec4( xz - wy, yz + wx, 1 - (xx + yy), 0 ), 
			vec4( 0, 0, 0, 1 )
		);

		return result;
	},
};

var VirtualTrackBall = function(){};

VirtualTrackBall.prototype = {

	setWinSize:function(width, height){
		this.width = width;
		this.height = height;
		this.r = this.min(width, height)/2;
		this.q = new Quaternion();
		this.start;
	},
	
	getTrackBallVector:function(win_x, win_y){
		/*
		* Treat the mouse position as the projection of a point on the hemi-sphere 
		* down to the image plane (along the z-axis), and determine that point on 
		* the hemi-sphere
		*
		* http://web.cse.ohio-state.edu/~crawfis/Graphics/VirtualTrackball.html
		*/
		var x,y,z;
/*		x = (2.0*win_x-this.width)/this.width ;
		y = (this.height-2.0*win_y)/this.height;*/
		x = (2.0*win_x)/this.width - 1.0,
		y = 1.0 - (2.0*win_y)/this.height,
		z = 0;
/*		console.log("win_x="+win_x+" ; win_y="+win_y);
		console.log("width="+this.width+" ; height="+this.height);
		console.log("x="+x+" ; y="+y);*/

		var v = new Vector(x, y, z);
		var len = v.len();
		len = (len<1.0) ? len : 1.0;
		z = Math.sqrt(1-len*len);
		v.z = z;
		
		return v.nor();
	},
	
	//get start position and create track ball vector for start position
	setRotationStart:function(win_x, win_y){
		this.start = this.getTrackBallVector(win_x, win_y);
	},
	
	
	//get new position, create track ball vector, and base on the old vector and new vector,
	//calculate the rotation axial, and angle
	rotateTo:function(win_x, win_y){
		var end = this.getTrackBallVector(win_x, win_y);
		var axis = end.clone().cross(this.start).nor();
		var dis = 0-end.clone().sub(this.start).len()*2;
		//var dis = end.clone().sub(this.start).len()*2;

		var curRP = new Quaternion();
		curRP.setFromAxisAngle(axis, dis);
		
		this.q = curRP.multiply(this.q);
		this.start=end;
	},
	
	//convert it to Quaternion, and merger to the old one, convert to matrix and return
	getRotationMatrix:function(){
		var temp = mat4(
			vec4(1,0,0,0),
			vec4(0,1,0,0),
			vec4(0,0,1,0),
			vec4(0,0,0,1)
		);
		if(this.q===null || this.q===undefined){
			return temp;
		}
		return this.q.makeRotationFromQuaternion();
	},
	
	min:function(x, y){
		if(x>y){
			return y;
		}else{
			return x;
		}
	},

};

var CanvasVTB = function(canvas) {
	this.canvas = canvas;
	this.width = canvas.width;
	this.height = canvas.height;
	VirtualTrackBall.prototype.setWinSize.call( this, this.width, this.height );
	
	this.canvas.addEventListener( "mousedown", this.mouseDownHandler(), false );
	this.canvas.addEventListener( "mouseup", this.mouseUpHandler(), false );
	this.canvas.addEventListener( "mousemove", this.mouseMoveHandler(), false);
};

CanvasVTB.prototype = new VirtualTrackBall();

CanvasVTB.prototype.constructor = CanvasVTB;

CanvasVTB.prototype.mouseDownHandler = function() {
	var that = this;
	return function(event) {
		that.mousedown = true;
		var rect = that.canvas.getBoundingClientRect();
		that.setRotationStart(event.clientX - rect.left, event.clientY - rect.top);
/*		var x = event.pageX - that.canvas.offsetLeft;
		var y = event.pageY - that.canvas.offsetTop;*/
//		that.setRotationStart(x,y);
	};
};

CanvasVTB.prototype.mouseUpHandler = function() {
	var currentObj = this;
	return function(event) {
		currentObj.mousedown = false;
	};
};

CanvasVTB.prototype.mouseMoveHandler = function() {
	var that = this;
	return function(event) {
		if (that.mousedown == true) {
			var rect = that.canvas.getBoundingClientRect();
			var x = event.clientX - rect.left;
			var y = event.clientY - rect.top;
/*			var x = event.pageX - that.canvas.offsetLeft;
			var y = event.pageY - that.canvas.offsetTop;*/

			//console.log("x="+x+" ; y="+y);
			if(x && y)
				that.rotateTo(x, y);

			//app.renderer.render();
		}
	};
};
