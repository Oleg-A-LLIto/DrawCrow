import { RNG } from './rng.js';
import { Color } from './color.js';
import { Layer } from './layer.js';

export class Crow {

	constructor() {
		this.width = 960;
		this.height = 720;
		this.tool = "Brush";
		this.curcol = new Color(0,0,0,255);
		this.layers = [];
		this.tol = 0.75;
		this.thickness = 2;
		this.layerIncrement = 0;
		this.activelayer = 0;
		this.simplifiedPreview = true;
		this.actionOngoing = false;
		this.Random = new RNG();
		this.canvas = document.querySelector('div#canvasFrame > div > canvas');
		this.scale = 1;
		this.artwork = "My masterpiece";
	}

	startDrawing(){ 
		const frame = document.querySelector('div#canvasFrame');
		this.width = document.querySelector(`input[name='pictureWidth']`).value;
		this.height = document.querySelector(`input[name='pictureHeight']`).value;
		this.artwork = document.querySelector(`input[name='pictureName']`).value;
		const canvasWrapper = document.querySelector(`div#canvasFrame > div`);
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		const ratio = this.width / this.height;
		if(ratio === 4/3){
			this.scale = 720/this.height;
		}
		else{
			if(ratio > 4/3){
				this.scale = 710/this.height;
				frame.style.overflowX = "scroll";
				frame.style.overflowY = "hidden";
			}
			else{
				this.scale = 950/this.width;
				frame.style.overflowY = "scroll";
				frame.style.overflowX = "hidden";
			}
		}
		this.thickness /= this.scale; 
		this.canvas.style.transform = `scale(${this.scale})`;
		canvasWrapper.style.width = this.width * this.scale;
		canvasWrapper.style.height = this.height * this.scale;
		this.buffer = document.createElement('canvas');
		this.buffer.width = this.width;
		this.buffer.height = this.height;
		document.querySelector('body > div.mute').remove();
		this.newLayer();
	}

	savefile(){
	    const image = this.canvas.toDataURL("image/png");
	    const link = document.createElement('a');
		link.href = image;
		link.download = this.artwork+'.png';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		//window.location.href=image; 
	}

	reorderPlates(){
		const ll = document.getElementById("layerslist");
		const plates = document.querySelectorAll(".layerPlate");
		for(let i = this.layers.length-1; i >= 0; i--){
			for(const plate of plates){
				if(plate.id == ("plate"+this.layers[i].id)){
					ll.append(plate);
					break;
				}
			}
		}
	}

	switchToLayer(layerId){
		this.activelayer = this.idToNum(layerId);
		const plates = document.querySelectorAll(".layerPlate");
		for(const plate of plates){
			if(plate.id == ("plate"+this.layers[this.activelayer].id)){
				plate.classList.add("selected");
			}
			else{
				plate.classList.remove("selected");
			}
		}
		this.layers[this.activelayer].updateColor();
		this.updateLayerButtons();
	}

	idToNum(layerId){
		for(let i = 0; i < this.layers.length; i++){
			if (this.layers[i].id === layerId){
				return i;
			}
		}
	}

	newLayer(){
		const layerId = this.layerIncrement++;
		this.layers.push(new Layer(layerId, this.width, this.height, this, this.canvas));
		this.switchToLayer(layerId);
	}

	flattenImage(){
		const ctx = this.canvas.getContext('2d');
		ctx.clearRect(0, 0, this.width, this.height);
		if(this.layers.length == 0){
			return;
		}
		let imgData = ctx.getImageData(0, 0, this.width, this.height);
		let data = imgData.data;
		//iterate over array elements not ints
		for(let i = 0; i < this.layers.length; i++){
			if(this.layers[i].visible==false)
				continue;
			const data2 = this.layers[i].getdata().data;
			data = this.merge(data, data2, this.layers[i].opacity, this.layers[i].mode);
			//imgData.data = data;
		}
		ctx.putImageData(imgData, 0, 0);
		Layer.replaceLayer(this.buffer, this.canvas);
	}

	flattenDown(){
		if(this.activelayer>0){
			this.layers[this.activelayer].mergeWith(this.layers[this.activelayer-1]);
			this.deleteLayer(this.activelayer);
			this.layers[this.activelayer].updateThumbnail();
			this.updateLayerButtons();
		}
	}

	merge(data, data2, op2, mode){
		this.Random.set(0);
		for (let j = 0; j < data.length; j += 4) {
			const rand = this.Random.get();
			const data2op = data2[j+3] * (op2/100);
			let culling = 255 - (data2op + data[j+3]);
			if (culling > 0) culling = 0;
			const ratio = data2op/(data2op + data[j+3] + culling);
			data[j] = this.calculateColor(data[j], data2[j], data[j+3], data2op, ratio, mode, rand); // red
			data[j+1] = this.calculateColor(data[j+1], data2[j+1], data[j+3], data2op, ratio, mode, rand); //green
			data[j+2] = this.calculateColor(data[j+2], data2[j+2], data[j+3], data2op, ratio, mode, rand);  //blue
			data[j+3] = Math.min(data2op + data[j+3], 255);
		}
		return data;
	}

