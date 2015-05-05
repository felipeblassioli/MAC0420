var currentProgram, flatShadingProgram, smoothShadingProgram;
var canvas;
var gl;

var numVertices;

var pointsArray = [];
var normalsArray = [];

var lightPosition = vec4( 10.0, 10.0, 10.0, 0.0 );
var lightAmbient = vec4( 0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialShininess = 100.0;

// transformation and projection matrices
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;

//var ctm;
var ambientColor, diffuseColor, specularColor;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 1;
var theta =[0, 0, 0];

var thetaLoc;

// camera definitions
var eye = vec3(1.0, 0.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var cradius = 1.0;
var ctheta = 0.0;
var cphi = 0.0;

// our universe
var xleft = -1.0;
var xright = 1.0;
var ybottom = -1.0;
var ytop = 1.0;
var znear = -100.0;
var zfar = 100.0;

var flag = true;
var recalculateScaleFactor = true;

var flatShading;
var SHADING_MODE = {
    GOURAUD: 'smooth-shading-gouraud',
    FLAT: 'flat-shading'
}
/* Shading mode. flat or smooth-gouraud */
var shading_mode = SHADING_MODE.FLAT;
var loadedObject;
var selectedData = null;
var drawing = false;
var scaleFactor = 1.0;

var options = {
    preserveAspectRatio: true,
    center_object: true,
    scale_object: true,
    estimate_normals: true
}
function switchProgram(program){
    if (loadedObject.vertices != null && loadedObject.normals != null){
        gl.useProgram(program);

        recalculateScaleFactor = true;
        initProgram(program);
        initBuffers(program, loadedObject.vertices, loadedObject.normals);

        currentProgram = program;

        if(!drawing){
            draw();
            drawing = true;
        }
    }else{
        alert('ERROR: Vertices and Normals are null. Did you load an object?');
    }
}

function initUIComponents(){
    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

    document.getElementById('files').onchange = function (evt) {
        var files = evt.target.files[0]; 

        if (files) {
            var reader = new FileReader();
            reader.onload = function(e) { 
                var contents = e.target.result;
                selectedData = contents;
                loadObject(selectedData);
            }
            reader.readAsText(files);
        } else { 
            alert("Failed to load file");
        }
    };

    document.getElementById('shading-flat').onclick = function(){
        shading_mode = SHADING_MODE.FLAT;

        document.getElementById('chk_estimate').disabled = true;
        loadObject(selectedData);
        switchProgram(flatShadingProgram);
        
    };

    document.getElementById('shading-smooth-gouraud').onclick = function(){
        shading_mode = SHADING_MODE.GOURAUD;

        document.getElementById('chk_estimate').disabled = false;
        loadObject(selectedData);
        switchProgram(smoothShadingProgram);
    };

    document.getElementById('chk_preserveAspectRatio').onclick = function(){
        var checked = document.getElementById('chk_preserveAspectRatio').checked;
        options.preserveAspectRatio = checked;
        console.log("preserveAspectRatio="+options.preserveAspectRatio);
    }

    document.getElementById('chk_center').onclick = function(){
        var checked = document.getElementById('chk_center').checked;
        options.center_object = checked;
        console.log("center_object="+options.center_object);
    }

    document.getElementById('chk_scale').onclick = function(){
        var checked = document.getElementById('chk_scale').checked;
        options.scale_object = checked;
        /*recalculateScaleFactor = true;*/
        console.log("scale_object="+options.scale_object);
    }

    document.getElementById('chk_estimate').onclick = function(){
        var checked = document.getElementById('chk_estimate').checked;
        options.estimate_normals = checked;
        console.log("estimate_normals="+options.estimate_normals);
    }
}

var fps = 30;
var now;
var then = Date.now();
var interval = 1000/fps;
var delta;

function resize() {
    // Get the canvas from the WebGL context
    var canvas = gl.canvas;
     
    // Lookup the size the browser is displaying the canvas.
    var displayWidth = canvas.clientWidth;
    var displayHeight = canvas.clientHeight;
     
    // Check if the canvas is not the same size.
    if (canvas.width != displayWidth ||
    canvas.height != displayHeight) {
     
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
     
    // Set the viewport to match
    gl.viewport(0, 0, canvas.width, canvas.height);
    recalculateScaleFactor = true;
    flag = false;
    }
}
/* source: http://codetheory.in/controlling-the-frame-rate-with-requestanimationframe/*/
function draw() {
    resize();
    requestAnimationFrame(draw);
     
    now = Date.now();
    delta = now - then;
     
    if (delta > interval) {
        then = now - (delta % interval);
        render();
    }
}


function initGL(canvas){
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    // create viewport and clear color
    gl.viewport( 0, 0, canvas.width, canvas.height );

    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    
    // enable depth testing for hidden surface removal
    gl.enable(gl.DEPTH_TEST);
}

function initProgram(program){
    console.log('program is'+program);
    thetaLoc = gl.getUniformLocation(program, "theta"); 

    // create light components
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

    // create model view and projection matrices
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"),
       flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"),
       flatten(diffuseProduct) );
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), 
       flatten(specularProduct) );  
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), 
       flatten(lightPosition) );
       
    gl.uniform1f(gl.getUniformLocation(program, 
       "shininess"),materialShininess);
}

