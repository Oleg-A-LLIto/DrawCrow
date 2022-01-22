export class Color{
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

	compareStrict(col2){
		return ((this.r == col2.r)&&(this.g == col2.g)&&(this.b == col2.b)&&(this.a == col2.a));
	}

	negative(){
		return Color(255-r, 255-g, 255-b, 1);
	}

	toRGBA(){
		return "rgba("+this.r+","+this.g+","+this.b+","+this.a/255+")";
	}
}