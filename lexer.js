var tokens = require('./tokens');
var util = require('util');

/**
 * @param {string} text
 * @constructor
 */
function Lexer(text) {
    this._mode = Lexer.DEFAULT_MODE;
    this._re = defaultModeRE;
    this._tokenTypes = defaultModeTokenTypes;
    this._text = String(text);
    this._pos = 0;
    this._startLine = true;
    this._indent = '';
    this._indentHistory = [];
    this._line = 1;
    this._ready = [];
    this._state = [];
}

Lexer.DEFAULT_MODE = 1;
Lexer.EXPECT_TEXT_MODE = 2;
Lexer.TEXT_MODE = 3;
Lexer.EXPR_MODE = 4;

function BasicLexerError(text, pos, line, message) {
    this.getInputText = function () {
        return text;
    };

    this.getLine = function () {
        return line;
    };

    this.getPosition = function () {
        return pos;
    };

    this.message = message;
}

Lexer.LexerError = function (text, pos, line) {
    BasicLexerError.call(this, text, pos, line, [
        'lexer error at line ',
        line,
        ' near ',
        JSON.stringify(
            String(text).substr(Math.max(pos - 10, 0), 20)
        )
    ].join(''));
};
util.inherits(Lexer.LexerError, Error);
Lexer.LexerError.prototype.name = 'LexerError';

Lexer.WrongIndentError = function (text, pos, line, expectedIndent, actualIndent) {
    BasicLexerError.call(this, text, pos, line, [
        'wrong indent at line ',
        line,
        ': expected=',
        JSON.stringify(expectedIndent),
        ', actual=',
        JSON.stringify(actualIndent)
    ].join(''));
};
util.inherits(Lexer.WrongIndentError, Lexer.LexerError);
Lexer.LexerError.prototype.name = 'WrongIndentError';

var defaultModeRE = /([ \t]*\r?\n|\r)|([ \t]+)|([a-z0-9]+(?:[:_-]*[a-z0-9]+)*)|(\.)|(#)|(@)|(\|)|(=)/gi;
var defaultModeTokenTypes = [
    tokens.LF,
    tokens.WHITESPACE,
    tokens.WORD,
    tokens.CLASS_START,
    tokens.ID_START,
    tokens.ATTR_START,
    tokens.TEXT_START,
    tokens.EXPR_START
];

var expectTextModeRE = /(\|)|([^\r\n]*)/gi;
var expectTextModeTokenTypes = [
    tokens.TEXT_START,
    tokens.TEXT
];

var textModeRE = /([^\r\n]*)/gi;
var textModeTokenTypes = [
    tokens.TEXT
];

var exprModeRE = /([ \t]+)|([ \t]*\r?\n|\r)|("(?:\\[^\r\n]|[^"])*"|'(?:\\[^\r\n]|[^'])*')|(null)|(true|false)|([$a-zA-Z_][$a-zA-Z0-9_]*)|(\d+)|(\()|(\))|(\[)|(])|(\.)|(,)|(==)|(!=)|(=)|(\+=)|(-=)|(\*=)|(\/=)|(%=)|(<<=)|(>>>=)|(>>=)|(&=)|(\|=)|(\^=)|(\+\+)|(--)|(\+)|(-)|(\*)|(\/)|(%)|(<<)|(>>>)|(>>)|(&&)|(\|\|)|(&)|(\|)|(\^)|(!)|(\?)|(:)|(<=)|(>=)|(<)|(>)/g;
var exprModeTokenTypes = [
    tokens.WHITESPACE,
    tokens.LF,
    tokens.STRING_LITERAL,
    tokens.NULL_LITERAL,
    tokens.BOOLEAN_LITERAL,
    tokens.IDENTIFIER,
    tokens.NUMBER_LITERAL,
    tokens.OP_LP,
    tokens.OP_RP,
    tokens.OP_LB,
    tokens.OP_RB,
    tokens.OP_DOT,
    tokens.OP_COMMA,
    tokens.OP_EQUALS,
    tokens.OP_NOT_EQUALS,
    tokens.OP_ASSIGN,
    tokens.OP_ADD_ASSIGN,
    tokens.OP_SUB_ASSIGN,
    tokens.OP_MUL_ASSIGN,
    tokens.OP_DIV_ASSIGN,
    tokens.OP_EXCESS_ASSIGN,
    tokens.OP_LSHIFT_ASSIGN,
    tokens.OP_UNSIGNED_RSHIFT_ASSIGN,
    tokens.OP_RSHIFT_ASSIGN,
    tokens.OP_BINARY_AND_ASSIGN,
    tokens.OP_BINARY_OR_ASSIGN,
    tokens.OP_XOR_ASSIGN,
    tokens.OP_INC,
    tokens.OP_DEC,
    tokens.OP_ADD,
    tokens.OP_SUB,
    tokens.OP_MUL,
    tokens.OP_DIV,
    tokens.OP_EXCESS,
    tokens.OP_LSHIFT,
    tokens.OP_UNSIGNED_RSHIFT,
    tokens.OP_RSHIFT,
    tokens.OP_LOGICAL_AND,
    tokens.OP_LOGICAL_OR,
    tokens.OP_BINARY_AND,
    tokens.OP_BINARY_OR,
    tokens.OP_XOR,
    tokens.OP_NOT,
    tokens.OP_TERNARY_IF,
    tokens.OP_TERNARY_ELSE,
    tokens.OP_LTE,
    tokens.OP_GTE,
    tokens.OP_LT,
    tokens.OP_GT
];

