/* 
adds a new type of list: the set
a set is stored as a dict whose values are all null
it is not very powerful: it is always alphabetically sorted,
can only have one element with any value, and can only store strings.
it is fast to check if it contains an element however.

as of now, it can only be created with
the (keys of [=]) block and cannot be mutated
*/
List = (function(oldList) {// replace the constructer
    var oldPrototype = oldList.prototype;
    function List(array) {
	this.type = null; // for UI lists, such as costumes, sounds, sprites
	this.contents = array || [];
	this.first = null;
	this.rest = null;
	this.isLinked = false;
	
	this.isSet = false;// for use by the dict keys block
	this.dict = null;
	
	this.lastChanged = Date.now();
    }
    List.prototype = oldPrototype;
    List.prototype.constructer = List;
    return List;
})(List)

List.prototype.length = function () {
    if (this.isSet) return this.dict.length();
    if (this.isLinked) {
        var pair = this,
            result = 0;
        while (pair && pair.isLinked) {
            result += 1;
            pair = pair.rest;
        }
	if (pair && pair.isSet) return result + pair.dict.length()
        return result + (pair ? pair.contents.length : 0);
    }
    return this.contents.length;
};

List.prototype.at = function (index) {
    var value, idx = +index, pair = this;
    while (pair.isLinked) {
        if (idx > 1) {
            pair = pair.rest;
            idx -= 1;
        } else {
            return pair.first;
        }
    }
    if (this.isSet) {
	for (value in this.dict.contents) {
	    if (Object.prototype.hasOwnProperty.call(this.dict.contents, value)) {
		if (idx <= 1) {
		    return value;
		}
		idx -= 1;
	    }
	}
    }
    value = pair.contents[idx - 1];
    return isNil(value) ? '' : value;
};

List.prototype.contains = function (element) {
    var pair = this;
    while (pair.isLinked) {
        if (snapEquals(pair.first, element)) {
            return true;
        }
        pair = pair.rest;
    }
    if (this.isSet) {
	return Object.prototype.hasOwnProperty.call(this.dict.contents,
						    element);
    }
    // in case I'm arrayed
    return pair.contents.some(function (any) {
        return snapEquals(any, element);
    });
};

List.prototype.itemsArray = function () {
    // answer an array containing my elements
    // don't convert linked lists to arrays
    if (this.isLinked) {
        var next = this,
            result = [],
            i;
        while (next && next.isLinked) {
            result.push(next.first);
            next = next.rest;
        }
        if (next) {
	    if (next.isSet) {
		for (i in next.dict.contents) {
		    if (Object.hasOwnProperty.call(next.dict.contents, i)) {
			result.push(i);
		    }
		}
	    } else {
		for (i = 1; i <= next.contents.length; i += 1) {
                    result.push(next.at(i));
		}
	    }
        }
        return result;
    }
    if (this.isSet) return this.dict.keys()
    return this.contents;
};

List.prototype.becomeLinked = function () {
    var i, stop, tail = this;
    if (!this.isLinked) {
	if (this.isSet) this.becomeArray();
        stop = this.length();
        for (i = 0; i < stop; i += 1) {
	    tail.first = this.contents[i];
	    if (i < (stop - 1)) {
                tail.rest = new List();
                tail.isLinked = true;
                tail = tail.rest;
	    }
        }
        this.contents = [];
        this.isLinked = true;
    }
};

List.prototype.equalTo = function (other) {
    var myself = this, it = other, i, j, loopcount;
    if (!(other instanceof List)) {
        return false;
    }

    while (myself.isLinked && it.isLinked) {
        if (!snapEquals(myself.first, it.first)) {
            return false;
        }
        myself = myself.rest;
        it = it.rest;
    }

    if (it.isLinked) {
        i = it;
        it = myself;
        myself = i;
    }

    if (it.isSet) it.becomeArray();

    j = 0;
    while (myself.isLinked) {
        if (!snapEquals(myself.first, it.contents[j])) {
            return false;
        }
        myself = myself.rest;
        j += 1;
    }

    if (myself.isSet) myself.becomeArray();

    i = 0;
    if (myself.contents.length !== (it.contents.length - j)) {
        return false;
    }

    loopcount = myself.contents.length;
    while (loopcount > 0) {
        loopcount -= 1;
        if (!snapEquals(myself.contents[i], it.contents[j])) {
            return false;
        }
        i += 1;
        j += 1;
    }
    return true;
};
