var idCounter = 1000;
var names = {};
var priority = {};
var rightAssoc = {};
var binary = {};
var tokens = {
    LF: idCounter++,
    EOF: idCounter++,
    WHITESPACE: idCounter++,
    INDENT: idCounter++,
    UNINDENT: idCounter++,
    WORD: idCounter++,
    TEXT_START: idCounter++,
    EXPR_START: idCounter++,
    TEXT: idCounter++,
    CLASS_START: idCounter++,
    ID_START: idCounter++,
    ATTR_START: idCounter++,
    IDENTIFIER: idCounter++,
    NULL_LITERAL: idCounter++,
    BOOLEAN_LITERAL: idCounter++,
    STRING_LITERAL: idCounter++,
    NUMBER_LITERAL: idCounter++,
    OP_LP: idCounter++,
    OP_RP: idCounter++,
    OP_LB: idCounter++,
    OP_RB: idCounter++,
    OP_DOT: idCounter++,
    OP_COMMA: idCounter++,
    OP_LT: idCounter++,
    OP_GT: idCounter++,
    OP_LTE: idCounter++,
    OP_GTE: idCounter++,
    OP_EQUALS: idCounter++,
    OP_NOT_EQUALS: idCounter++,
    OP_ADD: idCounter++,
    OP_SUB: idCounter++,
    OP_MUL: idCounter++,
    OP_DIV: idCounter++,
    OP_EXCESS: idCounter++,
    OP_INC: idCounter++,
    OP_DEC: idCounter++,
    OP_INC_AND_GET: idCounter++,
    OP_DEC_AND_GET: idCounter++,
    OP_GET_AND_INC: idCounter++,
    OP_GET_AND_DEC: idCounter++,
    OP_LSHIFT: idCounter++,
    OP_RSHIFT: idCounter++,
    OP_UNSIGNED_RSHIFT: idCounter++,
    OP_BINARY_AND: idCounter++,
    OP_BINARY_OR: idCounter++,
    OP_XOR: idCounter++,
    OP_NOT: idCounter++,
    OP_UNARY_PLUS: idCounter++,
    OP_UNARY_MINUS: idCounter++,
    OP_LOGICAL_AND: idCounter++,
    OP_LOGICAL_OR: idCounter++,
    OP_TERNARY_IF: idCounter++,
    OP_TERNARY_ELSE: idCounter++,
    OP_ASSIGN: idCounter++,
    OP_ADD_ASSIGN: idCounter++,
    OP_SUB_ASSIGN: idCounter++,
    OP_MUL_ASSIGN: idCounter++,
    OP_DIV_ASSIGN: idCounter++,
    OP_EXCESS_ASSIGN: idCounter++,
    OP_LSHIFT_ASSIGN: idCounter++,
    OP_RSHIFT_ASSIGN: idCounter++,
    OP_UNSIGNED_RSHIFT_ASSIGN: idCounter++,
    OP_BINARY_AND_ASSIGN: idCounter++,
    OP_BINARY_OR_ASSIGN: idCounter++,
    OP_XOR_ASSIGN: idCounter++,

    getName: function (id) {
        return names[id];
    },

    getOperatorPriority: function (id) {
        return priority[id];
    },

    isRightAssociative: function (id) {
        return rightAssoc.hasOwnProperty(id);
    },

    isBinaryOperator: function (id) {
        return binary.hasOwnProperty(id);
    }
};
Object.keys(tokens).forEach(function (name) {
    names[tokens[name]] = name;
});

priority[tokens.OP_DOT] = 18;
priority[tokens.OP_LB] = 18;

priority[tokens.OP_LP] = 17;

priority[tokens.OP_GET_AND_INC] = 16;
priority[tokens.OP_GET_AND_DEC] = 16;

priority[tokens.OP_NOT] = 15;
priority[tokens.OP_INC_AND_GET] = 15;
priority[tokens.OP_DEC_AND_GET] = 15;

priority[tokens.OP_MUL] = 14;
priority[tokens.OP_DIV] = 14;
priority[tokens.OP_EXCESS] = 14;

priority[tokens.OP_ADD] = 13;
priority[tokens.OP_SUB] = 13;

priority[tokens.OP_LSHIFT] = 12;
priority[tokens.OP_RSHIFT] = 12;
priority[tokens.OP_UNSIGNED_RSHIFT] = 12;

priority[tokens.OP_LT] = 11;
priority[tokens.OP_LTE] = 11;
priority[tokens.OP_GT] = 11;
priority[tokens.OP_GTE] = 11;

