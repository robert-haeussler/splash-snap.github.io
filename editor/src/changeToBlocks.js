modules.changeToBlocks = '2018-December-22';

/*
  new input types:
  %pair%x  - x repersents any slot type except %pair or %mult
             expandable list with a minimum of 0 '%txt %x' sections
  %dct     - same as %pair%s but static
*/
SyntaxElementMorph.prototype.replaceInput = function (oldArg, newArg) {
    var scripts = this.parentThatIsA(ScriptsMorph),
        replacement = newArg,
        idx = this.children.indexOf(oldArg),
        i = 0;

    // try to find the ArgLabel embedding the newArg,
    // used for the undrop() feature
    if (idx === -1 && newArg instanceof MultiArgMorph) {
        this.children.forEach(function (morph) {
            if (morph instanceof ArgLabelMorph &&
                    morph.argMorph() === oldArg) {
                idx = i;
            }
            i += 1;
        });
    }

    if ((idx === -1) || (scripts === null)) {
        return null;
    }

    if (oldArg.cachedSlotSpec) {oldArg.cachedSlotSpec = null; }
    if (newArg.cachedSlotSpec) {newArg.cachedSlotSpec = null; }

    this.startLayout();
    if (newArg.parent) {
        newArg.parent.removeChild(newArg);
    }
    if (oldArg instanceof MultiArgMorph) {
        oldArg.inputs().forEach(function (inp) { // preserve nested reporters
            oldArg.replaceInput(inp, new InputSlotMorph());
        });
        if (this.dynamicInputLabels) {
	    if (oldArg instanceof DictArgMorph) {
		replacement = new ArgLabelMorph(newArg, "input dict: ");
	    } else {
		replacement = new ArgLabelMorph(newArg);
	    }
        }
    }
    replacement.parent = this;
    this.children[idx] = replacement;
    if (oldArg instanceof ReporterBlockMorph) {
        if (!(oldArg instanceof RingMorph)
                || (oldArg instanceof RingMorph && oldArg.contents())) {
            scripts.add(oldArg);
            oldArg.moveBy(replacement.extent());
            oldArg.fixBlockColor();
        }
    }
    if (replacement instanceof MultiArgMorph
            || replacement instanceof ArgLabelMorph
            || replacement.constructor === CommandSlotMorph) {
        replacement.fixLayout();
        if (this.fixLabelColor) { // special case for variadic continuations
            this.fixLabelColor();
        }
    } else {
        replacement.drawNew();
        this.fixLayout();
    }
    this.cachedInputs = null;
    this.endLayout();
};
SyntaxElementMorph.prototype.silentReplaceInput = function (oldArg, newArg) {
    // used by the Serializer or when programatically
    // changing blocks
    var i = this.children.indexOf(oldArg),
        replacement;

    if (i === -1) {
        return;
    }

    if (oldArg.cachedSlotSpec) {oldArg.cachedSlotSpec = null; }
    if (newArg.cachedSlotSpec) {newArg.cachedSlotSpec = null; }

    if (newArg.parent) {
        newArg.parent.removeChild(newArg);
    }
    if (oldArg instanceof MultiArgMorph && this.dynamicInputLabels) {
	if (oldArg instanceof DictArgMorph) {
	    replacement = new ArgLabelMorph(newArg, "input dict: ");
	} else {
            replacement = new ArgLabelMorph(newArg);
	}
    } else {
        replacement = newArg;
    }
    replacement.parent = this;
    this.children[i] = replacement;

    if (replacement instanceof MultiArgMorph
            || replacement instanceof ArgLabelMorph
            || replacement.constructor === CommandSlotMorph) {
        replacement.fixLayout();
        if (this.fixLabelColor) { // special case for variadic continuations
            this.fixLabelColor();
        }
    } else {
        replacement.drawNew();
        this.fixLayout();
    }
    this.cachedInputs = null;
};