	calculateColor(pix1, pix2, alpha1, alpha2, ratio, mode, rand){
		switch(mode){
			case('normal'):
				return pix2*ratio + pix1*(1-ratio);
			case('negate'):
				return pix1 * (alpha1/255) - pix2 * (alpha2/255);
			case('dissolve'):
				return (rand < ratio) ? pix2 : pix1;
			case('add'):
				return pix1 * (alpha1/255) + pix2 * (alpha2/255);
		}
	}

	updateColor(source){
		const redBar = document.querySelector("input[name='redBar']");
		const greenBar = document.querySelector("input[name='greenBar']");
		const blueBar = document.querySelector("input[name='blueBar']");
		const alphaBar = document.querySelector("input[name='alphaBar']");
		const redNumber = document.querySelector("input[name='redNumber']");
		const greenNumber = document.querySelector("input[name='greenNumber']");
		const blueNumber = document.querySelector("input[name='blueNumber']");
		const alphaNumber = document.querySelector("input[name='alphaNumber']");
		let red, green, blue, alpha;
		if(source=='bar'){
			red = redBar.value;
			green = greenBar.value;
			blue = blueBar.value;
			alpha = alphaBar.value;
			redNumber.value = red;
			greenNumber.value = green;
			blueNumber.value = blue;
			alphaNumber.value = Math.round(alpha);
		}
		else{
			red = redNumber.value;
			green = greenNumber.value;
			blue = blueNumber.value;
			alpha = alphaNumber.value;
			redBar.value = red;
			greenBar.value = green;
			blueBar.value = blue;
			alphaBar.value = alpha;
		}
		this.curcol = new Color(red,green,blue,alpha);
		document.getElementById('colorSample').style.background = this.curcol.toRGBA(); 
		//template literals
		redBar.style.background = `linear-gradient(to right, rgba(0,${green},${blue},1), rgba(255,${green},${blue},1))`;
		greenBar.style.background = `linear-gradient(to right, rgba(${red},0,${blue},1), rgba(${red},255,${blue},1))`;
		blueBar.style.background = `linear-gradient(to right, rgba(${red},${green},0,1), rgba(${red},${green},255,1))`;
		alphaBar.style.background = `linear-gradient(to right, rgba(${red},${green},${blue},0), rgba(${red},${green},${blue},1))`;
		this.layers[this.activelayer].updateColor();
		const ctx = this.canvas.getContext('2d');
		ctx.strokeStyle = this.curcol.toRGBA();
		ctx.fillStyle = this.curcol.toRGBA();
	}

	actionStart(){
		this.actionOngoing = true;
		this.layers[this.activelayer].save();
		const ctx = this.canvas.getContext('2d');
		const rect = this.canvas.getBoundingClientRect();
		const mouseX = (event.clientX - rect.left)/this.scale;
		const mouseY = (event.clientY - rect.top)/this.scale;
		switch (this.tool){
			case "Ruler":
				this.layers[this.activelayer].RulerStart(mouseX,mouseY);
				return;
			case "Eraser":
				this.layers[this.activelayer].erase(mouseX,mouseY);
				this.flattenImage();
				return;
			case "Brush":
				this.layers[this.activelayer].drawPen(mouseX,mouseY);
				if(!this.simplifiedPreview)
					this.flattenImage();
				return;
			case "Dropper":
				this.layers[this.activelayer].sample(mouseX,mouseY);
				return;
			case "Fill":
				return;
			default:
				throw new Error("tool not found");
		}
	}

	cancel(){
		this.layers[this.activelayer].load();
		this.flattenImage();
	}

	actionProcess(){
		if (this.actionOngoing){
			const ctx = this.canvas.getContext('2d');
			const rect = this.canvas.getBoundingClientRect();
			const mouseX = (event.clientX - rect.left)/this.scale;
			const mouseY = (event.clientY - rect.top)/this.scale;
			switch (this.tool){
				case "Brush":
					this.layers[this.activelayer].drawPen(mouseX,mouseY);
					if(!this.simplifiedPreview)
						this.flattenImage();
					return;
				case "Ruler":
					Layer.replaceLayer(this.canvas, this.buffer);
					this.layers[this.activelayer].RulerRender(mouseX,mouseY);
					return;
				case "Eraser":
					this.layers[this.activelayer].erase(mouseX,mouseY);
					this.flattenImage();
					return;
				case "Dropper":
					this.layers[this.activelayer].sample(mouseX,mouseY);
					return;
				case "Fill":
					return;
				default:
					throw new Error("tool not found");
			}
		}
	}

