import { Color } from './color.js';

export class Layer {
	constructor(id, width, height, crow, renderCanvas) {
		this.name = "Layer"+id;
		this.id = id;
		this.w = width;
		this.h = height;
		this.prevpoint = {x: -1, y: -1};
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.w;
		this.canvas.height = this.h;
		this.backup = document.createElement('canvas');
		this.backup.width = this.w;
		this.backup.height = this.h;
		this.visible = true;
		this.opacity = 100;
		this.mode = 'normal';
		this.crow = crow;
		this.renderCanvas = renderCanvas;
		this.twidth = Math.min(48,this.w);
		this.theight = Math.min(36,this.h);

		const newplate = document.createElement("div");
		newplate.addEventListener('click', () => {	this.crow.switchToLayer(this.id)	}); 
		newplate.classList.add("layerPlate");
		newplate.setAttribute("id","plate"+this.id);

		this.thumbnail = document.createElement("canvas");
		//this.thumbnail.setAttribute("id","thumb"+this.id);
		this.thumbnail.classList.add("thumbnail");
		newplate.appendChild(this.thumbnail);
		
		const propertiesContainer = document.createElement("div");
		propertiesContainer.style.width = 130;
		propertiesContainer.innerText += "Layer-"+this.id;
		newplate.appendChild(propertiesContainer);

		let opacitySlider = document.createElement("input");
		opacitySlider.type = "range";
		opacitySlider.name = "opacity"+this.id;
    	opacitySlider.style.width = 128;
		opacitySlider.min = 0;
		opacitySlider.max = 100;
		propertiesContainer.appendChild(opacitySlider);

		const rightPanel = document.createElement("div");
		rightPanel.style.width = 72;
		newplate.appendChild(rightPanel);

		const upperRightPanel = document.createElement("div");
		upperRightPanel.style.justifyContent = "space-around";
		upperRightPanel.style.display = "flex";
		rightPanel.appendChild(upperRightPanel);
		

		const visibilityLabel = document.createElement("label");
		visibilityLabel.classList.add("checkContainer");
		visibilityLabel.innerHTML += '<img src="ui/view.png">';
		upperRightPanel.appendChild(visibilityLabel);
		
		let checkboxVisible = document.createElement("input");
		checkboxVisible.type = "checkbox";
		checkboxVisible.name = "visible"+this.id;
		visibilityLabel.appendChild(checkboxVisible);

		visibilityLabel.innerHTML += '<span class="checkmark"></span>';
		
		let deleteButton = document.createElement("input");
		deleteButton.type = "image";
		deleteButton.src = "ui/delete.png";
		deleteButton.style.alignSelf = "center";
		deleteButton.name = "delete"+this.id;
		upperRightPanel.appendChild(deleteButton);

		let selectMode = document.createElement("select");
		selectMode.name = "mode"+this.id;
		selectMode.innerHTML = `<option value="normal" selected>Normal</option>	  <option value="add">Add</option>	  
								<option value="dissolve">Dissolve</option>	  <option value="negate">Negate</option>`
		rightPanel.appendChild(selectMode);
		
		const ll = document.getElementById("layerslist");
		ll.insertBefore(newplate, ll.firstChild);

		opacitySlider = document.querySelector(`input[name='opacity${this.id}']`);
		opacitySlider.value = "100";
		opacitySlider.addEventListener('change', (event) => {	event.stopImmediatePropagation();	this.crow.updateLayerProperties('opacity', this.id, event.target.value);	});
		opacitySlider.addEventListener('click', (event) => {	event.stopImmediatePropagation();	});

		checkboxVisible = document.querySelector(`input[name='visible${this.id}']`);
		checkboxVisible.checked = "true";
		checkboxVisible.addEventListener('change', (event) => {	event.stopImmediatePropagation();	this.crow.updateLayerProperties('visible', this.id, event.target.checked);	});
		//checkboxVisible.addEventListener('click', (event) => {	event.stopImmediatePropagation();	});
		
		deleteButton = document.querySelector(`input[name='delete${this.id}']`);
		deleteButton.addEventListener('click', () => {	this.crow.deleteLayer(this.crow.idToNum(this.id));	});
		
		selectMode = document.querySelector(`select[name='mode${this.id}']`);
		selectMode.addEventListener('change', (event) => {	this.crow.updateLayerProperties('mode', this.id, event.target.value);	});
		rightPanel.addEventListener('click', (event) => {	event.stopImmediatePropagation();	});

		this.thumbnail = document.querySelector(`div#plate${this.id}  > .thumbnail`);
		this.thumbnail.width = this.twidth;
		this.thumbnail.height = this.theight;
		this.thumbnail.style.width = this.twidth;
		this.thumbnail.style.height = this.theight;
	}

