modules.dicts = '2018-December-22';

// Dict ////////////////////////////////////////////////////////////////

/*
  I am a hashtable object simelar to the ones native to javascript.
  I use the same .at(key), .put(key, value), .remove(key) and .length() 
  functions as do lists (but not .cons(item), .cdr() and .add(index, val))
  as well as .keys() and .values() from JavaScript Objects.
*/

function Dict(obj) {
    this.contents = obj;
    this.lastChanged = Date.now();
}

Dict.prototype.changed = function () {
    this.lastChanged = Date.now();
};

Dict.prototype.asString = function () {
    return 'a Dict [' + this.length() + '] pairs';
};

Dict.prototype.length = function() {
    var length = 0;
    for (key in this.contents) {
	if (Object.prototype.hasOwnProperty.call(this.contents, key)) {
	    length ++;
	}
    }
};

Dict.prototype.at = function(key) {
    if (Object.prototype.hasOwnProperty.call(this.contents, key)) {
	return this.contents[key];
    } else {
	throw new Error('key "' + key + '" not in dict.')
    }
};

Dict.prototype.put = function(key, value) {
    if (value === undefined) value = null;
    if (!Object.prototype.hasOwnProperty.call(this.contents, key) || this.contents[key] !== value) {
	this.contents[key] = value;
	this.changed();
    }
};

Dict.prototype.remove = function(key) {
    if (this.contents[key] !== undefined) {
	delete this.contents[key];
	this.changed();
    }
};

Dict.prototype.keys = function() {
    var keys = [];
    for (key in this.contents) {
	if (Object.prototype.hasOwnProperty.call(this.contents, key)) {
	    keys.push(key);
	}
    }
    return keys;
};

Dict.prototype.values = function() {
    var values = [];
    for (key in this.contents) {
	if (Object.prototype.hasOwnProperty.call(this.contents, key)) {
	    values.push(this.contents[key]);
	}
    }
    return values;
};

Dict.prototype.isTable = function() {
    return this.length() > 100 || (this.values()[0] instanceof List);
};

// DictWatcherMorph ////////////////////////////////////////////////////

/*
  I am a little window which observes a dict and continuously
  updates itself accordingly
*/

// DictWatcherMorph inherits from ListWatcherMorph:
DictWatcherMorph.prototype = new ListWatcherMorph();
DictWatcherMorph.prototype.constructor = DictWatcherMorph;
DictWatcherMorph.uber = ListWatcherMorph.prototype;
function DictWatcherMorph(dict, parentCell) {
    this.init(dict, parentCell);
}

DictWatcherMorph.prototype.init = function (dict, parentCell) {
    var myself = this;

    this.dict = dict || new Dict();
    this.start = 1;
    this.range = 100;
    this.lastUpdated = Date.now();
    this.lastCell = null;
    this.parentCell = parentCell || null; // for circularity detection

    // elements declarations
    this.label = new StringMorph(
        localize('pairs: ') + this.dict.length(),
        SyntaxElementMorph.prototype.fontSize,
        null,
        false,
        false,
        false,
        MorphicPreferences.isFlat ? new Point() : new Point(1, 1),
        new Color(255, 255, 255)
    );
    this.label.mouseClickLeft = function () {myself.startIndexMenu(); };


    this.frame = new ScrollFrameMorph(null, 10);
    this.frame.alpha = 0;
    this.frame.acceptsDrops = false;
    this.frame.contents.acceptsDrops = false;

    this.handle = new HandleMorph(
        this,
        80,
        70,
        3,
        3
    );
    this.handle.setExtent(new Point(13, 13));

    this.arrow = new ArrowMorph(
        'down',
        SyntaxElementMorph.prototype.fontSize
    );
    this.arrow.mouseClickLeft = function () {myself.startIndexMenu(); };
    this.arrow.setRight(this.handle.right());
    this.arrow.setBottom(this.handle.top());
    this.handle.add(this.arrow);

    this.plusButton = new PushButtonMorph(
        this.dict,
        'add',
        '+'
    );
    this.plusButton.padding = 0;
    this.plusButton.edge = 0;
    this.plusButton.outlineColor = this.color;
    this.plusButton.drawNew();
    this.plusButton.fixLayout();

    ListWatcherMorph.uber.init.call(
        this,
        SyntaxElementMorph.prototype.rounding,
        1.000001, // shadow bug in Chrome,
        new Color(120, 120, 120)
    );

    this.color = new Color(220, 220, 220);
    this.isDraggable = false;
    this.setExtent(new Point(80, 70).multiplyBy(
        SyntaxElementMorph.prototype.scale
    ));
    this.add(this.label);
    this.add(this.frame);
    this.add(this.plusButton);
    this.add(this.handle);
    this.handle.drawNew();
    this.update();
    this.fixLayout();
    this.list = this.dict;
};

