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

	toString: function(){
		return "("+this.x+","+this.y+","+this.z+")";
	}
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

		this.startW = null;
		this.endW = null;
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

STATE = {
	NONE: -1,
	TRANSLATE: 0,
	ROTATE: 1,
	SCALE: 2
};

MOUSE = {
	NONE: -1,
	LEFT_BUTTON: 1,
	MIDDLE_BUTTON: 2,
	RIGHT_BUTTON: 3
};

var CanvasVTB = function(canvas) {
	this.canvas = canvas;
	this.width = canvas.width;
	this.height = canvas.height;
	VirtualTrackBall.prototype.setWinSize.call( this, this.width, this.height );
	
	this.canvas.addEventListener( "mousedown", this.mouseDownHandler(), false );
	this.canvas.addEventListener( "mouseup", this.mouseUpHandler(), false );
	this.canvas.addEventListener( "mousemove", this.mouseMoveHandler(), false);
	this.canvas.addEventListener( 'contextmenu', function(e) { e.preventDefault(); }, false );

	//this.canvas.addEventListener('mousewheel', this.mouseWheelHandler(), false );

	window.addEventListener( 'keydown', this.keyDownHandler(), false );
	window.addEventListener( 'keyup', this.keyUpHandler(), false );

	this._state = STATE.NONE;
	this._axis = 0;
	this._mouseButtonClicked = MOUSE.NONE;
};

CanvasVTB.prototype = new VirtualTrackBall();

CanvasVTB.prototype.constructor = CanvasVTB;

CanvasVTB.prototype.mouseDownHandler = function() {
	var that = this;
	return function(event) {
		that.mousedown = true;

		 switch (event.which) {
			case 1:
				that._mouseButtonClicked = MOUSE.LEFT_BUTTON;
				break;
			case 2:
				that._mouseButtonClicked = MOUSE.MIDDLE_BUTTON;
				break;
			case 3:
				that._mouseButtonClicked = MOUSE.RIGHT_BUTTON;
				break;
			default:
				that._mouseButtonClicked = MOUSE.NONE;
		}

		var rect = that.canvas.getBoundingClientRect();

		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;

		that.startW = vec2( x, y );
	};
};

CanvasVTB.prototype.mouseUpHandler = function() {
	var that = this;
	return function(event) {
		that.mousedown = false;
		that._mouseButtonClicked = MOUSE.NONE;
		//app.renderer.commit();
	};
};

CanvasVTB.prototype.mouseMoveHandler = function() {
	var that = this;
	return function(event) {

		if (that.mousedown == true) {
			var rect = that.canvas.getBoundingClientRect();
			var x = event.clientX - rect.left;
			var y = event.clientY - rect.top;

			that.endW = vec2( x, y );
/*			var x = event.pageX - that.canvas.offsetLeft;
			var y = event.pageY - that.canvas.offsetTop;*/

			//console.log("x="+x+" ; y="+y);
			if(x && y){
				switch(that._state){
					case STATE.NONE:
						if( that._mouseButtonClicked == MOUSE.LEFT_BUTTON )
							app.renderer.activeCamera.rotate( that.startW, that.endW );
						else if (that._mouseButtonClicked == MOUSE.RIGHT_BUTTON )
							app.renderer.activeCamera.scale( that.startW, that.endW );
						break;
					case STATE.ROTATE:
						app.renderer.activeObject.rotate( that.startW, that.endW, that._axis );
						break;
					case STATE.TRANSLATE:
						app.renderer.activeObject.translate( that.startW, that.endW, that._axis );
						break;
					case STATE.SCALE:
						app.renderer.activeObject.scale( that.startW, that.endW, that._axis );
						break;
				}
				
				app.renderer.render();
			}
		}
	};
};

CanvasVTB.prototype.keyDownHandler = function(){
	var that = this;
	return function(event){
/*		if ( _this.enabled === false ) return;*/
		//window.removeEventListener( 'keydown', keydown );
		console.log("keyCode: "+event.keyCode);
		var help = "";
		switch( event.keyCode ){
			case 9: // TAB
				app.renderer.switchSelectedObject();
				break;
			case 16: // SHIFT
				console.log("Shift pressed");
				that._modifier = true;
				break;
			case 27: // ESC
				help += "Aperte X para deletar o objeto selecionado. <br />";
				help += "Aperte T para transladar o objeto selecionado. <br />";
				help += "Aperte R para rotacionar o objeto selecionado. <br />";
				help += "Aperte S para escalar o objeto selecionado. <br />";
				that._state = STATE.NONE;
				that._axis = -1;
				break;
			case 88: // x
				if(that._state == STATE.NONE ){
					console.log("DELETE");
					app.renderer.removeSelectedObject();
				}else{
					that._axis = 0;
					help += "Eixo X selecionado.";
				}
				break;
			case 89: // y
				that._axis = 1;
				help += "Eixo Y selecionado.";
				break;
			case 90: // z
				that._axis = 2;
				help += "Eixo Z selecionado.";
				break;
			case 84: // t
				console.log("TRANSLATE");
				that._state = STATE.TRANSLATE;
				help += "Para selecionar um eixo pressiona x, y ou z.";
				break;
			case 82: // r
				console.log("ROTATE");
				that._state = STATE.ROTATE;
				help += "Para selecionar um eixo pressiona x, y ou z.";
				break;
			case 83: // s
				console.log("SCALE");
				that._state = STATE.SCALE;
				help += "Para selecionar um eixo pressiona x, y ou z.";
				break;
			case 61: // +
				app.renderer.viewScaleZ -= 0.5;
				app.renderer.render();
				break;
			case 173: //-
				app.renderer.viewScaleZ += 0.5;
				app.renderer.render();
				break;
		}
		app.showMessage(help);
	};
}

CanvasVTB.prototype.keyUpHandler = function(){
	var that = this;
	return function(event){
		if(event.keyCode == 16){
			console.log("Shift unpressed");
			that._modifier = false;
		}
		//window.addEventListener( 'keydown', keydown, false );
/*		if ( _this.enabled === false ) return;
			_state = _prevState;
		window.addEventListener( 'keydown', keydown, false );*/
	};
}

CanvasVTB.prototype.mouseWheelHandler= function(){
	var that = this;
	return function(event){
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		console.log("delta: "+delta);
		return false;
	};
}