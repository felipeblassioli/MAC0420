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

var Quaternion = function(x, y, z, w) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = (w !== undefined) ? w : 1;
};

/*http://stackoverflow.com/questions/4436764/rotating-a-quaternion-on-1-axis
Quaternion Quaternion::create_from_axis_angle(const double &xx, const double &yy, const double &zz, const double &a)
{
    // Here we calculate the sin( theta / 2) once for optimization
    double result = sin( a / 2.0 );

    // Calculate the x, y and z of the quaternion
    double x = xx * result;
    double y = yy * result;
    double z = zz * result;

    // Calcualte the w value by cos( theta / 2 )
    double w = cos( a / 2.0 );

    return Quaternion(x, y, z, w).normalize();
}
So to rotate around the x axis for example, 
you could create a quaternion with createFromAxisAngle(1, 0, 0, M_PI/2) 
and multiply it by the current rotation quaternion of your model

*/

Quaternion.prototype = {

  fromAxisAngle : function(axis_normal_vector, angle) {
    var halfAngle = angle / 2; 
    var factor = Math.sin(halfAngle);
    this.x = axis_normal_vector[0] * factor;
    this.y = axis_normal_vector[1] * factor;
    this.z = axis_normal_vector[2] * factor;
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
    var x = this.x;
    var y = this.y;
    var z = this.z;
    var w = this.w;

    var x2 = x + x, y2 = y + y, z2 = z + z;
    var xx = x * x2, xy = x * y2, xz = x * z2;
    var yy = y * y2, yz = y * z2, zz = z * z2;
    var wx = w * x2, wy = w * y2, wz = w * z2;

    result = mat4(
      vec4( 1 - (yy + zz), xy - wz, xz + wy, 0 ),
      vec4( xy + wz, 1 - (xx + zz), yz - wx, 0 ),
      vec4( xz - wy, yz + wx, 1 - (xx + yy), 0 ), 
      vec4( 0, 0, 0, 1 )
    );

    return result;
  },
};