function _initShaders(){
    flatShadingProgram = initShaders( gl, "flat-vertex-shader", "flat-fragment-shader" );
    //smoothShadingProgram = initShaders( gl, "smooth-vertex-shader", "smooth-fragment-shader" );
    smoothShadingProgram = flatShadingProgram;

    if(document.getElementById( "shading-flat" ).checked)
        currentProgram = flatShadingProgram;
    else
        currentProgram = smoothShadingProgram;
}

var multv = function(m,v){
    var result = Array();
    var c,t;
    for(var i=0; i<m.length;i++){
        c = 0;
        for(var j=0; j<m[i].length;j++)
            c += (m[i][j] + v[j]);
        result.push(c);
    }
    return result;
};

//http://blog.acipo.com/matrix-inversion-in-javascript/
//http://www.cg.info.hiroshima-cu.ac.jp/~miyazaki/knowledge/teche23.html

var aspect;
var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            
    if (flag) theta[axis] += 2.0;
            
    eye = vec3(cradius * Math.sin(ctheta) * Math.cos(cphi),
               cradius * Math.sin(ctheta) * Math.sin(cphi), 
               cradius * Math.cos(ctheta));

    modelViewMatrix = lookAt(eye, at, up);

    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], [1, 0, 0] ));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], [0, 1, 0] ));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], [0, 0, 1] ));

    if(options.preserveAspectRatio){
        aspect = canvas.clientWidth/Math.max(1, canvas.clientHeight);
        projectionMatrix = ortho(xleft, xright,ybottom/aspect, ytop/aspect, znear,zfar);
    }else{
        projectionMatrix = ortho(xleft, xright, ybottom, ytop, znear, zfar);
    }
    
    if(recalculateScaleFactor)
        calculateScaleFactor(mult(projectionMatrix,modelViewMatrix));

    if(options.scale_object){
        modelViewMatrix = mult(
            modelViewMatrix,
            mat4(
                [scaleFactor, 0, 0, 0 ],
                [0, scaleFactor, 0, 0 ],
                [0, 0, scaleFactor, 0 ],
                [0, 0, 0, 1 ]  )
        );
    }

    if(options.center_object){
        modelViewMatrix = mult(
            modelViewMatrix,
            mat4(
                [1, 0, 0, -loadedObject.centroid[0]/2 ],
                [0, 1, 0, -loadedObject.centroid[1]/2 ],
                [0, 0, 1, -loadedObject.centroid[2]/2 ],
                [0, 0, 0, 1 ]  )
        );
    }

    /* Nao consegui corrigir a iluminacao */
    //normalMatrix = transpose(inv(modelViewMatrix));
    //normalMatrix = modelViewMatrix;
    //normalMatrix = transpose(math.inv(modelViewMatrix));

    /* Aula 8 */
    /* use inverse transpose matrix */
    /*normalMatrix = transpose(modelViewMatrix);
    normalMatrix = math.inv(normalMatrix);*/
    normalMatrix = modelViewMatrix;
    
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));

    gl.drawArrays( gl.TRIANGLES, 0, numVertices );
}

function initBuffers(program, points, normals) {
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
    
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vNormal );

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    numVertices = points.length;
}


function calculateScaleFactor(M){
    var Pclip;
    var min = 1.0;
    var tmp;
    var b = loadedObject.bounds;

    recalculateScaleFactor = false;

    Pclip = multv(M,b.top);
    if(Pclip[1] > ytop)
        tmp = (ytop/Pclip[1]);
    min = (tmp < min)? tmp : min;    

    Pclip = multv(M,b.bottom);
    if(Pclip[1] < ybottom)
        tmp = (ybottom/Pclip[1]);
    min = (tmp < min)? tmp : min;   

    Pclip = multv(M,b.left);
    if(Pclip[0] < xleft)
        tmp = (xleft/Pclip[0]);
    min = (tmp < min)? tmp : min;   

    Pclip = multv(M,b.right);
    if(Pclip[0] > xright)
        tmp = (xright/Pclip[0]);
    min = (tmp < min)? tmp : min;   

    scaleFactor = min;

    flag = true;
}

function loadObject(data) {
    /* loadedObject has vertices, normals, centroid and bounds */
    loadedObject = loadObjFile(data);

    recalculateScaleFactor = true;
    switchProgram(currentProgram);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );

    initUIComponents();
    initGL(canvas);
    /* Name collision with /Common */
    _initShaders();
}