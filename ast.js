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
 */
function ExpressionStatement() {
}
util.inherits(ExpressionStatement, Statement);

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
     * @returns {ExpressionStatement}
     */
    createExpression: function () {
        return new ExpressionStatement();
    }
};