DictWatcherMorph.prototype.update = function (anyway) {
    this.dict = this.list;
    var i, idx, ceil, morphs, cell, cnts, label, button, max,
        starttime, maxtime = 1000;

    this.frame.contents.children.forEach(function (m) {
        if (m instanceof CellMorph) {
	    if (m.contentsMorph instanceof DictWatcherMorph) {
                m.contentsMorph.update();
	    } else if (isSnapObject(m.contents)) {
                m.update();
	    }
        }
    });

    if (this.lastUpdated === this.dict.lastChanged && !anyway) {
        return null;
    }

    this.updateLength(true);

    // adjust start index to current dict length
    this.start = Math.max(
        Math.min(
	    this.start,
	    Math.floor((this.dict.length() - 1) / this.range)
                * this.range + 1
        ),
        1
    );

    // refresh existing cells
    // highest index shown:
    max = Math.min(
        this.start + this.range - 1,
        this.dict.length()
    );

    // number of morphs available for refreshing
    ceil = Math.min(
        (max - this.start + 1) * 3,
        this.frame.contents.children.length
    );

    for (i = 0; i < ceil; i += 3) {
        idx = this.start + (i / 3);

        cell = this.frame.contents.children[i];
        label = this.frame.contents.children[i + 1];
        button = this.frame.contents.children[i + 2];
        cnts = this.dict.values()[idx];

        if (cell.contents !== cnts) {
	    cell.contents = cnts;
	    cell.drawNew();
	    if (this.lastCell) {
                cell.setLeft(this.lastCell.left());
	    }
        }
        this.lastCell = cell;

        if (label.text !== this.dict.keys()[idx]) {
	    label.text = this.dict.keys()[idx];
	    label.drawNew();
        }

        button.action = this.dict.keys()[idx];
    }

    // remove excess cells
    // number of morphs to be shown
    morphs = (max - this.start + 1) * 3;

    while (this.frame.contents.children.length > morphs) {
        this.frame.contents.children[morphs].destroy();
    }

    // add additional cells
    ceil = morphs; //max * 3;
    i = this.frame.contents.children.length;

    starttime = Date.now();
    if (ceil > i + 1) {
        for (i; i < ceil; i += 3) {
	    if (Date.now() - starttime > maxtime) {
                this.fixLayout();
                this.frame.contents.adjustBounds();
                this.frame.contents.setLeft(this.frame.left());
		this.list = this.dict;
                return null;
	    }
	    idx = this.start + (i / 3);
	    label = new StringMorph(
                dict.keys()[idx],
                SyntaxElementMorph.prototype.fontSize,
                null,
                false,
                false,
                false,
                MorphicPreferences.isFlat ? new Point() : new Point(1, 1),
                new Color(255, 255, 255)
	    );
	    cell = new CellMorph(
                this.dict.values()[idx],
                this.cellColor,
                idx,
                this.parentCell
	    );
	    button = new PushButtonMorph(
                this.dict.remove,
                this.dict.keys()[idx],
                '-',
                this.dict
	    );
	    button.padding = 1;
	    button.edge = 0;
	    button.corner = 1;
	    button.outlineColor = this.color.darker();
	    button.drawNew();
	    button.fixLayout();

	    this.frame.contents.add(cell);
	    if (this.lastCell) {
                cell.setPosition(this.lastCell.bottomLeft());
	    } else {
                cell.setTop(this.frame.contents.top());
	    }
	    this.lastCell = cell;
	    label.setCenter(cell.center());
	    label.setRight(cell.left() - 2);
	    this.frame.contents.add(label);
	    this.frame.contents.add(button);
        }
    }
    this.lastCell = null;

    this.fixLayout();
    this.frame.contents.adjustBounds();
    this.frame.contents.setLeft(this.frame.left());
    this.updateLength();
    this.lastUpdated = this.dict.lastChanged;
    this.list = this.dict;
};
DictWatcherMorph.prototype.updateLength = function (notDone) {
    this.label.text = localize('pairs: ') + this.list.length();
    if (notDone) {
        this.label.color = new Color(0, 0, 100);
    } else {
        this.label.color = new Color(0, 0, 0);
    }
    this.label.drawNew();
    this.label.setCenter(this.center());
    this.label.setBottom(this.bottom() - 3);
};
DictWatcherMorph.prototype.showTableView = function () {
    var view = this.parentThatIsAnyOf([
        SpriteBubbleMorph,
        SpeechBubbleMorph,
        CellMorph
    ]);
    if (!view) {return; }
    if (view instanceof SpriteBubbleMorph) {
        view.changed();
        view.drawNew(true);
    } else if (view instanceof SpeechBubbleMorph) {
        view.contents = new TableFrameMorph(new DictTableMorph(this.list, 10));
        view.contents.expand(this.extent());
        view.drawNew(true);
    } else { // watcher cell
        view.drawNew(true, 'table');
        view.contentsMorph.expand(this.extent());
    }
    view.fixLayout();
};

