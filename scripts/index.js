import { Crow } from './crow.js';

const crow = new Crow();
main();

function main()
{
	document.querySelector('.popup .button').addEventListener('click',function(){	crow.startDrawing()	});
	
	const canvas = document.querySelector('div#canvasFrame > div > canvas');
	canvas.addEventListener('mousedown', function(){	crow.actionStart()	});
	canvas.addEventListener('click', function(){	crow.actionEnd()	}); 
	canvas.addEventListener('mouseleave', function(){	crow.actionInterrupted()	});
	canvas.addEventListener('mousemove', function(){	crow.actionProcess()	}); 
	
	document.querySelector('#buttonBrush').addEventListener('click', function(){	crow.setTool('Brush')	}); 
	document.querySelector('#buttonRuler').addEventListener('click', function(){	crow.setTool('Ruler')	});
	document.querySelector('#buttonEraser').addEventListener('click', function(){	crow.setTool('Eraser')	});
	document.querySelector('#buttonDropper').addEventListener('click', function(){	crow.setTool('Dropper')	});
	document.querySelector('#buttonFill').addEventListener('click', function(){	crow.setTool('Fill')	});

	document.querySelector('div:nth-of-type(1) > div:nth-of-type(6)').addEventListener('click', function(){	crow.cancel()	});
	document.querySelector('div:nth-of-type(1) > div:nth-of-type(7)').addEventListener('click', function(){	crow.savefile()	});

	document.querySelector("input[name='thicknessSetting']").addEventListener('change', (event) => {	crow.updateProperties('thickness',event.target.value)	});
	document.querySelector("input[name='toleranceSetting']").addEventListener('change', (event) => {	crow.updateProperties('tolerance',event.target.value)	});
	document.querySelector("input[name='realtimeCheck']").addEventListener('click', (event) => {	crow.updateProperties('realtimeCheck',event.target.checked)	});
	
	document.querySelector("input[name='redBar']").addEventListener('change', function(){	crow.updateColor('bar')	});
	document.querySelector("input[name='greenBar']").addEventListener('change', function(){	crow.updateColor('bar')	});
	document.querySelector("input[name='blueBar']").addEventListener('change', function(){	crow.updateColor('bar')	});
	document.querySelector("input[name='alphaBar']").addEventListener('change', function(){	crow.updateColor('bar')	});

	document.querySelector("input[name='redNumber']").addEventListener('change', function(){	crow.updateColor('number')	});
	document.querySelector("input[name='greenNumber']").addEventListener('change', function(){	crow.updateColor('number')	});
	document.querySelector("input[name='blueNumber']").addEventListener('change', function(){	crow.updateColor('number')	});
	document.querySelector("input[name='alphaNumber']").addEventListener('change', function(){	crow.updateColor('number')	});

	document.querySelector('div:nth-of-type(1) > .button.layersButton').addEventListener('click', function(){	crow.newLayer()	});
	document.querySelector('div:nth-of-type(2) > .button.layersButton').addEventListener('click', function(){	crow.flattenDown()	});
	document.querySelector('div:nth-of-type(3) > .button.layersButton').addEventListener('click', function(){	crow.swapDown()	});
	document.querySelector('div:nth-of-type(4) > .button.layersButton').addEventListener('click', function(){	crow.swapUp()	});
}

