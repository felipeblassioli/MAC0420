var app = app || {};

app.init = function(){
	var canvas = document.getElementById("gl-canvas1");
	var t = new CurveDrawer(canvas, "1");
	t.draw();

	canvas = document.getElementById("gl-canvas2");
	var t = new CurveDrawer(canvas, "2", true);
	t.draw();
}

window.onload = app.init;