priority[tokens.OP_EQUALS] = 10;
priority[tokens.OP_NOT_EQUALS] = 10;

priority[tokens.OP_BINARY_AND] = 9;
priority[tokens.OP_XOR] = 8;
priority[tokens.OP_BINARY_OR] = 7;
priority[tokens.OP_LOGICAL_AND] = 6;
priority[tokens.OP_LOGICAL_OR] = 5;

priority[tokens.OP_TERNARY_IF] = 4;
priority[tokens.OP_TERNARY_ELSE] = 4;

priority[tokens.OP_ASSIGN] = 3;
priority[tokens.OP_ADD_ASSIGN] = 3;
priority[tokens.OP_SUB_ASSIGN] = 3;
priority[tokens.OP_MUL_ASSIGN] = 3;
priority[tokens.OP_DIV_ASSIGN] = 3;
priority[tokens.OP_EXCESS_ASSIGN] = 3;
priority[tokens.OP_LSHIFT_ASSIGN] = 3;
priority[tokens.OP_RSHIFT_ASSIGN] = 3;
priority[tokens.OP_UNSIGNED_RSHIFT_ASSIGN] = 3;
priority[tokens.OP_BINARY_AND_ASSIGN] = 3;
priority[tokens.OP_BINARY_OR_ASSIGN] = 3;
priority[tokens.OP_XOR_ASSIGN] = 3;

priority[tokens.OP_COMMA] = 0;

rightAssoc[tokens.OP_NOT] = true;
rightAssoc[tokens.OP_UNARY_PLUS] = true;
rightAssoc[tokens.OP_UNARY_MINUS] = true;
rightAssoc[tokens.OP_INC_AND_GET] = true;
rightAssoc[tokens.OP_DEC_AND_GET] = true;
rightAssoc[tokens.OP_ASSIGN] = true;
rightAssoc[tokens.OP_ADD_ASSIGN] = true;
rightAssoc[tokens.OP_SUB_ASSIGN] = true;
rightAssoc[tokens.OP_MUL_ASSIGN] = true;
rightAssoc[tokens.OP_DIV_ASSIGN] = true;
rightAssoc[tokens.OP_EXCESS_ASSIGN] = true;
rightAssoc[tokens.OP_LSHIFT_ASSIGN] = true;
rightAssoc[tokens.OP_RSHIFT_ASSIGN] = true;
rightAssoc[tokens.OP_UNSIGNED_RSHIFT_ASSIGN] = true;
rightAssoc[tokens.OP_BINARY_AND_ASSIGN] = true;
rightAssoc[tokens.OP_BINARY_OR_ASSIGN] = true;
rightAssoc[tokens.OP_XOR_ASSIGN] = true;

binary[tokens.OP_DOT] = true;
binary[tokens.OP_LP] = true;
binary[tokens.OP_LB] = true;
binary[tokens.OP_MUL] = true;
binary[tokens.OP_DIV] = true;
binary[tokens.OP_EXCESS] = true;
binary[tokens.OP_ADD] = true;
binary[tokens.OP_SUB] = true;
binary[tokens.OP_LSHIFT] = true;
binary[tokens.OP_RSHIFT] = true;
binary[tokens.OP_UNSIGNED_RSHIFT] = true;
binary[tokens.OP_LT] = true;
binary[tokens.OP_LTE] = true;
binary[tokens.OP_GT] = true;
binary[tokens.OP_GTE] = true;
binary[tokens.OP_EQUALS] = true;
binary[tokens.OP_NOT_EQUALS] = true;
binary[tokens.OP_BINARY_AND] = true;
binary[tokens.OP_XOR] = true;
binary[tokens.OP_BINARY_OR] = true;
binary[tokens.OP_LOGICAL_AND] = true;
binary[tokens.OP_LOGICAL_OR] = true;
binary[tokens.OP_ASSIGN] = true;
binary[tokens.OP_ADD_ASSIGN] = true;
binary[tokens.OP_SUB_ASSIGN] = true;
binary[tokens.OP_MUL_ASSIGN] = true;
binary[tokens.OP_DIV_ASSIGN] = true;
binary[tokens.OP_EXCESS_ASSIGN] = true;
binary[tokens.OP_LSHIFT_ASSIGN] = true;
binary[tokens.OP_RSHIFT_ASSIGN] = true;
binary[tokens.OP_UNSIGNED_RSHIFT_ASSIGN] = true;
binary[tokens.OP_BINARY_AND_ASSIGN] = true;
binary[tokens.OP_BINARY_OR_ASSIGN] = true;
binary[tokens.OP_XOR_ASSIGN] = true;

module.exports = tokens;
