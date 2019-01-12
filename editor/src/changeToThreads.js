modules.changeToThreads = '2018-December-22';

Process.prototype.reportTypeOf = function (thing) {
    // answer a string denoting the argument's type
    var exp;
    if (thing === null || (thing === undefined)) {
        return 'nothing';
    }
    if (thing === true || (thing === false)) {
        return 'Boolean';
    }
    if (thing instanceof List) {
        return 'list';
    }
    if (thing instanceof Dict) {
	return 'dict';
    }
    if (!isNaN(+thing)) {
        return 'number';
    }
    if (isString(thing)) {
        return 'text';
    }
    if (thing instanceof SpriteMorph) {
        return 'sprite';
    }
    if (thing instanceof StageMorph) {
        return 'stage';
    }
    if (thing instanceof Costume) {
        return 'costume';
    }
    if (thing instanceof Sound) {
        return 'sound';
    }
    if (thing instanceof Context) {
        if (thing.expression instanceof RingMorph) {
            return thing.expression.dataType();
        }
        if (thing.expression instanceof ReporterBlockMorph) {
            if (thing.expression.isPredicate) {
                return 'predicate';
            }
            return 'reporter';
        }

        if (thing.expression instanceof Array) {
            exp = thing.expression[thing.pc || 0];
            if (exp.isPredicate) {
                return 'predicate';
            }
            if (exp instanceof RingMorph) {
                return exp.dataType();
            }
            if (exp instanceof ReporterBlockMorph) {
                return 'reporter';
            }
            if (exp instanceof CommandBlockMorph) {
                return 'command';
            }
            return 'reporter'; // 'ring';
        }

        if (thing.expression instanceof CommandBlockMorph) {
            return 'command';
        }
        return 'reporter'; // 'ring';
    }
    return 'undefined';
};
Process.prototype.reportNewDict = function(dict) {
    return dict;// has already been converted to a dict
};
Process.prototype.reportDictValue = function(key, dict) {
    this.assertType(dict, 'dict');
    return dict.at(key);
};
Process.prototype.doReplaceDictValue = function(key, dict, value) {
    this.assertType(dict, 'dict');
    dict.put(key, value);
};
Process.prototype.doRemoveDictPair = function(key, dict) {
    this.assertType(dict, 'dict');
    dict.remove(key);
};
Process.prototype.reportPairsCount = function(dict) {
    this.assertType(dict, 'dict');
    return dict.length();
};
Process.prototype.reportDictKeys = function(dict) {// this is builtin to list
    this.assertType(dict, 'dict');
    var list = new List();
    list.isSet = true;
    var object = {};
    for (key in dict.contents) {
	if (object.contents.hasOwnProperty(key)) {
	    object[key] = null;// we don't need the values.
	}
    }
    list.dict = new Dict(object);
    return list
};
Process.prototype.reportDictValues = function(dict) {
    this.assertType(dict, 'dict');
    var values = dict.values();
    var list = new List(values);
    return list;
};
Process.prototype.evaluateDictSlot = function (multiSlot, argCount) {
    // first evaluate all subslots, then return a list of their values
    var inputs = this.context.inputs,
        ans;
    if (multiSlot.bindingID) {
        if (this.isCatchingErrors) {
            try {
                ans = this.context.variables.getVar(multiSlot.bindingID);
            } catch (error) {
                this.handleError(error, multiSlot);
            }
        } else {
            ans = this.context.variables.getVar(multiSlot.bindingID);
        }
        this.returnValueToParentContext(ans);
        this.popContext();
    } else {
        if (argCount > inputs.length) {
            this.evaluateNextInput(multiSlot);
        } else {
	    var dict = new Dict();
	    for(var index = 0; index < inputs.length; index += 2) {
		dict.put(inputs[index], inputs[index+1]);
	    }
            this.returnValueToParentContext(dict);
            this.popContext();
        }
    }
};
Process.prototype.evaluateContext = function () {
    var exp = this.context.expression;
    this.frameCount += 1;
    if (this.context.tag === 'exit') {
        this.expectReport();
    }
    if (exp instanceof Array) {
        return this.evaluateSequence(exp);
    }
    if (exp instanceof MultiArgMorph) {
	if (exp instanceof DictArgMorph) {
	    return this.evaluateDictSlot(exp, exp.inputs().length);
	}
        return this.evaluateMultiSlot(exp, exp.inputs().length);
    }
    if (exp instanceof ArgLabelMorph) {
        return this.evaluateArgLabel(exp);
    }
    if (exp instanceof ArgMorph || exp.bindingID) {
        return this.evaluateInput(exp);
    }
    if (exp instanceof BlockMorph) {
        return this.evaluateBlock(exp, exp.inputs().length);
    }
    if (isString(exp)) {
        return this[exp].apply(this, this.context.inputs);
    }
    this.popContext(); // default: just ignore it
};

