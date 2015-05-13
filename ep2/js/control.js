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
	this._axis = -1;
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
				
				//app.renderer.render();
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
				help += "Botao ESQUERDO do mouse para rotacionar a camera. <br />";
				help += "Botao DIREITO do mouse para rotacionar a camera. <br />";
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
				//app.renderer.render();
				break;
			case 173: //-
				app.renderer.viewScaleZ += 0.5;
				//app.renderer.render();
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