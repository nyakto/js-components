var util = require('util');
var tokens = require('./tokens');

/**
 * @constructor
 */
function Statement() {
}

/**
 * @constructor
 * @extends Statement
 * @property {string} tagName
 * @property {Object.<string, (boolean|ExpressionStatement)>} classes className -> expression
 * @property {string} id
 * @property {Attribute[]} attributes
 * @property {Statement[]} content
 */
function TagStatement(tagName) {
    this.tagName = typeof tagName !== 'undefined' ? tagName : 'div';
    this.classes = {};
    this.id = null;
    this.attributes = [];
    this.content = [];
}
util.inherits(TagStatement, Statement);

/**
 * @param {string} tagName
 * @returns {TagStatement}
 */
TagStatement.prototype.setTagName = function (tagName) {
    this.tagName = tagName;
    return this;
};

/**
 * @param {string} className
 * @returns {TagStatement}
 */
TagStatement.prototype.addClass = function (className) {
    this.classes[className] = true;
    return this;
};

/**
 * @param {string} id
 * @returns {TagStatement}
 */
TagStatement.prototype.setId = function (id) {
    this.id = id;
    return this;
};

/**
 * @param {Attribute} attribute
 */
TagStatement.prototype.addAttribute = function (attribute) {
    this.attributes.push(attribute);
    return this;
};

/**
 * @param {Statement} statement
 * @returns {TagStatement}
 */
TagStatement.prototype.addContent = function (statement) {
    this.content.push(statement);
    return this;
};

/**
 * @class ConditionalContent
 * @property {ExpressionStatement} condition
 * @property {Statement[]} content
 */
/**
 * @constructor
 * @property {ConditionalContent[]} conditions
 * @property {Statement[]} elseContent
 */
function IfStatement() {
    this.conditions = [];
    this.elseContent = [];
}

/**
 * @param {ExpressionStatement} condition
 * @param {Statement[]} content
 */
IfStatement.prototype.addConditionalContent = function (condition, content) {
    this.conditions.push({
        condition: condition,
        content: content
    });
    return this;
};

/**
 * @param {Statement[]} content
 */
IfStatement.prototype.setElseContent = function (content) {
    this.elseContent = content;
};

/**
 * @constructor
 * @property {string} name
 * @property {ExpressionStatement} value
 * @param {string} name
 * @param {ExpressionStatement} value
 */
function Attribute(name, value) {
    this.name = typeof name !== 'undefined' ? String(name) : null;
    this.value = typeof value !== 'undefined' ? value : null;
}

/**
 * @constructor
 * @extends Operand
 * @property {string} name
 * @param {string} name
 */
function Identifier(name) {
    this.name = typeof name !== 'undefined' ? String(name) : null;
}

/**
 * @constructor
 * @extends Operand
 * @property {*} value
 * @param {*} value
 */
function Value(value) {
    this.value = value;
}

/**
 * @class Operand
 * @abstract
 */
/**
 * @class Operator
 * @extends Operand
 * @abstract
 * @property {number} type
 */

/**
 * @constructor
 * @extends Operator
 * @property {Operand} a
 * @param {number} type
 * @param {Operand} a
 */
function UnaryOperator(type, a) {
    this.type = type;
    this.a = a;
}

/**
 * @constructor
 * @extends Operator
 * @property {Operand} a
 * @property {Operand} b
 * @param {number} type
 * @param {Operand} a
 * @param {Operand} b
 */
function BinaryOperator(type, a, b) {
    this.type = type;
    this.a = a;
    this.b = b;
}

/**
 * @constructor
 * @extends Operator
 * @property {Operand} a
 * @property {Operand} b
 * @property {Operand} c
 * @param {number} type
 * @param {Operand} a
 * @param {Operand} b
 * @param {Operand} c
 */
function TernaryOperator(type, a, b, c) {
    this.type = type;
    this.a = a;
    this.b = b;
    this.c = c;
}

/**
 * @constructor
 * @extends Statement
 * @property {string} text
 * @param {string} [text='']
 */
function TextStatement(text) {
    this.text = typeof text !== 'undefined' ? String(text) : '';
}
util.inherits(TextStatement, Statement);