	save(){
		const ctx = this.backup.getContext('2d');
		ctx.clearRect(0, 0, this.w, this.h);
		ctx.drawImage(this.canvas, 0, 0);
	}	

	load(){
		Layer.replaceLayer(this.canvas, this.backup);
		this.updateThumbnail();
	}

	static replaceLayer(a, b){
		const ctx = a.getContext('2d');
		ctx.clearRect(0, 0, a.width, a.height);
		ctx.drawImage(b, 0, 0);
	}

	drawPen(x,y){
		const ctx = this.canvas.getContext('2d');
		this.drawPenOnContext(ctx,x,y);
		const renderSimplified = this.crow.simplifiedPreview;
		if(renderSimplified){
			const renderctx = this.renderCanvas.getContext('2d');
			this.drawPenOnContext(renderctx,x,y);
		}
		this.prevpoint.x = x;
		this.prevpoint.y = y;
	}

	drawPenOnContext(ctx, x, y){
		ctx.lineWidth = 1;
		if(this.crow.thickness>1){
			ctx.beginPath();
			ctx.arc(x, y, (this.crow.thickness-1)/2,  0, 360);
			ctx.fill();
		}
		if(this.prevpoint.x!=-1){
			ctx.lineWidth = this.crow.thickness;
			ctx.beginPath();
			ctx.moveTo(this.prevpoint.x, this.prevpoint.y); 
		  ctx.lineTo(x, y);
		  ctx.stroke();
		}
	}

	erase(x,y){
		const ctx = this.canvas.getContext('2d');
		ctx.clearRect(x-(this.crow.thickness/4),y-(this.crow.thickness/2),this.crow.thickness/2,this.crow.thickness)
	}

	clearPen(){
		this.prevpoint.x = -1;
	}

	RulerStart(x,y){
		this.prevpoint.x = x;
		this.prevpoint.y = y;
	}

	RulerRender(x,y){
		this.load();
		const ctx = this.renderCanvas.getContext('2d');
		ctx.lineWidth = this.crow.thickness;
		ctx.beginPath();
		ctx.moveTo(this.prevpoint.x, this.prevpoint.y); 
		ctx.lineTo(x, y);
		ctx.stroke();
	}