SyntaxElementMorph.prototype.labelPart = function (spec) {
    var part, tokens;
    if (spec[0] === '%' &&
            spec.length > 1 &&
            (this.selector !== 'reportGetVar' ||
                (spec === '%turtleOutline' && this.isObjInputFragment()))) {

        // check for variable multi-arg-slot:
        if (spec.length > 5) {
	    var slice = spec.slice(0, 5);
	    if (slice === '%mult') {
		part = new MultiArgMorph(spec.slice(5));
		part.addInput();
		return part;
	    } else if (slice === '%pair') {
		part = new DictArgMorph(spec.slice(5));
		part.addInput();
		return part;
	    }
        }

        // single-arg and specialized multi-arg slots:
        switch (spec) {
        case '%imgsource':
            part = new InputSlotMorph(
                null, // text
                false, // non-numeric
                {
                    'pen trails': ['pen trails'],
                    'stage image': ['stage image']
                },
                true
            );
            part.setContents(['pen trails']);
            break;
        case '%inputs':
            part = new MultiArgMorph('%s', 'with inputs');
            part.isStatic = false;
            part.canBeEmpty = false;
            break;
        case '%scriptVars':
            part = new MultiArgMorph('%t', null, 1, spec);
            part.canBeEmpty = false;
            break;
        case '%blockVars':
            part = new MultiArgMorph('%t', 'block variables', 0, spec);
            part.canBeEmpty = false;
            break;
        case '%parms':
            part = new MultiArgMorph('%t', 'Input Names:', 0, spec);
            part.canBeEmpty = false;
            break;
        case '%ringparms':
            part = new MultiArgMorph(
                '%t',
                'input names:',
                0,
                spec
            );
            break;
        case '%cmdRing':
            part = new RingMorph();
            part.color = SpriteMorph.prototype.blockColor.other;
            part.selector = 'reifyScript';
            part.setSpec('%rc %ringparms');
            part.isDraggable = true;
            break;
        case '%repRing':
            part = new RingMorph();
            part.color = SpriteMorph.prototype.blockColor.other;
            part.selector = 'reifyReporter';
            part.setSpec('%rr %ringparms');
            part.isDraggable = true;
            part.isStatic = true;
            break;
        case '%predRing':
            part = new RingMorph(true);
            part.color = SpriteMorph.prototype.blockColor.other;
            part.selector = 'reifyPredicate';
            part.setSpec('%rp %ringparms');
            part.isDraggable = true;
            part.isStatic = true;
            break;
        case '%words':
            part = new MultiArgMorph('%s', null, 0);
            part.addInput(); // allow for default value setting
            part.addInput(); // allow for default value setting
            part.isStatic = false;
            break;
        case '%exp':
            part = new MultiArgMorph('%s', null, 0);
            part.addInput();
            part.isStatic = true;
            part.canBeEmpty = false;
            break;
	case '%dct':
	    part = new DictArgMorph('%s', null, 0);
            part.addInput();
            part.isStatic = true;
            part.canBeEmpty = false;
            break;
        case '%br':
            part = new Morph();
            part.setExtent(new Point(0, 0));
            part.isBlockLabelBreak = true;
            part.getSpec = function () {
                return '%br';
            };
            break;
        case '%inputName':
            part = new ReporterBlockMorph();
            part.category = 'variables';
            part.color = SpriteMorph.prototype.blockColor.variables;
            part.setSpec(localize('Input name'));
            break;
        case '%s':
            part = new InputSlotMorph();
            break;
        case '%anyUE':
            part = new InputSlotMorph();
            part.isUnevaluated = true;
            break;
        case '%txt':
            part = new InputSlotMorph(); // supports whitespace dots
            // part = new TextSlotMorph(); // multi-line, no whitespace dots
            part.minWidth = part.height() * 1.7; // "landscape"
            part.fixLayout();
            break;
        case '%mlt':
            part = new TextSlotMorph();
            part.fixLayout();
            break;
        case '%code':
            part = new TextSlotMorph();
            part.contents().fontName = 'monospace';
            part.contents().fontStyle = 'monospace';
            part.fixLayout();
            break;
        case '%obj':
            part = new ArgMorph('object');
            break;
        case '%n':
            part = new InputSlotMorph(null, true);
            break;
        case '%dir':
            part = new InputSlotMorph(
                null,
                true,
                {
                	'§_dir': null,
                    '(90) right' : 90,
                    '(-90) left' : -90,
                    '(0) up' : '0',
                    '(180) down' : 180,
                    'random' : ['random']
                }
            );
            part.setContents(90);
            break;
        case '%note':
            part = new InputSlotMorph(
                null, // test
                true, // numeric
                'pianoKeyboardMenu',
                false // read-only
            );
            break;
        case '%inst':
            part = new InputSlotMorph(
                null,
                true,
                {
                    '(1) sine' : 1,
                    '(2) square' : 2,
                    '(3) sawtooth' : 3,
                    '(4) triangle' : 4
                }
            );
            part.setContents(1);
            break;
        case '%month':
            part = new InputSlotMorph(
                null, // text
                false, // numeric?
                {
                    'January' : ['January'],
                    'February' : ['February'],
                    'March' : ['March'],
                    'April' : ['April'],
                    'May' : ['May'],
                    'June' : ['June'],
                    'July' : ['July'],
                    'August' : ['August'],
                    'September' : ['September'],
                    'October' : ['October'],
                    'November' : ['November'],
                    'December' : ['December']
                },
                true // read-only
            );
            break;
        case '%interaction':
            part = new InputSlotMorph(
                null, // text
                false, // numeric?
                {
                    'clicked' : ['clicked'],
                    'pressed' : ['pressed'],
                    'dropped' : ['dropped'],
                    'mouse-entered' : ['mouse-entered'],
                    'mouse-departed' : ['mouse-departed'],
                    'scrolled-up' : ['scrolled-up'],
                    'scrolled-down' : ['scrolled-down'],
                    'stopped' : ['stopped'] // experimental
                },
                true // read-only
            );
            part.isStatic = true;
            break;
        case '%dates':
            part = new InputSlotMorph(
                null, // text
                false, // non-numeric
                {
                    'year' : ['year'],
                    'month' : ['month'],
                    'date' : ['date'],
                    'day of week' : ['day of week'],
                    'hour' : ['hour'],
                    'minute' : ['minute'],
                    'second' : ['second'],
                    'time in milliseconds' : ['time in milliseconds']
                },
                true // read-only
            );
            part.setContents(['date']);
            break;
        case '%delim':
            part = new InputSlotMorph(
                null, // text
                false, // numeric?
                {
                    'letter' : ['letter'],
                    'whitespace' : ['whitespace'],
                    'line' : ['line'],
                    'tab' : ['tab'],
                    'cr' : ['cr'],
                    'csv' : ['csv']
                    /*
                    'csv records' : ['csv records'],
                    'csv fields' : ['csv fields']
                    */
                },
                false // read-only
            );
            break;
        case '%ida':
            part = new InputSlotMorph(
                null,
                true,
                {
                    '1' : 1,
                    last : ['last'],
                    '~' : null,
                    all : ['all']
                }
            );
            part.setContents(1);
            break;
        case '%idx':
            part = new InputSlotMorph(
                null,
                true,
                {
                    '1' : 1,
                    last : ['last'],
                    any : ['any']
                }
            );
            part.setContents(1);
            break;
        case '%rel':
            part = new InputSlotMorph(
                null, // text
                false, // numeric?
                {
                    'distance' : ['distance'],
                    'direction' : ['direction']
                },
                true // read-only
            );
            break;
        case '%spr':
            part = new InputSlotMorph(
                null,
                false,
                'objectsMenu',
                true
            );
            break;
        case '%col': // collision detection
            part = new InputSlotMorph(
                null,
                false,
                'collidablesMenu',
                true
            );
            break;
        case '%dst': // distance measuring
            part = new InputSlotMorph(
                null,
                false,
                'distancesMenu',
                true
            );
            break;
        case '%cln': // clones
            part = new InputSlotMorph(
                null,
                false,
                'clonablesMenu',
                true
            );
            break;
        case '%get': // sprites, parts, speciment, clones
            part = new InputSlotMorph(
                null,
                false,
                'gettablesMenu',
                true
            );
            part.isStatic = true;
            break;
        case '%cst':
            part = new InputSlotMorph(
                null,
                false,
                'costumesMenu',
                true
            );
            break;
        case '%eff':
            part = new InputSlotMorph(
                null,
                false,
                {
                    color: ['color'],
                    fisheye: ['fisheye'],
                    whirl: ['whirl'],
                    pixelate: ['pixelate'],
                    mosaic: ['mosaic'],
                    duplicate: ['duplicate'],
                    negative : ['negative'],
                    comic: ['comic'],
                    confetti: ['confetti'],
                    saturation: ['saturation'],
                    brightness : ['brightness'],
                    ghost: ['ghost']
                },
                true
            );
            part.setContents(['ghost']);
            break;
        case '%snd':
            part = new InputSlotMorph(
                null,
                false,
                'soundsMenu',
                true
            );
            break;
        case '%key':
            part = new InputSlotMorph(
                null,
                false,
                {
                    'any key' : ['any key'],
                    'up arrow': ['up arrow'],
                    'down arrow': ['down arrow'],
                    'right arrow': ['right arrow'],
                    'left arrow': ['left arrow'],
                    space : ['space'],
                    a : ['a'],
                    b : ['b'],
                    c : ['c'],
                    d : ['d'],
                    e : ['e'],
                    f : ['f'],
                    g : ['g'],
                    h : ['h'],
                    i : ['i'],
                    j : ['j'],
                    k : ['k'],
                    l : ['l'],
                    m : ['m'],
                    n : ['n'],
                    o : ['o'],
                    p : ['p'],
                    q : ['q'],
                    r : ['r'],
                    s : ['s'],
                    t : ['t'],
                    u : ['u'],
                    v : ['v'],
                    w : ['w'],
                    x : ['x'],
                    y : ['y'],
                    z : ['z'],
                    '0' : ['0'],
                    '1' : ['1'],
                    '2' : ['2'],
                    '3' : ['3'],
                    '4' : ['4'],
                    '5' : ['5'],
                    '6' : ['6'],
                    '7' : ['7'],
                    '8' : ['8'],
                    '9' : ['9']
                },
                true
            );
            part.setContents(['space']);
            break;
        case '%keyHat':
            part = this.labelPart('%key');
            part.isStatic = true;
            break;
        case '%msg':
            part = new InputSlotMorph(
                null,
                false,
                'messagesMenu',
                true
            );
            break;
        case '%msgHat':
            part = new InputSlotMorph(
                null,
                false,
                'messagesReceivedMenu',
                true
            );
            part.isStatic = true;
            break;
        case '%att':
            part = new InputSlotMorph(
                null,
                false,
                'attributesMenu',
                true
            );
            break;
        case '%fun':
            part = new InputSlotMorph(
                null,
                false,
                {
                    abs : ['abs'],
                    ceiling : ['ceiling'],
                    floor : ['floor'],
                    sqrt : ['sqrt'],
                    sin : ['sin'],
                    cos : ['cos'],
                    tan : ['tan'],
                    asin : ['asin'],
                    acos : ['acos'],
                    atan : ['atan'],
                    ln : ['ln'],
                    log : ['log'],
                    'e^' : ['e^'],
                    '10^' : ['10^']
                },
                true
            );
            part.setContents(['sqrt']);
            break;
        case '%txtfun':
            part = new InputSlotMorph(
                null,
                false,
                {
                    'encode URI' : ['encode URI'],
                    'decode URI' : ['decode URI'],
                    'encode URI component' : ['encode URI component'],
                    'decode URI component' : ['decode URI component'],
                    'XML escape' : ['XML escape'],
                    'XML unescape' : ['XML unescape'],
                    'hex sha512 hash' : ['hex sha512 hash']
                },
                true
            );
            part.setContents(['encode URI']);
            break;
        case '%stopChoices':
            part = new InputSlotMorph(
                null,
                false,
                {
                    'all' : ['all'],
                    'this script' : ['this script'],
                    'this block' : ['this block'],
                    'all but this script' : ['all but this script'],
                    'other scripts in sprite' : ['other scripts in sprite']
                },
                true
            );
            part.setContents(['all']);
            part.isStatic = true;
            break;
        case '%typ':
            part = new InputSlotMorph(
                null,
                false,
                'typesMenu',
                true
            );
            part.setContents(['number']);
            break;
        case '%mapValue':
            part = new InputSlotMorph(
                null,
                false,
                {
                    String : ['String'],
                    Number : ['Number'],
                    'true' : ['true'],
                    'false' : ['false']
                },
                true
            );
            part.setContents(['String']);
            part.isStatic = true;
            break;
        case '%var':
            part = new InputSlotMorph(
                null,
                false,
                'getVarNamesDict',
                true
            );
            part.isStatic = true;
            break;
        case '%shd':
            part = new InputSlotMorph(
                null,
                false,
                'shadowedVariablesMenu',
                true
            );
            // part.isStatic = true;
            break;
        case '%lst':
            part = new InputSlotMorph(
                null,
                false,
                {
                    list1 : 'list1',
                    list2 : 'list2',
                    list3 : 'list3'
                },
                true
            );
            break;
        case '%codeKind':
            part = new InputSlotMorph(
                null,
                false,
                {
                    code : ['code'],
                    header : ['header']
                },
                true
            );
            part.setContents(['code']);
            break;
        case '%l':
            part = new ArgMorph('list');
            break;
        case '%b':
            part = new BooleanSlotMorph();
            break;
        case '%boolUE':
            part = new BooleanSlotMorph();
            part.isUnevaluated = true;
            break;
        case '%bool':
            part = new BooleanSlotMorph(true);
            part.isStatic = true;
            break;
        case '%cmd':
            part = new CommandSlotMorph();
            break;
        case '%rc':
            part = new RingCommandSlotMorph();
            part.isStatic = true;
            break;
        case '%rr':
            part = new RingReporterSlotMorph();
            part.isStatic = true;
            break;
        case '%rp':
            part = new RingReporterSlotMorph(true);
            part.isStatic = true;
            break;
        case '%c':
            part = new CSlotMorph();
            part.isStatic = true;
            break;
        case '%cs':
            part = new CSlotMorph(); // non-static
            break;
        case '%cl':
            part = new CSlotMorph();
            part.isStatic = true; // rejects reporter drops
            part.isLambda = true; // auto-reifies nested script
            break;
        case '%clr':
            part = new ColorSlotMorph();
            part.isStatic = true;
            break;
        case '%t':
            part = new TemplateSlotMorph('a');
            break;
        case '%upvar':
            part = new TemplateSlotMorph('\u2191'); // up-arrow
            break;
        case '%f':
            part = new FunctionSlotMorph();
            break;
        case '%r':
            part = new ReporterSlotMorph();
            break;
        case '%p':
            part = new ReporterSlotMorph(true);
            break;

    // code mapping (experimental)

        case '%codeListPart':
            part = new InputSlotMorph(
                null, // text
                false, // numeric?
                {
                    'list' : ['list'],
                    'item' : ['item'],
                    'delimiter' : ['delimiter']
                },
                true // read-only
            );
            break;
        case '%codeListKind':
            part = new InputSlotMorph(
                null, // text
                false, // numeric?
                {
                    'collection' : ['collection'],
                    'variables' : ['variables'],
                    'parameters' : ['parameters']
                },
                true // read-only
            );
            break;

    // symbols:

        case '%turtle':
            part = new SymbolMorph('turtle');
            part.size = this.fontSize * 1.2;
            part.color = new Color(255, 255, 255);
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                    new Point() : this.embossing;
            part.drawNew();
            break;
        case '%turtleOutline':
            part = new SymbolMorph('turtleOutline');
            part.size = this.fontSize;
            part.color = new Color(255, 255, 255);
            part.isProtectedLabel = true; // doesn't participate in zebraing
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                    new Point() : this.embossing;
            part.drawNew();
            break;
        case '%clockwise':
            part = new SymbolMorph('turnRight');
            part.size = this.fontSize * 1.5;
            part.color = new Color(255, 255, 255);
            part.isProtectedLabel = false; // zebra colors
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                    new Point() : this.embossing;
            part.drawNew();
            break;
        case '%counterclockwise':
            part = new SymbolMorph('turnLeft');
            part.size = this.fontSize * 1.5;
            part.color = new Color(255, 255, 255);
            part.isProtectedLabel = false; // zebra colors
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                    new Point() : this.embossing;
            part.drawNew();
            break;
        case '%greenflag':
            part = new SymbolMorph('flag');
            part.size = this.fontSize * 1.5;
            part.color = new Color(0, 200, 0);
            part.isProtectedLabel = true; // doesn't participate in zebraing
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                    new Point() : this.embossing;
            part.drawNew();
            break;
        case '%stop':
            part = new SymbolMorph('octagon');
            part.size = this.fontSize * 1.5;
            part.color = new Color(200, 0, 0);
            part.isProtectedLabel = true; // doesn't participate in zebraing
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                    new Point() : this.embossing;
            part.drawNew();
            break;
        case '%pause':
            part = new SymbolMorph('pause');
            part.size = this.fontSize;
            part.color = new Color(255, 220, 0);
            part.isProtectedLabel = true; // doesn't participate in zebraing
            part.shadowColor = this.color.darker(this.labelContrast);
            part.shadowOffset = MorphicPreferences.isFlat ?
                    new Point() : this.embossing;
            part.drawNew();
            break;
        default:
            nop();
        }
    } else if (spec[0] === '$' &&
            spec.length > 1 &&
            this.selector !== 'reportGetVar') {
/*
        // allow costumes as label symbols
        // has issues when loading costumes (asynchronously)
        // commented out for now

        var rcvr = this.definition.receiver || this.scriptTarget(),
            id = spec.slice(1),
            cst;
        if (!rcvr) {return this.labelPart('%stop'); }
        cst = detect(
            rcvr.costumes.asArray(),
            function (each) {return each.name === id; }
        );
        part = new SymbolMorph(cst);
        part.size = this.fontSize * 1.5;
        part.color = new Color(255, 255, 255);
        part.isProtectedLabel = true; // doesn't participate in zebraing
        part.drawNew();
*/

        // allow GUI symbols as label icons
        // usage: $symbolName[-size-r-g-b], size and color values are optional
        // If there isn't a symbol under that name, it just styles whatever is
        // after "$", so you can add unicode icons to your blocks, for example
        // ☺️
        tokens = spec.slice(1).split('-');
        if (!contains(SymbolMorph.prototype.names, tokens[0])) {
            part = new StringMorph(tokens[0]);
            part.fontName = this.labelFontName;
            part.fontStyle = this.labelFontStyle;
            part.fontSize = this.fontSize * (+tokens[1] || 1);
        } else {
            part = new SymbolMorph(tokens[0]);
            part.size = this.fontSize * (+tokens[1] || 1.2);
        }
        part.color = new Color(
            +tokens[2] === 0 ? 0 : +tokens[2] || 255,
            +tokens[3] === 0 ? 0 : +tokens[3] || 255,
            +tokens[4] === 0 ? 0 : +tokens[4] || 255
        );
        part.isProtectedLabel = tokens.length > 2; // zebra colors
        part.shadowColor = this.color.darker(this.labelContrast);
        part.shadowOffset = MorphicPreferences.isFlat ?
                new Point() : this.embossing;
        part.drawNew();
    } else {
        part = new StringMorph(
            spec, // text
            this.fontSize, // fontSize
            this.labelFontStyle, // fontStyle
            true, // bold
            false, // italic
            false, // isNumeric
            MorphicPreferences.isFlat ?
                    new Point() : this.embossing, // shadowOffset
            this.color.darker(this.labelContrast), // shadowColor
            new Color(255, 255, 255), // color
            this.labelFontName // fontName
        );
    }
    return part;
};


