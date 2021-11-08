class Color{
	constructor(r, g, b, a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	debug(){
		alert(this.r+","+this.g+","+this.b+","+this.a);
	}

	compare(col2, tolerance){
		const mina = Math.min(this.a, col2.a)/255;
		let error = 0;
		error += Math.abs(this.r - col2.r)/255*mina/3;
		error += Math.abs(this.g - col2.g)/255*mina/3;
		error += Math.abs(this.b - col2.b)/255*mina/3;
		error += Math.abs(this.a - col2.a)/255*(1-mina);
		return (error <= tolerance) ? true : false;
	}

	toRGBA(){
		return "rgba("+this.r+","+this.g+","+this.b+","+this.a/255+")";
	}
}

class Layer {
	constructor(id) {
		this.name = "Layer"+id;
		this.id = id;
		this.w = width;
		this.h = height;
		this.prevpoint = {x: -1, y: -1};
		this.simplified_preview = true;
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.w;
		this.canvas.height = this.h;
		this.backup = document.createElement('canvas');
		this.backup.width = this.w;
		this.backup.height = this.h;
		this.thumbnail = document.getElementById('thumb_'+this.id);
		this.thumbnail.width = twidth;
		this.thumbnail.height = theight;
		this.visible = true;
		this.opacity = 100;
	}

	save(){
		const ctx = this.backup.getContext('2d');
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(this.canvas, 0, 0);
	}	

	load(){
		const ctx = this.canvas.getContext('2d');
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(this.backup, 0, 0);
	}

	setvisible(){
		this.visible = document.getElementById('visibility_'+this.id).checked;
		flatten_image();
	}

	setopacity(){
		this.opacity = document.getElementById('opacity_'+this.id).value;
		flatten_image();
	}

	draw_pen(x,y){
		let ctx = this.canvas.getContext('2d');
		this.draw_pen_on_context(ctx,x,y);
		if(this.simplified_preview){
			ctx = document.getElementById('cl').getContext('2d');
			this.draw_pen_on_context(ctx,x,y);
		}
		this.prevpoint.x = x;
		this.prevpoint.y = y;
	}

	draw_pen_on_context(ctx, x, y){
		ctx.lineWidth = 1;
		if(thickness>1){
			ctx.beginPath();
			ctx.arc(x, y, (thickness-1)/2,  0, 360);
			ctx.fill();
		}
		if(this.prevpoint.x!=-1){
			ctx.lineWidth = thickness;
			ctx.beginPath();
			ctx.moveTo(this.prevpoint.x, this.prevpoint.y); 
		  ctx.lineTo(x, y);
		  ctx.stroke();
		}
	}

	erase(x,y){
		const ctx = this.canvas.getContext('2d');
		ctx.clearRect(x-(thickness/4),y-(thickness/2),thickness/2,thickness)
	}

	clear_pen(){
		this.prevpoint.x = -1;
	}

	ruler_start(x,y){
		this.prevpoint.x = x;
		this.prevpoint.y = y;
	}

	ruler_render(x,y){
		this.load();
		const canvas = document.getElementById('cl');
		const ctx = canvas.getContext('2d');
		ctx.lineWidth = thickness;
		ctx.beginPath();
		ctx.moveTo(this.prevpoint.x, this.prevpoint.y); 
		ctx.lineTo(x, y);
		ctx.stroke();
	}

	ruler_end(x,y){
		flatten_image();
		const ctx = this.canvas.getContext('2d');
		ctx.lineWidth = thickness;
		ctx.beginPath();
		ctx.moveTo(this.prevpoint.x, this.prevpoint.y); 
		ctx.lineTo(x, y);
		ctx.stroke();
		this.prevpoint.x = -1;
	}

	fill(x,y){
		x = Math.round(x);
		y = Math.round(y);
		const ctx = this.canvas.getContext('2d');
		const imgData = ctx.getImageData(0,0,this.w,this.h);
		const data = imgData.data;
		const oldcolor = this.getpixel(data,x,y);
		if(oldcolor.compare(curcol,0.05)){
			return;
		}
		let stk = [];
		let lim = 2000000;
		stk.push({x: x,y: y, dir: -1});
		while ((stk.length > 0) && (lim >=0)){
			lim--;
			const curpix = stk.pop();
			if(!((curpix.x>=0) && (curpix.x<this.w) && (curpix.y>=0) && (curpix.y<this.h))){
				continue;
			}
			//ctx.fillRect(curpix.x,curpix.y,1,1);
			data[curpix.y*4*this.w+curpix.x*4] = curcol.r;
			data[curpix.y*4*this.w+curpix.x*4+1] = curcol.g;
			data[curpix.y*4*this.w+curpix.x*4+2] = curcol.b;
			data[curpix.y*4*this.w+curpix.x*4+3] = curcol.a;
			switch(curpix.dir){
	  		case(1):
				if (oldcolor.compare(this.getpixel(data,curpix.x+1,curpix.y),tol) && !curcol.compare(this.getpixel(data,curpix.x+1,curpix.y),0.05)) stk.push({x: curpix.x+1,y: curpix.y, dir:1});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y+1),tol) && !curcol.compare(this.getpixel(data,curpix.x,curpix.y+1),0.05)) stk.push({x: curpix.x,y: curpix.y+1, dir:2});
				if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y-1),tol) && !curcol.compare(this.getpixel(data,curpix.x,curpix.y-1),0.05)) stk.push({x: curpix.x,y: curpix.y-1, dir:4});
	  			break;
	  		case(2):
				if (oldcolor.compare(this.getpixel(data,curpix.x+1,curpix.y),tol) && !curcol.compare(this.getpixel(data,curpix.x+1,curpix.y),0.05)) stk.push({x: curpix.x+1,y: curpix.y, dir:1});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y+1),tol) && !curcol.compare(this.getpixel(data,curpix.x,curpix.y+1),0.05)) stk.push({x: curpix.x,y: curpix.y+1, dir:2});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x-1,curpix.y),tol) && !curcol.compare(this.getpixel(data,curpix.x-1,curpix.y),0.05)) stk.push({x: curpix.x-1,y: curpix.y, dir:3});
	  			break;
	  		case(3):
	  			if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y+1),tol) && !curcol.compare(this.getpixel(data,curpix.x,curpix.y+1),0.05)) stk.push({x: curpix.x,y: curpix.y+1, dir:2});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x-1,curpix.y),tol) && !curcol.compare(this.getpixel(data,curpix.x+1,curpix.y),0.05)) stk.push({x: curpix.x-1,y: curpix.y, dir:3});
				if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y-1),tol) && !curcol.compare(this.getpixel(data,curpix.x,curpix.y-1),0.05)) stk.push({x: curpix.x,y: curpix.y-1, dir:4});
	  			break;
	  		case(4):
	  			if (oldcolor.compare(this.getpixel(data,curpix.x+1,curpix.y),tol) && !curcol.compare(this.getpixel(data,curpix.x+1,curpix.y),0.05)) stk.push({x: curpix.x+1,y: curpix.y, dir:1});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x-1,curpix.y),tol) && !curcol.compare(this.getpixel(data,curpix.x-1,curpix.y),0.05)) stk.push({x: curpix.x-1,y: curpix.y, dir:3});
				if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y-1),tol) && !curcol.compare(this.getpixel(data,curpix.x,curpix.y-1),0.05)) stk.push({x: curpix.x,y: curpix.y-1, dir:4});
	  			break;
	  		case(-1):
				if (oldcolor.compare(this.getpixel(data,curpix.x+1,curpix.y),tol) && !curcol.compare(this.getpixel(data,curpix.x+1,curpix.y),0.05)) stk.push({x: curpix.x+1,y: curpix.y, dir:1});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y+1),tol) && !curcol.compare(this.getpixel(data,curpix.x,curpix.y+1),0.05)) stk.push({x: curpix.x,y: curpix.y+1, dir:2});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x-1,curpix.y),tol) && !curcol.compare(this.getpixel(data,curpix.x-1,curpix.y),0.05)) stk.push({x: curpix.x-1,y: curpix.y, dir:3});
				if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y-1),tol) && !curcol.compare(this.getpixel(data,curpix.x,curpix.y-1),0.05)) stk.push({x: curpix.x,y: curpix.y-1, dir:4});
				break;
			}
		}
		ctx.putImageData(imgData,0,0)
	}

	/*
	getpixel(ctx,x,y){
		var pix = ctx.getImageData(x,y,1,1).data;
		return new Color(pix[0],pix[1],pix[2],pix[3]);
	}
	*/

	getpixel(data,x,y){
		//alert(data[y*4*this.w+x*4]+","+data[y*4*this.w+x*4+1]+","+data[y*4*this.w+x*4+2]+","+data[y*4*this.w+x*4+3]);
		return new Color(data[y*4*this.w+x*4],data[y*4*this.w+x*4+1],data[y*4*this.w+x*4+2],data[y*4*this.w+x*4+3]);
	}

	sample(x,y){
		const ctx = this.canvas.getContext('2d');
		const col = this.getpixel(ctx,x,y);
		curcol = col;
		document.getElementById('color_sample').style.background = curcol.toRGBA(); 
		document.getElementById('red').style.background = "linear-gradient(to right, rgba(0,"+col.g+","+col.b+",1), rgba(255,"+col.g+","+col.b+",1))";
		document.getElementById('green').style.background = "linear-gradient(to right, rgba("+col.r+",0,"+col.b+",1), rgba("+col.r+",255,"+col.b+",1))";
		document.getElementById('blue').style.background = "linear-gradient(to right, rgba("+col.r+","+col.g+",0,1), rgba("+col.r+","+col.g+",255,1))";
		document.getElementById('alpha').style.background = "linear-gradient(to right, rgba("+col.r+","+col.g+","+col.b+",0), rgba("+col.r+","+col.g+","+col.b+",1))";
		document.getElementById('red').value = col.r;
		document.getElementById('green').value = col.g;
		document.getElementById('blue').value = col.b;
		document.getElementById('alpha').value = col.a;
	}


	update_color(){
		const ctx = this.canvas.getContext('2d');
		ctx.fillStyle = curcol.toRGBA();
		ctx.strokeStyle = curcol.toRGBA();
	}

	getdata() {
		return this.canvas.getContext('2d').getImageData(0, 0, this.w, this.h);
	}

	update_thumbnail() {
		let ctx = this.thumbnail.getContext('2d');
		ctx.clearRect(0,0,twidth,theight);
		let imgData = ctx.getImageData(0, 0, twidth, theight);
		let data = imgData.data;
		const data2 = this.getdata().data;
		for (var i = 0; i < theight; i += 1) {
			for (var j = 0; j < twidth*4; j += 4) {
				data[i*twidth*4+j] = data2[i*twidth*1600+j*20];
				data[i*twidth*4+j+1] = data2[i*twidth*1600+j*20+1];
				data[i*twidth*4+j+2] = data2[i*twidth*1600+j*20+2];
				data[i*twidth*4+j+3] = data2[i*twidth*1600+j*20+3];
			}
		}
		ctx.putImageData(imgData, 0, 0);
	}
}