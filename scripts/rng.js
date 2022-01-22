export class RNG{
	constructor(s = 0) {
		this.seed = s;
		this.modulus = 2 ** 32;
		this.a = 1664525;
		this.c = 1013904223;
	}

	get(){
		const returnVal = this.seed / this.modulus;
		this.seed = (this.a * this.seed + this.c) % this.modulus;
		return returnVal;
	}

	set(s){
		this.seed = s;
	}
}