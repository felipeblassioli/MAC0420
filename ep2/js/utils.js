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

  fromAxisAngle : function(axis_normal_vector, angle) {
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
