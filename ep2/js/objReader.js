var Model = function(vertices, normals, centroid){
	this.vertices = vertices || [];
	this.normals = normals || [];
	this.centroid = centroid;
}

var SHADING_MODE = {
    GOURAUD: 'smooth-shading-gouraud',
    FLAT: 'flat-shading'
}

Model.prototype.render = function(gl, program){
	var nBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.normals), gl.STATIC_DRAW );

	var vNormal = gl.getAttribLocation( program, "vNormal" );
	gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
	gl.enableVertexAttribArray( vNormal );

	var vBuffer = gl.createBuffer();
	gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
	gl.bufferData( gl.ARRAY_BUFFER, flatten(this.vertices), gl.STATIC_DRAW );

	var vPosition = gl.getAttribLocation(program, "vPosition");
	gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(vPosition);

	gl.drawArrays( gl.TRIANGLES, 0, this.vertices.length );
}

function ObjectReader(){
	var parseObj = function(data){
		var result = {};
		var lines = data.split('\n');
		var vertex;
		var line;
		var face;
		/* vertices */
		var V = Array(); 
		/* normals */
		var N = Array();
		/* face indexes */
		var F = Array();

		for (var i = 0; i < lines.length; i++) {
			if(typeof lines[i] === "undefined" || lines[i] === null) {
				console.log("WARNING: line is undefined. index="+i+" line="+lines[i]+" data length="+lines.length);
				continue;
			}	
			line = lines[i];
			line = line.trim();

			if(line[0] == "#") continue;
			
			line = line.split(' ');
			switch(line[0]) {
				case 'v':
					/* Vertices */
					vertex = line.slice(1);
					for(var j=0; j<vertex.length;j++)
						vertex[j] = parseFloat(vertex[j]);
					V.push(vertex);
					break;
				case 'vt':
					/* Texturas */
					break;
				case 'vn':
					/* Normais */
					N.push(line.slice(1));
					break;
				case 'f':
					/* Faces */
					face = line.slice(1);
					for(var j=0; j < face.length; j++){
						face[j] = face[j].split('/');
						for(var k=0; k<face[j].length; k++){
							face[j][k] = parseInt(face[j][k])
						}
					}
					if (face.length == 4 ){
						var f1,f2;
						f1 = [face[0].slice(0),face[1].slice(0),face[2].slice(0)];
						f2 = [face[0].slice(0),face[2].slice(0),face[3].slice(0)];
						F.push(f1);
						F.push(f2);
					}else{
						F.push(face);
					}
					break;
				default:
					console.log('not implemented yet. line[0] = '+line[0]);
			}
		}

		result.vertices = V;
		result.normals = N;
		result.faces = F;
		console.log('loaded');
		return result;
	};

	var calculatePerFaceNormals = function(vertices){
		var _normal = function(a,b,c){
			var t1 = subtract(b,a);
			var t2 = subtract(c,b);
			return vec4(cross(t1, t2), 0);
		}
		var perFaceNormals = Array();
		for(var i=0; i<vertices.length;i++){
			if((i+1)%3==0){
				normal = _normal(vertices[i],vertices[i-1],vertices[i-2]);
				normal = normalize(normal);
				/* Flat-shading */
				/* http://stackoverflow.com/questions/6656358/calculating-normals-in-a-triangle-mesh */
				/* http://gamedev.stackexchange.com/questions/50653/opengl-why-do-i-have-to-set-a-normal-with-glnormal */
				perFaceNormals.push(normal);
				perFaceNormals.push(normal);
				perFaceNormals.push(normal);
			}
		}
		return perFaceNormals;
	};

	var calculatePerVertexNormals = function(tmp, perFaceNormals){
		var avg_normal = function(cur_triangle, curVertexNormal, cur_vertex){
			var avg;
			var normal;
			var adj_vertices_indexes = Array();

			//console.log('avg_normal cur_triangle='+cur_triangle+' cur_vertex='+cur_vertex);
			for(var i=0; i<tmp.faces.length; i++){
				if (i === cur_triangle)
					continue;

				for(var j=0; j<tmp.faces[i].length; j++){
					if(tmp.faces[i][j][0] === cur_vertex[0]){
						//console.log('    found face '+tmp.faces[i]);
						adj_vertices_indexes.push(i*3 + j);
					}
				}
			}

			/* this is a face-normal and is a vec4 */
			avg = curVertexNormal;
			//console.log('face-normal was'+avg);
			for(var i=0; i<adj_vertices_indexes.length; i++){
				normal = perFaceNormals[adj_vertices_indexes[i]];
				//console.log('    adding'+normal);
				/* add vec4 component-wise */
				avg = add(avg, normal);
			}

			/* (n1+n2+n3+..+nn) / |(n1+n2+n3+..+nn)| */
			var l = 1/length(avg);
			for(var i=0; i<avg.length;i++)
				avg[i] *= l;
			//console.log('face-normal is'+avg);
			//console.log('---');
			//avg = avg / ;
			return avg;
		};

		var perVertexNormals = Array();
		/* Per-vertex-normal is the mean of adjacent faces */
		for(var i=0; i<tmp.faces.length; i++){
			//console.log('current face is '+tmp.faces[i]);
			for(var j=0; j<tmp.faces[i].length; j++){
				vertex = tmp.faces[i][j];
				normal = avg_normal(i, perFaceNormals[(i*3 + j)], vertex);
				//normal = normalize(normal);
				perVertexNormals.push(normal);
			}
		}
		return perVertexNormals;
	};

	var loadObjFile = function(data, mode) {
		var shading_mode = mode || SHADING_MODE.FLAT;
		var result, tmp, vertexIndex, normalIndex, vertex, normal;
		var boundingBox = {};

		result = {};
		result.vertices = Array();
		result.normals = Array();
		result.bounds = null;
		result.centroid = null;

		console.log('loadObjFile...');
		// (i) Parse OBJ file and extract vertices and normal vectors
		tmp = parseObj(data);

		/* To be used as opengl buffers */
		for(var i=0; i<tmp.faces.length; i++){
			for(var j=0; j<tmp.faces[i].length; j++){
				vertexIndex = tmp.faces[i][j][0] - 1;
				vertex = tmp.vertices[vertexIndex];
				if(vertex.length==3)
					vertex.push(1.0);
				result.vertices.push(vertex);

				if(result.centroid == null)
					result.centroid = vertex;
				else
					result.centroid = add(result.centroid,vertex);

				if(result.bounds == null){
					result.bounds = {
						left: vertex[0],
						right: vertex[0],
						top: vertex[1],
						bottom: vertex[1],
						near: vertex[2],
						far: vertex[2]
					};
				}else{
					if(vertex[0] < result.bounds.left)
						result.bounds.left = vertex;
					if(vertex[0] > result.bounds.right)
						result.bounds.right = vertex;
					if(vertex[1] < result.bounds.bottom)
						result.bounds.bottom = vertex;
					if(vertex[1] > result.bounds.top)
						result.bounds.top = vertex;
					if(vertex[2] < result.bounds.near)
						result.bounds.near = vertex;
					if(vertex[2] > result.bounds.far)
						result.bounds.far = vertex;
				}

				/* length == 3 means v1/vt1/vn1 there were 2 '/' . So there is a normal */
				if(tmp.faces[i][j].length >= 3){
					normalIndex = tmp.faces[i][j][2] - 1;
					normal = tmp.normals[normalIndex];
					if(normal.length == 3){
						normal.push(0.0);
					}
					result.normals.push(normal);
				}
			}
		}

		var k = result.vertices.length;
		result.centroid[0] /= k;
		result.centroid[1] /= k;
		result.centroid[2] /= k;
		result.centroid[3] /= k;

		
		if(shading_mode == SHADING_MODE.FLAT){
			result.normals = calculatePerFaceNormals(result.vertices);
		}
		if(shading_mode == SHADING_MODE.GOURAUD){
			var perFaceNormals;
			// (ii) If normal vectors are not in the file, you will need to calculate them
			if(options.estimate_normals){
				perFaceNormals = calculatePerFaceNormals(result.vertices);
				result.normals = calculatePerVertexNormals(tmp,perFaceNormals);
			}
			else{
				perFaceNormals = result.normals;
				if(perFaceNormals.length == 0){
					alert('No normals in the obj file! Use estimate_normals option.')
				}
			}
		}
		
		console.log('vertices count '+result.vertices.length);
		console.log('normals count '+result.normals.length);
		
		// (iii) Return vertices and normals and any associated information you might find useful
		var model = new Model(result.vertices, result.normals, result.centroid);
		return model;
	};

	return {
		loadObjFile: loadObjFile
	}
}