/**
 * @constructor
 * @extents Statement
 * @property {Operand} value
 * @param {Operand} [value=null]
 */
function ExpressionStatement(value) {
    this.value = typeof value !== 'undefined' ? value : null;
}
util.inherits(ExpressionStatement, Statement);

/**
 * @param {Operand} value
 * @returns {ExpressionStatement}
 */
ExpressionStatement.prototype.setValue = function (value) {
    this.value = value;
    return this;
};

/**
 * @constructor
 */
function ReversePolishNotation() {
    this._stack = [];
    this._result = [];
}

ReversePolishNotation.prototype.addValue = function (value) {
    this._result.push(value);
};

ReversePolishNotation.prototype.addOperator = function (token) {
    token.priority = tokens.getOperatorPriority(token.id);
    if (tokens.isRightAssociative(token.id)) {
        while (this._stack.length && this._stack[this._stack.length - 1].priority > token.priority) {
            this._result.push(this._stack.pop());
        }
    } else {
        while (this._stack.length && this._stack[this._stack.length - 1].priority >= token.priority) {
            this._result.push(this._stack.pop());
        }
    }
    this._stack.push(token);
};

/**
 * @returns {Operand}
 */
ReversePolishNotation.prototype.convert = function () {
    while (this._stack.length) {
        this._result.push(this._stack.pop());
    }
    var stack = [];
    this._result.forEach(function (value) {
        if (value.priority) {
            if (stack.length < 2) {
                throw new Error();
            }
            var b = stack.pop();
            var a = stack.pop();
            stack.push(new BinaryOperator(value.id, a, b));
        } else {
            stack.push(value);
        }
    });
    if (stack.length !== 1) {
        throw new Error();
    }
    this._result = stack;
    return stack[0];
};

module.exports = {
    /**
     * @param {string} [tagName='div']
     * @returns {TagStatement}
     */
    createTag: function (tagName) {
        return new TagStatement(tagName);
    },

    /**
     * @param {string} [text='']
     * @returns {TextStatement}
     */
    createText: function (text) {
        return new TextStatement(text);
    },

    /**
     * @returns {IfStatement}
     */
    createIf: function () {
        return new IfStatement();
    },

    /**
     * @param {string} name
     * @returns {Identifier}
     */
    createIdentifier: function (name) {
        return new Identifier(name);
    },

    /**
     * @param {string} value
     * @returns {Value}
     */
    createStringLiteral: function (value) {
        return new Value(eval(value));
    },

    /**
     * @param {string} value
     * @returns {Value}
     */
    createNumberLiteral: function (value) {
        return new Value(parseFloat(value));
    },

    /**
     * @param {string} value
     * @returns {Value}
     */
    createBooleanLiteral: function (value) {
        return new Value(value.toLowerCase() === 'true');
    },

    /**
     * @param {*} value
     * @returns {Value}
     */
    createValue: function (value) {
        return new Value(value);
    },

    /**
     * @param {number} type
     * @param {Operand} a
     * @returns {UnaryOperator}
     */
    createUnaryOperator: function (type, a) {
        return new UnaryOperator(type, a);
    },

    /**
     * @param {number} type
     * @param {Operand} a
     * @param {Operand} b
     * @returns {BinaryOperator}
     */
    createBinaryOperator: function (type, a, b) {
        return new BinaryOperator(type, a, b);
    },

    /**
     * @param {number} type
     * @param {Operand} a
     * @param {Operand} b
     * @param {Operand} c
     * @returns {TernaryOperator}
     */
    createTernaryOperator: function (type, a, b, c) {
        return new TernaryOperator(type, a, b, c);
    },

    /**
     * @param {Operand} [value=null]
     * @returns {ExpressionStatement}
     */
    createExpression: function (value) {
        return new ExpressionStatement(value);
    },

    /**
     * @returns {ReversePolishNotation}
     */
    createReversePolishNotation: function () {
        return new ReversePolishNotation();
    },

    /**
     * @param {string} name
     * @param {ExpressionStatement} value
     * @returns {Attribute}
     */
    createAttribute: function (name, value) {
        return new Attribute(name, value);
    }
};
