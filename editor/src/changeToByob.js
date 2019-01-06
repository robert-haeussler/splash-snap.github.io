modules.changeToByob = '2018-December-22';

InputSlotDialogMorph.prototype.init = function (
    fragment,
    target,
    action,
    environment,
    category
) {
    var scale = SyntaxElementMorph.prototype.scale,
        fh = fontHeight(10) / 1.2 * scale; // "raw height"

    // additional properties:
    this.fragment = fragment || new BlockLabelFragment();
    this.textfield = null;
    this.types = null;
    this.slots = null;
    this.isExpanded = false;
    this.category = category || 'other';
    this.cachedRadioButton = null; // "template" for radio button backgrounds
    this.noDelete = false;

    // initialize inherited properties:
    BlockDialogMorph.uber.init.call(
        this,
        target,
        action,
        environment
    );

    // override inherited properites:
    this.types = new AlignmentMorph('row', this.padding);
    this.types.respectHiddens = true; // prevent the arrow from flipping
    this.add(this.types);
    this.slots = new BoxMorph();
    this.slots.color = new Color(55, 55, 55); // same as palette
    this.slots.borderColor = this.slots.color.lighter(50);
    this.slots.setExtent(new Point((fh + 10) * 24, (fh + 10 * scale) * 11.4));
    this.add(this.slots);
    this.createSlotTypeButtons();
    this.fixSlotsLayout();
    this.addSlotsMenu();
    this.createTypeButtons();
    this.fixLayout();
};

InputSlotDialogMorph.prototype.createSlotTypeButtons = function () {
    // populate my 'slots' area with radio buttons, labels and input fields
    var myself = this, defLabel, defInput, defSwitch,
        oldFlag = Morph.prototype.trackChanges;

    Morph.prototype.trackChanges = false;

    // slot types
    this.addSlotTypeButton('Object', '%obj');
    this.addSlotTypeButton('Text', '%txt');
    this.addSlotTypeButton('List', '%l');
    this.addSlotTypeButton('Number', '%n');
    this.addSlotTypeButton('Any type', '%s');
    this.addSlotTypeButton('Boolean (T/F)', '%b');
    this.addSlotTypeButton('Command\n(inline)', '%cmdRing'); //'%cmd');
    this.addSlotTypeButton('Reporter', '%repRing'); //'%r');
    this.addSlotTypeButton('Predicate', '%predRing'); //'%p');
    this.addSlotTypeButton('Command\n(C-shape)', '%cs');
    this.addSlotTypeButton('Any\n(unevaluated)', '%anyUE');
    this.addSlotTypeButton('Boolean\n(unevaluated)', '%boolUE');

    // arity and upvars
    this.slots.radioButtonSingle = this.addSlotArityButton(
        function () {myself.setSlotArity('single'); },
        "Single input.",
        function () {return myself.fragment.isSingleInput(); }
    );
    this.addSlotArityButton(
        function () {myself.setSlotArity('multiple'); },
        "Multiple inputs (value is list of inputs)",
        function () {return myself.fragment.isMultipleInput(); }
    );
    this.addSlotArityButton(
        function () {myself.setSlotArity('dict'); },
        "Multiple inputs with keys (values is a dict)",
        function () {return myself.fragment.isDictInput(); }
    );
    this.addSlotArityButton(
        function () {myself.setSlotArity('upvar'); },
        "Upvar - make internal variable visible to caller",
        function () {return myself.fragment.isUpvar(); }
    );

    // default values
    defLabel = new StringMorph(localize('Default Value:'));
    defLabel.fontSize = this.slots.radioButtonSingle.fontSize;
    defLabel.setColor(new Color(255, 255, 255));
    defLabel.refresh = function () {
        if (myself.isExpanded && contains(
            ['%s', '%n', '%txt', '%anyUE', '%b', '%boolUE'],
            myself.fragment.type
        )) {
            defLabel.show();
        } else {
            defLabel.hide();
        }
    };
    this.slots.defaultInputLabel = defLabel;
    this.slots.add(defLabel);

    defInput = new InputFieldMorph(this.fragment.defaultValue);
    defInput.contents().fontSize = defLabel.fontSize;
    defInput.contrast = 90;
    defInput.contents().drawNew();
    defInput.setWidth(50);
    defInput.refresh = function () {
        if (myself.isExpanded && contains(
            ['%s', '%n', '%txt', '%anyUE'],
            myself.fragment.type
        )) {
            defInput.show();
            if (myself.fragment.type === '%n') {
                defInput.setIsNumeric(true);
            } else {
                defInput.setIsNumeric(false);
            }
        } else {
            defInput.hide();
        }
    };
    this.slots.defaultInputField = defInput;
    this.slots.add(defInput);
    defInput.drawNew();

    defSwitch = new BooleanSlotMorph(this.fragment.defaultValue);
    defSwitch.refresh = function () {
        if (myself.isExpanded && contains(
            ['%b', '%boolUE'],
            myself.fragment.type
        )) {
            defSwitch.show();
        } else {
            defSwitch.hide();
        }
    };
    this.slots.defaultSwitch = defSwitch;
    this.slots.add(defSwitch);
    defSwitch.drawNew();

    Morph.prototype.trackChanges = oldFlag;
};
InputSlotDialogMorph.prototype.setSlotArity = function (arity) {
    if (arity === 'single') {
        this.fragment.setToSingleInput();
    } else if (arity === 'multiple') {
        this.fragment.setToMultipleInput();
    } else if (arity === 'dict') {
	this.fragment.setToDictInput();
    } else if (arity === 'upvar') {
        this.fragment.setToUpvar();
        // hide other options - under construction
    }
    this.slots.children.forEach(function (c) {
        c.refresh();
    });
    this.edit();
};

BlockLabelFragment.prototype.isSingleInput = function () {
    return !this.isMultipleInput() && !this.isDictInput()
        (this.type !== '%upvar');
};
BlockLabelFragment.prototype.isDictInput = function () {
    // answer true if the type begins with '%pair'
    if (!this.type) {
        return false; // not an input at all
    }
    return this.type.indexOf('%pair') > -1;
};
BlockLabelFragment.prototype.setToDictInput = function () {
    if (!this.type) {return null; } // not an input at all
    if (this.type === '%upvar') {
        this.type = '%s';
    }
    this.type = '%pair'.concat(this.singleInputType());
};
BlockLabelFragment.prototype.singleInputType = function () {
    // answer the type of my input withtou any preceding '%mult'
    if (!this.type) {
        return null; // not an input at all
    }
    if (this.isMultipleInput() || this.isDictInput()) {
        return this.type.substr(5); // everything following '%mult' or '%pair'
    }
    return this.type;
};
BlockLabelFragment.prototype.setSingleInputType = function (type) {
    if (this.type) {
	if (this.isMultipleInput()) {
	    this.type = '%mult'.concat(type);
	} else if (this.isDictInput()) {
	    this.type = '%pair'.concat(type);
	} else {
            this.type = type;
	}
    }
};

WorldMorph.prototype.customMorphs = function () {
    return [
	new DictArgMorph(),
	new Dict(),
	new DictWatcherMorph(),
	new DictTableMorph(),
	new DictTableDialogMorph()
    ];
};