DictArgMorph.prototype = new MultiArgMorph();
DictArgMorph.prototype.constructer = DictArgMorph;
DictArgMorph.uber = MultiArgMorph.prototype;

function DictArgMorph(
    slotSpec,
    labelTxt,
    min,
    eSpec,
    arrowColor,
    labelColor,
    shadowColor,
    shadowOffset,
    isTransparent
) {
    this.init(
        slotSpec,
        labelTxt,
        min,
        eSpec,
        arrowColor,
        labelColor,
        shadowColor,
        shadowOffset,
        isTransparent
    );
}
DictArgMorph.prototype.addInput = function(key, value) {
    var newPart = this.labelPart('%txt'); // the key slot
    if (value) {
        newPart.setContents(key);
    }
    newPart.parent = this;
    this.children.splice(this.children.length-1, 0, newPart);
    newPart.drawNew();
    DictArgMorph.uber.addInput.call(this, value); // the value
};
DictArgMorph.prototype.removeInput = function() {
    DictArgMorph.uber.removeInput.call(this);
    DictArgMorph.uber.removeInput.call(this);
};

InputSlotMorph.prototype.typesMenu = function () {
    var dict = {
        number : ['number'],
        text : ['text'],
        Boolean : ['Boolean'],
        list : ['list']
    };
    if (SpriteMorph.prototype.enableFirstClass) {
        dict.sprite = ['sprite'];
    }
    dict.costume = ['costume'];
    dict.sound = ['sound'];
    dict.command = ['command'];
    dict.reporter = ['reporter'];
    dict.predicate = ['predicate'];
    dict.dict = ['dict'];
    return dict;
};