// DictTableMorph //////////////////////////////////////////////////////

/* 
   I am an object for drawing a dict of lists. 
   Dicts of dicts are displayed with dict watchers in dict watchers.
*/

// DictTableMorph inherits from TableMorph
DictTableMorph.prototype = new TableMorph();
DictTableMorph.prototype.constructor = DictTableMorph;
DictTableMorph.uber = TableMorph.prototype
function DictTableMorph(
    table,
    // optional parameters below this line
    scrollBarSize,
    extent,
    startRow,
    startCol,
    globalColWidth,
    colWidths,
    rowHeight,
    colLabelHeight,
    padding
) {
    this.init(
        table,
        scrollBarSize,
        extent,
        startRow,
        startCol,
        globalColWidth,
        colWidths,
        rowHeight,
        colLabelHeight,
        padding
    );
}
DictTableMorph.prototype.update = function () {
    var oldCols, oldRows,
        version = this.table instanceof Dict ?
        this.table.version(this.startRow, this.rows)
        : this.table.lastChanged;
    if (this.tableVersion === version && !this.wantsUpdate) {
        return;
    }
    this.wantsUpdate = false;
    if (this.table instanceof Dict) {
        oldCols = this.columns.length;
        oldRows = this.rows;
        this.rowLabelWidth = this.rowLabelsWidth();
        this.columns = this.columnsLayout();
        this.rows = this.visibleRows();
        if (this.columns.length !== oldCols || (this.rows !== oldRows)) {
	    this.buildCells();
        } else {
	    this.drawData();
        }
    } else { // Table
        this.drawData();
    }
    this.tableVersion = version;
};
DictTableMorph.prototype.userMenu = function () {
    var menu = new MenuMorph(this);
    if (this.parentThatIsA(TableDialogMorph)) {
        if (this.colWidths.length) {
	    menu.addItem('reset columns', 'resetColumns');
	    menu.addLine();
        }
        menu.addItem('open in another dialog...', 'openInDialog');
        return menu;
    }

    if (this.colWidths.length) {
        menu.addItem('reset columns', 'resetColumns');
    }
    menu.addItem('dict view...', 'showDictView');
    menu.addLine();
    menu.addItem('open in dialog...', 'openInDialog');
    return menu;
};
DictTableMorph.prototype.showDictView = function () {
    var view = this.parentThatIsAnyOf([
        SpriteBubbleMorph,
        SpeechBubbleMorph,
        CellMorph
    ]);
    if (!view) {return; }
    if (view instanceof SpriteBubbleMorph) {
        view.changed();
        view.drawNew(true);
    } else if (view instanceof SpeechBubbleMorph) {
        view.contents = new DictWatcherMorph(this.table);
        view.contents.step = view.contents.update;
        view.contents.expand(this.extent());
        view.drawNew(true);
    } else { // watcher cell
        view.drawNew(true);
        view.contentsMorph.expand(this.extent());
    }
    view.fixLayout();
};
DictTableMorph.prototype.openInDialog = function () {
    new DictTableDialogMorph(
        this.table,
        this.globalColWidth,
        this.colWidths,
        this.rowHeight
    ).popUp(this.world());
};

// DictTableDialogMorph inherits from TableDialogMorph:

DictTableDialogMorph.prototype = new TableDialogMorph();
DictTableDialogMorph.prototype.constructor = DictTableDialogMorph;
DictTableDialogMorph.uber = TableDialogMorph.prototype;
function DictTableDialogMorph(data, globalColWidth, colWidths, rowHeight) {
    this.init(data, globalColWidth, colWidths, rowHeight);
}
DictTableDialogMorph.prototype.buildContents = function (
    data,
    globalColWidth,
    colWidths,
    rowHeight
) {
    this.tableView = new DictTableMorph(
        data,
        null, // scrollBarSize
        null, // extent
        null, // startRow
        null, // startCol
        globalColWidth,
        colWidths,
        rowHeight,
        null, // colLabelHeight
        null // padding
    );
    this.addBody(new TableFrameMorph(this.tableView, true));
    this.addButton('ok', 'OK');
};
