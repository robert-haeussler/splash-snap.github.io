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
Process.prototype.reportPairsCount = function(dict) {
    this.assertType(dict, 'dict');
    return dict.length();
};
Process.prototype.reportDictKeys = function(dict) {
    this.assertType(dict, 'dict');
    var keys = dict.keys();
    var list = new List(keys);
    return list;
};
Process.prototype.reportDictValues = function(dict) {
    this.assertType(dict, 'dict');
    var values = dict.values();
    var list = new List(values);
    return list;
};
