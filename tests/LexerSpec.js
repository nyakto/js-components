/* global describe, xdescribe, it */
var Lexer = require('../lexer');
var tokens = require('../tokens');
var expect = require('chai').expect;

describe("lexer", function () {
    var lexer;

    it("supports WORD tokens", function () {
        lexer = new Lexer('div');
        expectWord(lexer.next(), 'div');
        expectEOF(lexer.next());

        lexer = new Lexer('on:click');
        expectWord(lexer.next(), 'on:click');
        expectEOF(lexer.next());
    });

    it("supports WHITESPACE, TEXT_START and TEXT tokens", function () {
        lexer = new Lexer('textarea some text');
        expectWord(lexer.next(), 'textarea');
        expectWhitespace(lexer.next(), ' ');
        lexer.setMode(Lexer.EXPECT_TEXT_MODE);
        expectText(lexer.next(), 'some text');
        expectEOF(lexer.next());

        lexer = new Lexer('textarea \tsome text');
        expectWord(lexer.next(), 'textarea');
        expectWhitespace(lexer.next(), ' \t');
        lexer.setMode(Lexer.EXPECT_TEXT_MODE);
        expectText(lexer.next(), 'some text');
        expectEOF(lexer.next());

        lexer = new Lexer('textarea |\tsome text');
        expectWord(lexer.next(), 'textarea');
        expectWhitespace(lexer.next(), ' ');
        lexer.setMode(Lexer.EXPECT_TEXT_MODE);
        expectToken(lexer.next(), tokens.TEXT_START, '|');
        lexer.setMode(Lexer.TEXT_MODE);
        expectText(lexer.next(), '\tsome text');
        expectEOF(lexer.next());

        lexer = new Lexer('textarea ||some text');
        expectWord(lexer.next(), 'textarea');
        expectWhitespace(lexer.next(), ' ');
        lexer.setMode(Lexer.EXPECT_TEXT_MODE);
        expectToken(lexer.next(), tokens.TEXT_START, '|');
        lexer.setMode(Lexer.TEXT_MODE);
        expectText(lexer.next(), '|some text');
        expectEOF(lexer.next());
    });

    it("supports LF, INDENT and UNINDENT tokens", function () {
        lexer = new Lexer("textarea\t  \t\r\n\r\t\n");
        expectWord(lexer.next(), 'textarea');
        expectLF(lexer.next());
        expectLF(lexer.next());
        expectLF(lexer.next());
        expectEOF(lexer.next());

        lexer = new Lexer("form\n\tinput\n\tinput\n\t\n\tbutton Submit\ndiv");
        expectWord(lexer.next(), 'form');
        expectLF(lexer.next());
        expectIndent(lexer.next());
        expectWord(lexer.next(), 'input');
        expectLF(lexer.next());
        expectWord(lexer.next(), 'input');
        expectLF(lexer.next());
        expectLF(lexer.next());
        expectWord(lexer.next(), 'button');
        expectWhitespace(lexer.next(), ' ');
        lexer.setMode(Lexer.EXPECT_TEXT_MODE);
        expectText(lexer.next(), 'Submit');
        lexer.setMode(Lexer.DEFAULT_MODE);
        expectLF(lexer.next());
        expectUnIndent(lexer.next());
        expectWord(lexer.next(), 'div');
        expectEOF(lexer.next());

        lexer = new Lexer('div\n\t\t');
        expectWord(lexer.next(), 'div');
        expectLF(lexer.next());
        expectIndent(lexer.next());
        expectUnIndent(lexer.next());
        expectEOF(lexer.next());

        lexer = new Lexer('a\n\tb\n\t  c\n\t  d\ne\n  f');
        expectWord(lexer.next(), 'a');
        expectLF(lexer.next());
        expectIndent(lexer.next());
        expectWord(lexer.next(), 'b');
        expectLF(lexer.next());
        expectIndent(lexer.next());
        expectWord(lexer.next(), 'c');
        expectLF(lexer.next());
        expectWord(lexer.next(), 'd');
        expectLF(lexer.next());
        expectUnIndent(lexer.next());
        expectUnIndent(lexer.next());
        expectWord(lexer.next(), 'e');
        expectLF(lexer.next());
        expectIndent(lexer.next());
        expectWord(lexer.next(), 'f');
        expectUnIndent(lexer.next());
        expectEOF(lexer.next());
    });

    it("supports CLASS_START and ID_START tokens", function () {
        lexer = new Lexer('form\n\tinput.username#login\n\tinput.password#pass\n\tbutton Login');
        expectWord(lexer.next(), 'form');
        expectLF(lexer.next());
        expectIndent(lexer.next());
        expectWord(lexer.next(), 'input');
        expectToken(lexer.next(), tokens.CLASS_START, '.');
        expectWord(lexer.next(), 'username');
        expectToken(lexer.next(), tokens.ID_START, '#');
        expectWord(lexer.next(), 'login');
        expectLF(lexer.next());
        expectWord(lexer.next(), 'input');
        expectToken(lexer.next(), tokens.CLASS_START, '.');
        expectWord(lexer.next(), 'password');
        expectToken(lexer.next(), tokens.ID_START, '#');
        expectWord(lexer.next(), 'pass');
        expectLF(lexer.next());
        expectWord(lexer.next(), 'button');
        expectWhitespace(lexer.next(), ' ');
        lexer.setMode(Lexer.EXPECT_TEXT_MODE);
        expectText(lexer.next(), 'Login');
        lexer.setMode(Lexer.DEFAULT_MODE);
        expectUnIndent(lexer.next());
        expectEOF(lexer.next());
    });

    it("supports ATTR_START token", function () {
        lexer = new Lexer('div\n\t@on:click "onClick"');
        expectWord(lexer.next(), 'div');
        expectLF(lexer.next());
        expectIndent(lexer.next());
        expectToken(lexer.next(), tokens.ATTR_START, '@');
        expectWord(lexer.next(), 'on:click');
        expectWhitespace(lexer.next(), ' ');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.STRING_LITERAL, '"onClick"');
        expectUnIndent(lexer.next());
        expectEOF(lexer.next());
    });

    it("supports expressions", function () {
        lexer = new Lexer('(a + b) * (c - d["test"])');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.OP_LP, '(');
        expectToken(lexer.next(), tokens.IDENTIFIER, 'a');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_ADD, '+');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.IDENTIFIER, 'b');
        expectToken(lexer.next(), tokens.OP_RP, ')');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_MUL, '*');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_LP, '(');
        expectToken(lexer.next(), tokens.IDENTIFIER, 'c');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_SUB, '-');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.IDENTIFIER, 'd');
        expectToken(lexer.next(), tokens.OP_LB, '[');
        expectToken(lexer.next(), tokens.STRING_LITERAL, '"test"');
        expectToken(lexer.next(), tokens.OP_RB, ']');
        expectToken(lexer.next(), tokens.OP_RP, ')');
        expectEOF(lexer.next());

        lexer = new Lexer('<<= << <= <');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.OP_LSHIFT_ASSIGN, '<<=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_LSHIFT, '<<');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_LTE, '<=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_LT, '<');
        expectEOF(lexer.next());

        lexer = new Lexer('>>>= >>= >>> >> >= >');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.OP_UNSIGNED_RSHIFT_ASSIGN, '>>>=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_RSHIFT_ASSIGN, '>>=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_UNSIGNED_RSHIFT, '>>>');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_RSHIFT, '>>');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_GTE, '>=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_GT, '>');
        expectEOF(lexer.next());

        lexer = new Lexer('++ -- += -= + - %= % *= * /= /');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.OP_INC, '++');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_DEC, '--');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_ADD_ASSIGN, '+=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_SUB_ASSIGN, '-=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_ADD, '+');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_SUB, '-');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_EXCESS_ASSIGN, '%=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_EXCESS, '%');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_MUL_ASSIGN, '*=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_MUL, '*');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_DIV_ASSIGN, '/=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_DIV, '/');

        lexer = new Lexer('null ? false : true');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.NULL_LITERAL, 'null');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_TERNARY_IF, '?');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.BOOLEAN_LITERAL, 'false');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_TERNARY_ELSE, ':');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.BOOLEAN_LITERAL, 'true');

        lexer = new Lexer('trigger("login", login.getValue(), pass.getValue())');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.IDENTIFIER, 'trigger');
        expectToken(lexer.next(), tokens.OP_LP, '(');
        expectToken(lexer.next(), tokens.STRING_LITERAL, '"login"');
        expectToken(lexer.next(), tokens.OP_COMMA, ',');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.IDENTIFIER, 'login');
        expectToken(lexer.next(), tokens.OP_DOT, '.');
        expectToken(lexer.next(), tokens.IDENTIFIER, 'getValue');
        expectToken(lexer.next(), tokens.OP_LP, '(');
        expectToken(lexer.next(), tokens.OP_RP, ')');
        expectToken(lexer.next(), tokens.OP_COMMA, ',');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.IDENTIFIER, 'pass');
        expectToken(lexer.next(), tokens.OP_DOT, '.');
        expectToken(lexer.next(), tokens.IDENTIFIER, 'getValue');
        expectToken(lexer.next(), tokens.OP_LP, '(');
        expectToken(lexer.next(), tokens.OP_RP, ')');
        expectToken(lexer.next(), tokens.OP_RP, ')');

        lexer = new Lexer('== = != !');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.OP_EQUALS, '==');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_ASSIGN, '=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_NOT_EQUALS, '!=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_NOT, '!');

        lexer = new Lexer('&& &= & || |= | ^= ^');
        lexer.setMode(Lexer.EXPR_MODE);
        expectToken(lexer.next(), tokens.OP_LOGICAL_AND, '&&');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_BINARY_AND_ASSIGN, '&=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_BINARY_AND, '&');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_LOGICAL_OR, '||');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_BINARY_OR_ASSIGN, '|=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_BINARY_OR, '|');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_XOR_ASSIGN, '^=');
        expectWhitespace(lexer.next(), ' ');
        expectToken(lexer.next(), tokens.OP_XOR, '^');
        expectEOF(lexer.next());
    });
});

function expectToken(token, id, text) {
    expect(tokens.getName(token.id)).to.be.equal(tokens.getName(id));
    expect(token.text).to.be.equal(text);
}

function expectWord(token, text) {
    expectToken(token, tokens.WORD, text);
}

function expectWhitespace(token, text) {
    expectToken(token, tokens.WHITESPACE, text);
}

function expectText(token, text) {
    expectToken(token, tokens.TEXT, text);
}

function expectLF(token) {
    expect(tokens.getName(token.id)).to.be.equal(tokens.getName(tokens.LF));
}

function expectIndent(token) {
    expect(tokens.getName(token.id)).to.be.equal(tokens.getName(tokens.INDENT));
}

function expectUnIndent(token) {
    expect(tokens.getName(token.id)).to.be.equal(tokens.getName(tokens.UNINDENT));
}

function expectEOF(token) {
    expect(tokens.getName(token.id)).to.be.equal(tokens.getName(tokens.EOF));
}