	actionEnd(){
		if (this.actionOngoing){
			this.actionOngoing = false;
			const ctx = this.canvas.getContext('2d');
			const rect = this.canvas.getBoundingClientRect();
			const mouseX = (event.clientX - rect.left)/this.scale;
			const mouseY = (event.clientY - rect.top)/this.scale;
			switch (this.tool){
				case "Ruler":
					this.layers[this.activelayer].RulerEnd(mouseX,mouseY);
					//ctx.putImageData(this.layers[this.activelayer].getdata(), 0, 0);
					this.flattenImage();
					break;
				case "Brush":
					this.layers[this.activelayer].clearPen();
					this.flattenImage();
					break;
				case "Fill":
					this.layers[this.activelayer].fill(mouseX,mouseY);
					//ctx.putImageData(this.layers[this.activelayer].getdata(), 0, 0);
					this.flattenImage();
					break;
				case "Dropper":
				case "Eraser":
					break;
				default:
					throw new Error("tool not found");
			}
			this.layers[this.activelayer].updateThumbnail();
		}
	}

	actionInterrupted(){
		if(this.actionOngoing){
			this.actionOngoing = false;
			switch (this.tool){
				case "Ruler":
				case "Brush":
					this.layers[this.activelayer].clearPen();
					break;
			}
			this.flattenImage();
		}
	}

	setTool(tl){
		this.tool = tl;
		const tools = document.querySelectorAll("div.toolButton");
		for(let i = 0; i<tools.length; i++){
			if(tools[i].id == ("button" + this.tool)){
				tools[i].classList.add("selected");
			}
			else{
				tools[i].classList.remove("selected");
			}
		}
	}

	updateProperties(prop){
		switch(prop){
			case('thickness'):
				const thicknessSample = document.getElementById('thicknessSampleCircular');
				this.thickness = document.querySelector("input[name='thicknessSetting']").value;
				thicknessSample.style.height = this.thickness;
				thicknessSample.style.width = this.thickness;
				thicknessSample.style.top = 32 - this.thickness/2;
				thicknessSample.style.left = 64 - this.thickness/2;
				this.thickness /= this.scale;
				break;
			case('tolerance'):
				this.tol = document.querySelector("input[name='toleranceSetting']").value;
				let brightness = 128 - 128 * this.tol;
				document.getElementById('toleranceSampleDark').style.background = `rgba(${brightness},${brightness},${brightness},1)`;
				document.getElementById('toleranceSampleBright').style.background = "rgba("+ (128 + 128 * this.tol) +","+ (128 + 128 * this.tol) +","+ (128 + 128 * this.tol) +",1)";
				break;
			case('realtime'):
				this.simplifiedPreview = !(document.getElementById('realtimeCheck').checked);
				alert(this.simplifiedPreview);
				break;
		}
	}

	updateLayerProperties(prop, layerId, value){
		//for of
		for(const layer of this.layers){
			if (layer.id == layerId) {
				switch(prop){
					case('opacity'):
						layer.opacity = value;
						break;
					case('visible'):
						layer.visible = value;
						break;
					case('mode'):
						layer.mode = value;
						break;
				}
			}
		}
		this.flattenImage();
	}

	updateLayerButtons(){
		if(this.activelayer === this.layers.length-1){
			document.querySelector("div:nth-of-type(4) > .button.layersButton").classList.add("unavailable");
		}
		else{
			document.querySelector("div:nth-of-type(4) > .button.layersButton").classList.remove("unavailable");
		}
		if(this.activelayer === 0){
			document.querySelector("div:nth-of-type(3) > .button.layersButton").classList.add("unavailable");
			document.querySelector("div:nth-of-type(2) > .button.layersButton").classList.add("unavailable");
		}
		else{
			document.querySelector("div:nth-of-type(3) > .button.layersButton").classList.remove("unavailable");
			document.querySelector("div:nth-of-type(2) > .button.layersButton").classList.remove("unavailable");
		}
	}


	swapUp(){
		if(this.activelayer<this.layers.length-1){
			let temp = this.layers[this.activelayer + 1];
			this.layers[this.activelayer + 1] = this.layers[this.activelayer];
			this.layers[this.activelayer] = temp;	
			this.activelayer += 1;
			this.reorderPlates();
			this.updateLayerButtons();
			this.flattenImage();
		}
	}

	swapDown(){
		if(this.activelayer>0){
			let temp = this.layers[this.activelayer - 1];
			this.layers[this.activelayer - 1] = this.layers[this.activelayer];
			this.layers[this.activelayer] = temp;	
			this.activelayer -= 1;
			this.reorderPlates();
			this.updateLayerButtons();
			this.flattenImage();
		}
	}

	deleteLayer(laynum){
		const layerId = this.layers[laynum].id;
		this.layers.splice(laynum,1);
		//delete temp;
		document.getElementById('plate'+layerId).remove();
		if(this.activelayer === laynum){
			this.activelayer = ((laynum > 0) ? laynum-1 : 0);
			this.layers[this.activelayer].updateColor();
			document.getElementById('plate'+this.layers[this.activelayer].id).classList.add("selected");
		}
		else{
			if(this.activelayer > laynum){
				this.activelayer -= 1;
			}
		}
		this.flattenImage();
		this.updateLayerButtons();
	}
}