/**
 * @class Token
 * @property {number} id
 * @property {string} text
 */
/**
 *
 * @returns {Token}
 */
Lexer.prototype.next = function () {
    if (this._ready.length > 0) {
        return this._ready.pop();
    }
    if (this.eof()) {
        return processIndents.call(this, {
            id: tokens.EOF
        });
    }
    var token = processIndents.call(this, getToken.call(this));
    if (this._mode === Lexer.EXPR_MODE) {
        if (token.id === tokens.WHITESPACE) {
            token = this.next();
        }
    }
    return token;
};

Lexer.prototype.pushState = function () {
    this._state.push({
        mode: this._mode,
        re: this._re,
        tokenTypes: this._tokenTypes,
        pos: this._pos,
        startLine: this._startLine,
        indent: this._indent,
        indentHistory: JSON.parse(JSON.stringify(this._indentHistory)),
        line: this._line,
        ready: JSON.parse(JSON.stringify(this._ready))
    });
};

Lexer.prototype.popState = function () {
    var state = this._state.pop();
    this._mode = state.mode;
    this._re = state.re;
    this._tokenTypes = state.tokenTypes;
    this._pos = state.pos;
    this._startLine = state.startLine;
    this._indent = state.indent;
    this._indentHistory = state.indentHistory;
    this._line = state.line;
    this._ready = state.ready;
};

/**
 * @returns {Token}
 */
Lexer.prototype.peek = function () {
    var token = this.next();
    this._ready.push(token);
    return token;
};

Lexer.prototype.setMode = function (mode) {
    this._mode = mode;
    switch (mode) {
        case Lexer.DEFAULT_MODE:
            this._re = defaultModeRE;
            this._tokenTypes = defaultModeTokenTypes;
            break;
        case Lexer.EXPECT_TEXT_MODE:
            this._re = expectTextModeRE;
            this._tokenTypes = expectTextModeTokenTypes;
            break;
        case Lexer.TEXT_MODE:
            this._re = textModeRE;
            this._tokenTypes = textModeTokenTypes;
            break;
        case Lexer.EXPR_MODE:
            this._re = exprModeRE;
            this._tokenTypes = exprModeTokenTypes;
            break;
    }
};

Lexer.prototype.eof = function () {
    return this._pos >= this._text.length;
};

function processIndents(token) {
    if (token.id === tokens.LF) {
        this._startLine = true;
        this._line++;
    } else if (token.id === tokens.EOF) {
        return pushUnindents.call(this, token);
    } else if (this._startLine) {
        this._startLine = false;
        if (token.id === tokens.WHITESPACE) {
            var len = Math.min(token.text.length, this._indent.length);
            if (token.text.substr(0, len) !== this._indent.substr(0, len)) {
                throw new Lexer.WrongIndentError(
                    this._text,
                    this._pos - token.text.length,
                    this._line,
                    this._indent,
                    token.text
                );
            }
            if (this._indent.length > token.text.length) {
                while (this._indentHistory.length > 0) {
                    this._indent = this._indentHistory.pop();
                    if (this._indent.length <= token.text.length) {
                        break;
                    }
                }
                if (this._indent !== token.text) {
                    throw new Lexer.WrongIndentError(
                        this._text,
                        this._pos - token.text.length,
                        this._line,
                        this._indent,
                        token.text
                    );
                }
                return {
                    id: tokens.UNINDENT
                };
            } else if (this._indent.length < token.text.length) {
                this._indentHistory.push(this._indent);
                this._indent = token.text;
                return {
                    id: tokens.INDENT
                };
            } else if (this._indent === token.text) {
                this._startLine = false;
                return getToken.call(this);
            }
        } else {
            return pushUnindents.call(this, token);
        }
    }
    return token;
}

function pushUnindents(token) {
    if (this._indentHistory.length > 0) {
        this._indent = '';
        this._ready.push(token);
        do {
            this._indentHistory.pop();
            this._ready.push({
                id: tokens.UNINDENT
            });
        } while (this._indentHistory.length > 0);
        return this._ready.pop();
    }
    return token;
}

function getToken() {
    this._re.lastIndex = this._pos;
    var match = this._re.exec(this._text);
    if (match !== null && match.index === this._pos) {
        this._pos = this._re.lastIndex;
        for (var i = 1; i < match.length; ++i) {
            var text = match[i];
            if (text !== undefined) {
                return {
                    id: this._tokenTypes[i - 1],
                    text: text
                };
            }
        }
    }
    throw new Lexer.LexerError(this._text, this._pos);
}

module.exports = Lexer;