ReporterBlockMorph.prototype.drawNew = function () {
    var context;
    this.cachedClr = this.color.toString();
    this.cachedClrBright = this.bright();
    this.cachedClrDark = this.dark();
    this.image = newCanvas(this.extent());
    context = this.image.getContext('2d');
    context.fillStyle = this.cachedClr;

    if (this.isPredicate) {
        this.drawDiamond(context);
    } else {
        this.drawRounded(context);
    }

    // draw location pin icon if applicable
    if (this.hasLocationPin()) {
        this.drawMethodIcon(context);
    } else if (this.isCookieVar) {
	this.drawCookieIcon(context);
    }

    // erase CommandSlots
    this.eraseHoles(context);
};

ReporterBlockMorph.prototype.drawCookieIcon = function (context) {
    var ext = this.methodIconExtent(),
        w = ext.x,
        h = ext.y,
        r = w / 2,
        x = this.edge + this.labelPadding,
        y = this.edge,
        isNormal =
            this.color === SpriteMorph.prototype.blockColor[this.category];

    if (this.isPredicate) {//should be false, this is for variables
        x = this.rounding;
    }
    if (this instanceof CommandBlockMorph) {
        y += this.corner;
    }
    context.fillStyle = '#D5944B';
    context.strokeStyle = '#000000';
    context.beginPath();
    context.arc(x + r, y + (r + h)/2, r * 2,
		radians(-90), radians(180));
    context.arc(x + r*3/2, y + (r + h)/2, r/2, radians(0), radians(90));
    context.arc(x + r, y + r + h/2, r/2, radians(0), radians(90));
    context.closePath();
    context.fill();
    context.stroke();
    
/*
    // pin
    context.beginPath();
    context.arc(x + r, y + r, r, radians(-210), radians(30), false);
    context.lineTo(x + r, y + h);
    context.closePath();
    context.fill();

    // hole
    context.fillStyle = this.cachedClr;
    context.beginPath();
    context.arc(x + r, y + r, r * 0.4, radians(0), radians(360), false);
    context.closePath();
    context.fill();
*/
};