	RulerEnd(x,y){
		this.crow.flattenImage();
		const ctx = this.canvas.getContext('2d');
		ctx.lineWidth = this.crow.thickness;
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
		if(oldcolor.compareStrict(this.crow.curcol)){
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
			data[curpix.y*4*this.w+curpix.x*4] = this.crow.curcol.r;
			data[curpix.y*4*this.w+curpix.x*4+1] = this.crow.curcol.g;
			data[curpix.y*4*this.w+curpix.x*4+2] = this.crow.curcol.b;
			data[curpix.y*4*this.w+curpix.x*4+3] = this.crow.curcol.a;
			switch(curpix.dir){
	  		case(1):
				if (oldcolor.compare(this.getpixel(data,curpix.x+1,curpix.y),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x+1,curpix.y))) 
					stk.push({x: curpix.x+1,y: curpix.y, dir:1});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y+1),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x,curpix.y+1))) 
				  	stk.push({x: curpix.x,y: curpix.y+1, dir:2});
				if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y-1),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x,curpix.y-1))) 
					stk.push({x: curpix.x,y: curpix.y-1, dir:4});
	  			break;
	  		case(2):
				if (oldcolor.compare(this.getpixel(data,curpix.x+1,curpix.y),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x+1,curpix.y))) 
					stk.push({x: curpix.x+1,y: curpix.y, dir:1});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y+1),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x,curpix.y+1))) 
				  	stk.push({x: curpix.x,y: curpix.y+1, dir:2});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x-1,curpix.y),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x-1,curpix.y))) 
				  	stk.push({x: curpix.x-1,y: curpix.y, dir:3});
	  			break;
	  		case(3):
	  			if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y+1),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x,curpix.y+1))) 
					stk.push({x: curpix.x,y: curpix.y+1, dir:2});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x-1,curpix.y),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x+1,curpix.y))) 
					stk.push({x: curpix.x-1,y: curpix.y, dir:3});
				if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y-1),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x,curpix.y-1))) 
					stk.push({x: curpix.x,y: curpix.y-1, dir:4});
	  			break;
	  		case(4):
	  			if (oldcolor.compare(this.getpixel(data,curpix.x+1,curpix.y),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x+1,curpix.y)))
				  	stk.push({x: curpix.x+1,y: curpix.y, dir:1});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x-1,curpix.y),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x-1,curpix.y)))
				  	stk.push({x: curpix.x-1,y: curpix.y, dir:3});
				if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y-1),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x,curpix.y-1))) 
					stk.push({x: curpix.x,y: curpix.y-1, dir:4});
	  			break;
	  		case(-1):
				if (oldcolor.compare(this.getpixel(data,curpix.x+1,curpix.y),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x+1,curpix.y))) 
					stk.push({x: curpix.x+1,y: curpix.y, dir:1});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y+1),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x,curpix.y+1))) 
					stk.push({x: curpix.x,y: curpix.y+1, dir:2});
	  			if (oldcolor.compare(this.getpixel(data,curpix.x-1,curpix.y),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x-1,curpix.y))) 
					stk.push({x: curpix.x-1,y: curpix.y, dir:3});
				if (oldcolor.compare(this.getpixel(data,curpix.x,curpix.y-1),this.crow.tol) && !this.crow.curcol.compareStrict(this.getpixel(data,curpix.x,curpix.y-1))) 
					stk.push({x: curpix.x,y: curpix.y-1, dir:4});
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
		return new Color(data[y*4*this.w+x*4],data[y*4*this.w+x*4+1],data[y*4*this.w+x*4+2],data[y*4*this.w+x*4+3]);
	}

	sample(x,y){
		const ctx = this.canvas.getContext('2d');
		const imgData = ctx.getImageData(x,y,1,1);
		const data = imgData.data;
		const col = this.getpixel(data,0,0);
		this.crow.curcol = col;
		//this.crow.updateColor();
		this.updateColor();
		document.getElementById('colorSample').style.background = this.crow.curcol.toRGBA(); 
		const redBar = document.querySelector("input[name='redBar']");
		const greenBar = document.querySelector("input[name='greenBar']");
		const blueBar = document.querySelector("input[name='blueBar']");
		const alphaBar = document.querySelector("input[name='alphaBar']");
		const redNumber = document.querySelector("input[name='redNumber']");
		const greenNumber = document.querySelector("input[name='greenNumber']");
		const blueNumber = document.querySelector("input[name='blueNumber']");
		const alphaNumber = document.querySelector("input[name='alphaNumber']");
		redBar.style.background = `linear-gradient(to right, rgba(0,${col.g},${col.b},1), rgba(255,${col.g},${col.b},1))`;
		greenBar.style.background = `linear-gradient(to right, rgba(${col.r},0,${col.b},1), rgba(${col.r},255,${col.b},1))`;
		blueBar.style.background = `linear-gradient(to right, rgba(${col.r},${col.g},0,1), rgba(${col.r},${col.g},255,1))`;
		alphaBar.style.background = `linear-gradient(to right, rgba(${col.r},${col.g},${col.b},0), rgba(${col.r},${col.g},${col.b},1))`;
		redBar.value = col.r;
		greenBar.value = col.g;
		blueBar.value = col.b;
		alphaBar.value = col.a;
		redNumber.value = col.r;
		greenNumber.value = col.g;
		blueNumber.value = col.b;
		alphaNumber.value = col.a;

	}

	updateColor(){
		const ctx = this.canvas.getContext('2d');
		ctx.fillStyle = this.crow.curcol.toRGBA();
		ctx.strokeStyle = this.crow.curcol.toRGBA();
		const renderCtx = this.renderCanvas.getContext('2d');
		renderCtx.fillStyle = this.crow.curcol.toRGBA();
		renderCtx.strokeStyle = this.crow.curcol.toRGBA();
	}

	getdata() {
		return this.canvas.getContext('2d').getImageData(0, 0, this.w, this.h);
	}

	updateThumbnail() {
		var ctx = this.thumbnail.getContext('2d');
		ctx.clearRect(0,0,this.twidth,this.theight);
		var imgData = ctx.getImageData(0, 0, this.twidth, this.theight);
		var data = imgData.data;
		var data2 = this.getdata().data;
		const widthRatio = Math.floor(this.w/this.twidth);
		const heightRatio = Math.floor(this.h/this.theight);
		for (var i = 0; i < this.theight; i += 1) {
			for (var j = 0; j < this.twidth*4; j += 4) {
				const pos1 = i*this.twidth*4+j;
				const pos2 = i*this.w*4*heightRatio+j*widthRatio;
				data[pos1] = data2[pos2];
				data[pos1+1] = data2[pos2+1];
				data[pos1+2] = data2[pos2+2];
				data[pos1+3] = data2[pos2+3];
			}
		}
		ctx.putImageData(imgData, 0, 0);
	}

	mergeWith(layer2){
		const ctx = this.canvas.getContext('2d');
		const imgData = ctx.getImageData(0,0,this.w,this.h);
		const data = imgData.data;
		const ctx2 = layer2.canvas.getContext('2d');
		const imgData2 = ctx2.getImageData(0,0,layer2.w,layer2.h);
		let data2 = imgData2.data;
		data2 = this.crow.merge(data2,data,this.opacity,this.mode);
		ctx2.putImageData(imgData2,0,0);
	}
}