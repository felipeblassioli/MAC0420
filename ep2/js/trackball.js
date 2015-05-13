

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
	
	min:function(x, y){
		if(x>y){
			return y;
		}else{
			return x;
		}
	},

};

