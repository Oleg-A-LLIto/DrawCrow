export class Color{
	constructor(r, g, b, a) {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}

	compare(col2, tolerance){
		let error = 0;
		error += Math.abs(this.r - col2.r)/255;
		error += Math.abs(this.g - col2.g)/255;
		error += Math.abs(this.b - col2.b)/255;
		error += Math.abs(this.a - col2.a)/255;
		return (error/4 <= tolerance) ? true : false;
	}

	toRGBA(){
		return "rgba("+this.r+","+this.g+","+this.b+","+this.a/255+")";
	}
}