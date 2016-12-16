/* global MessageInputSlotMorph, InputSlotMorph, TemplateSlotMorph, detect,
   SpriteMorph, StageMorph, ReporterBlockMorph, BlockInputFragmentMorph,
   BlockMorph, ScriptsMorph
   */
// MessageOutputSlotMorph //////////////////////////////////////////////
// I am a dropdown menu with an associated message type
// OutputSlotMorph inherits from ArgMorph:

MessageOutputSlotMorph.prototype = Object.create(MessageInputSlotMorph.prototype);
MessageOutputSlotMorph.prototype.constructor = MessageOutputSlotMorph;
MessageOutputSlotMorph.uber = MessageInputSlotMorph.prototype;

// MessageOutputSlotMorph preferences settings:

MessageOutputSlotMorph.prototype.executeOnSliderEdit = false;

// MessageOutputSlotMorph instance creation:

function MessageOutputSlotMorph() {
    MessageInputSlotMorph.call(this);
}

MessageOutputSlotMorph.prototype.evaluate = function() {
    return this._msgContent.map(function(c) {
        return c.evaluate();
    });
};

MessageOutputSlotMorph.prototype._updateFields = function(values) {
    // Remove the old message fields (parent's inputs)
    var input,
        removed = [],
        scripts = this.parentThatIsA(ScriptsMorph),
        i;

    // Remove the "i" fields after the current morph
    for (i = 0; i < this.parent.children.length; i++) {
        if (this.parent.children[i] instanceof ReadOnlyTemplateSlotMorph) {
            input = this.parent.children[i];
            removed.push(input);
            this.parent.removeChild(input);
            i--;
        }
    }

    if (scripts) {
        removed
            .filter(function(arg) {
                return arg instanceof BlockMorph;
            })
            .forEach(scripts.add.bind(scripts));
    }

    // Create new message fields
    this._msgContent = [];
    values = values || [];
    for (i = 0; i < this.msgFields.length; i++) {
        this._msgContent.push(this._updateField(this.msgFields[i], values[i]));
    }
    this.fixLayout();
    this.drawNew();
    this.parent.fixLayout();
    this.parent.changed();
};

MessageOutputSlotMorph.prototype.setContents = function(msgTypeName, inputs, messageType) {
    // Set the value for the dropdown
    InputSlotMorph.prototype.setContents.call(this, msgTypeName);

    // Create the message fields
    messageType = messageType || this._getMsgType();
    this.msgFields = messageType ? messageType.fields : [];
    if (this.parent) {
        this._updateFields(inputs);
    }
};

MessageOutputSlotMorph.prototype._updateField = function(field) {
    var result = new ReadOnlyTemplateSlotMorph(field);
    this.parent.add(result);
    //result.fixLayout();
    result.drawNew();
    return result;
};

// A template slot morph that overrides the ReporterBlockMorph's mouseClickLeft
ReadOnlyTemplateSlotMorph.prototype = new TemplateSlotMorph();
ReadOnlyTemplateSlotMorph.prototype.constructor = ReadOnlyTemplateSlotMorph;
ReadOnlyTemplateSlotMorph.uber = TemplateSlotMorph.prototype;

function ReadOnlyTemplateSlotMorph(name) {
    TemplateSlotMorph.call(this, name);
    // Override child ReporterBlockMorph's
    detect(
        this.children,
        function(child) {
            return child instanceof ReporterBlockMorph;
        }
    ).mouseClickLeft = readOnlyReporterClick;
}

var readOnlyReporterClick = function(pos) {
    if (this.parent instanceof BlockInputFragmentMorph) {
        return this.parent.mouseClickLeft();
    } else {
        return ReporterBlockMorph.uber.mouseClickLeft.call(this, pos);
    }
};

// SpriteMorph additions
SpriteMorph.prototype.allHatBlocksForSocket = function (message, role) {
    if (typeof message === 'number') {
        message = message.toString();
    }

    var event,
        r;  // receiver listened for by block
    return this.scripts.children.filter(function (morph) {
        if (morph.selector === 'receiveSocketEvent') {
            event = morph.inputs()[0].evaluate();
            r = morph.inputs()[1].evaluate();
            return (event === message || (event instanceof Array)) &&
                (r === role || (r instanceof Array));
        }
        if (morph.selector === 'receiveSocketMessage') {
            return message === morph.inputs()[0].contents().text;
        }
        return false;
    });
};

StageMorph.prototype.allHatBlocksForSocket = SpriteMorph.prototype.allHatBlocksForSocket;