Process.prototype.reportMap = function (reporter, list) {
    // answer a new list containing the results of the reporter applied
    // to each value of the given list. Distinguish between linked and
    // arrayed lists.
    // Note: This method utilizes the current context's inputs array to
    // manage temporary variables, whose allocation to which slot are
    // documented in each of the variants' code (linked or arrayed) below

    var next;
    if (list.isLinked) {
        // this.context.inputs:
        // [0] - reporter
        // [1] - list (original source)
        // -----------------------------
        // [2] - result list (target)
        // [3] - currently last element of result list
        // [4] - current source list (what's left to map)
        // [5] - current value of last function call

        if (this.context.inputs.length < 3) {
            this.context.addInput(new List());
            this.context.inputs[2].isLinked = true;
            this.context.addInput(this.context.inputs[2]);
            this.context.addInput(list);
        }
        if (this.context.inputs[4].length() === 0) {
            this.context.inputs[3].rest = list.cons(this.context.inputs[5]);
            this.returnValueToParentContext(this.context.inputs[2].cdr());
            return;
        }
        if (this.context.inputs.length > 5) {
            this.context.inputs[3].rest = list.cons(this.context.inputs[5]);
            this.context.inputs[3] = this.context.inputs[3].rest;
            this.context.inputs.splice(5);
        }
        next = this.context.inputs[4].at(1);
        this.context.inputs[4] = this.context.inputs[4].cdr();
        this.pushContext();
        this.evaluate(reporter, new List([next]));
    } else { // arrayed
        // this.context.inputs:
        // [0] - reporter
        // [1] - list (original source)
        // -----------------------------
        // [2..n] - result values (target)

	if (list.isSet) list.becomeArray();
	
        if (this.context.inputs.length - 2 === list.length()) {
            this.returnValueToParentContext(
                new List(this.context.inputs.slice(2))
            );
            return;
        }
        next = list.at(this.context.inputs.length - 1);
        this.pushContext();
        this.evaluate(reporter, new List([next]));
    }
};

Process.prototype.doForEach = function (upvar, list, script) {
    // perform a script for each element of a list, assigning the
    // current iteration's element to a variable with the name
    // specified in the "upvar" parameter, so it can be referenced
    // within the script. Uses the context's - unused - fourth
    // element as temporary storage for the current list index
    if (list.isLinked) {
	this.context.outerContext.variables.addVar(upvar);
	this.context.outerContext.variables.setVar(
            upvar,
            list.first
	);
	this.pushContext('doYield');
	this.pushContext();
	return;
    }
    if (list.isSet) list.becomeArray();
    if (isNil(this.context.inputs[3])) {this.context.inputs[3] = 1; }
    var index = this.context.inputs[3];
    this.context.outerContext.variables.addVar(upvar);
    this.context.outerContext.variables.setVar(
        upvar,
        list.at(index)
    );
    if (index > list.length()) {return; }
    this.context.inputs[3] += 1;
    this.pushContext('doYield');
    this.pushContext();
    this.evaluate(script, new List(), true);
};

Process.prototype.reportParseJson = function (string) {
    function asSnapTypes(js) {
	if (typeof js === 'object') {
	    if (object instanceof Array) {
		return new List(js.map(asSnapTypes));
	    }
	    // it is an object
	    var key;
	    var result = new Dict();
	    for (key in js) {
		if (js.hasOwnProperty(key)){
		    result.put(key, asSnapTypes(js[key]));
		}
	    }
	    return result;
	}
	return js;
    }
    return asSnapTypes(JSON.parse(string));
};

Process.prototype.reportCreateJson = function (json) {
    function asJsTypes(snap) {
	if (typeof js === 'object') {
	    if (object instanceof List) {
		return snap.asArray().map(asSnapTypes);
	    }
	    if (object instanceof Dict) {
		var key;
		var result = {};
		for (key in snap.contents) {
		    if (snap.contents.hasOwnProperty(key)) {
			result[key] = asJsTypes(snap.at(key));
		    }
		}
		return result;
	    }
	    throw new Error('expecting dict or list but getting ' +
			    this.reportTypeOf(snap));
	}
	return js === undefined ? null : js;
    }
};
