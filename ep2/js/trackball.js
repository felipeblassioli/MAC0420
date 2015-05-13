var VirtualTrackBall = function(){};

VirtualTrackBall.prototype.constructor = VirtualTrackBall;

VirtualTrackBall.prototype.setWinSize = function(width, height){
		this.width = width;
		this.height = height;
		this.r = this.min(width, height)/2;
		q = new Quaternion();

		this.startW = null;
		this.endW = null;
}
	
VirtualTrackBall.prototype.getTrackBallVector = function(win_x, win_y){
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
}
	
VirtualTrackBall.prototype.min = function(x, y){
	if(x>y){
		return y;
	}else{
		return x;
	}
}

VirtualTrackBall.prototype.getRotationMatrix = function( q, startW, endW, _axis ){

	var start = this.getTrackBallVector( startW[0], startW[1] );
	var end = this.getTrackBallVector( endW[0], endW[1] );

	var axis = end.clone().cross( start ).nor();
	var dis = 0 - end.clone().sub( start ).len()*2;

	var curRP = new Quaternion();
	curRP.fromAxisAngle(axis, dis);
	q = curRP.multiply(q);

	var temp = mat4(
		vec4(1,0,0,0),
		vec4(0,1,0,0),
		vec4(0,0,1,0),
		vec4(0,0,0,1)
	);
	if(q===null || q===undefined){
		return temp;
	}
	return q.makeRotationFromQuaternion();
}
