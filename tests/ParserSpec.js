/* global describe, xdescribe, it */
var Lexer = require('../lexer');
var Parser = require('../parser');
var ast = require('../ast');
var expect = require('chai').expect;

describe("parser", function () {
    var parser = new Parser();

    it("supports tag statements", function () {
        expect(parser.tagStatement(new Lexer('input'))).to.eql(
            ast.createTag('input')
        );

        expect(parser.tagStatement(new Lexer('#someId'))).to.eql(
            ast.createTag()
                .setId('someId')
        );

        expect(parser.tagStatement(new Lexer('button.large.green#submit Do some great things!'))).to.eql(
            ast.createTag('button')
                .addClass('large')
                .addClass('green')
                .setId('submit')
                .addContent(ast.createText('Do some great things!'))
        );
    });
});
