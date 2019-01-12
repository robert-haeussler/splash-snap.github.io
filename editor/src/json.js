Process.prototype.createJson = function(object) {
    switch(this.reportTypeOf(object)) {
    case 'nothing':
	return 'null'// don't return undefined
    case 'Boolean':
    case 'number':
    case 'text':
	return JSON.stringify(object);// basic types
    case 'list':
	if (!object.isLinked && object.contents.length === 0) return '[]'
	var result;
	var index;
	if (object.isLinked) {
	    result = '[' + this.createJson(object.first);
	    object = object.rest
	    while (object.isLinked) {
		result += ', ' + this.createJson(object.first);
		object = object.rest;
	    }
	    index = 0;
	} else {
	    result = '[' + this.createJson(object.contents[0])
	    index = 1;
	}
	while (index < object.contents.length) {
	    result += ', ' + this.createJson(object.contents[index]);
	    index ++;
	}
	return result + ']';
    case 'dict':
	var key;
	var result = '{';
	for (key in object.contents) {
	    if (object.hasOwnProperty(object)){
		if (result !== '{') {
		    result += ', ';
		}
		result += JSON.stringify(key) + ': ' + this.createJson(object.at(key));
	    }
	}
	return result + '}';
    case 'sprite'://("sprite", [*x, *y], *costume)
	return '("sprite", [' + object.xPosition() + ', ' + object.yPosition() + '], ' + this.createJson(object.costume) + ')';
    case 'stage'://("stage", *costume)
	return '("stage", ' + this.createJson(object.costume) + ')';
    case 'costume'://("costume", *isSvg, *name, *b64 || *SVG)
	if (object instanceof SVG_Costume) {
	    return '("costume", true, ' + object.name + ', ' + object.contents + ')';
	} else {
	    return '("costume, false, ' + object.name + ', ' + object.contents.toDataURL().substring(20) + ')';
	}
    case 'sound'://("sound", *name, *src)
	return '("sound", ' + object.name + ', ' + object.audio.src + ')';
    case 'undefined':
	return String(object);// it is a JS function
	
    default: //it is a ring. <*parms, *blocks>
	function scriptList(script) {
	    var items = [];
	    var index;
	    while (script instanceof BlockMorph) {
		items.push([]);
		for (index = 0; index < script.children.length; index ++) {
		    if (script.children[index] instanceof SyntaxElementMorph &&
			!script.children[index] instanceof CommandBlockMorph) {
			items[items.length-1].push(script.children[index]);
		    }
		}
		script = script.children[script.children.length-1];
	    }
	    // unfinished
	}
	var parms = {};
	var key;
	for (key in object.variables.vars) {
	    parms[key] = object.variables.vars[key].value;
	}
	return '<' + JSON.stringify(parms) + ', ' + this.createJson(scriptList(object.expression)) + '>';

    }
};
Process.prototype.parseJson = function(json) {
    function makeObject(basic) {
	if (basic instanceof Array) {
	    result = new List();
	    for (var index = 0; index < basic.length; index ++) {
		result.add(makeObject(basic[index]));
	    }
	    return result;
	} else {
	    result = new Dict();
	    var key;
	    for (key in basic) {
		if (basic.hasOwnProperty(key)) {
		    result.put(key, makeObject(basic[key]));
		}
	    }
	    return result
	}
    }
};
