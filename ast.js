var util = require('util');

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
 * @property {Statement[]} content
 */
function TagStatement(tagName) {
    this.tagName = typeof tagName !== 'undefined' ? tagName : 'div';
    this.classes = {};
    this.id = null;
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
 * @param {Statement} statement
 * @returns {TagStatement}
 */
TagStatement.prototype.addContent = function (statement) {
    this.content.push(statement);
    return this;
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
        return new Value(eval('return ' + value));
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
     * @returns {Value}
     */
    createNullLiteral: function () {
        return new Value(null);
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
     * @param {string} name
     * @param {ExpressionStatement} value
     * @returns {Attribute}
     */
    createAttribute: function (name, value) {
        return new Attribute(name, value);
    }
};
