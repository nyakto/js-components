/* global describe, xdescribe, it */
var Lexer = require('../lexer');
var Parser = require('../parser');
var ast = require('../ast');
var expect = require('chai').expect;

describe("parser", function () {
    var parser = new Parser();

    describe("statements", function () {
        it("tag statements", function () {
            expect(parser.tagStatement(new Lexer('input'))).to.be.eql(
                ast.createTag('input')
            );

            expect(parser.tagStatement(new Lexer('#someId'))).to.be.eql(
                ast.createTag()
                    .setId('someId')
            );

            expect(parser.tagStatement(new Lexer('button.large.green#submit Do some great things!'))).to.be.eql(
                ast.createTag('button')
                    .addClass('large')
                    .addClass('green')
                    .setId('submit')
                    .addContent(ast.createText('Do some great things!'))
            );
        });

        it("supports attributes", function () {
        });
    });

    describe("expressions", function () {
        it("literals", function () {
            expect(parser.expression(new Lexer('"qwe"'))).to.be.eql(
                ast.createExpression(ast.createValue("qwe"))
            );

            expect(parser.expression(new Lexer("'asd'"))).to.be.eql(
                ast.createExpression(ast.createValue("asd"))
            );

            expect(parser.expression(new Lexer("100500"))).to.be.eql(
                ast.createExpression(ast.createValue(100500))
            );

            expect(parser.expression(new Lexer("true"))).to.be.eql(
                ast.createExpression(ast.createValue(true))
            );

            expect(parser.expression(new Lexer("false"))).to.be.eql(
                ast.createExpression(ast.createValue(false))
            );

            expect(parser.expression(new Lexer("null"))).to.be.eql(
                ast.createExpression(ast.createValue(null))
            );
        });
    });
});
