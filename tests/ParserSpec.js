/* global describe, xdescribe, it */
var Lexer = require('../lexer');
var Parser = require('../parser');
var tokens = require('../tokens');
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
        function operand(value) {
            if (typeof value === 'string') {
                return ast.createIdentifier(value);
            } else if (typeof value !== 'object') {
                return ast.createValue(value);
            }
            return value;
        }

        function op(type, a, b, c) {
            if (typeof c === 'undefined') {
                if (typeof b === 'undefined') {
                    return ast.createUnaryOperator(
                        type,
                        operand(a)
                    );
                } else {
                    return ast.createBinaryOperator(
                        type,
                        operand(a),
                        operand(b)
                    );
                }
            } else {
                return ast.createTernaryOperator(
                    type,
                    operand(a),
                    operand(b),
                    operand(c)
                );
            }
        }

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

        it("binary operators", function () {
            expect(parser.expression(new Lexer("a + b"))).to.be.eql(
                ast.createExpression(op(
                    tokens.OP_ADD,
                    'a',
                    'b'
                ))
            );

            expect(parser.expression(new Lexer("(a + b) * (c - d)"))).to.be.eql(
                ast.createExpression(op(
                    tokens.OP_MUL,
                    op(tokens.OP_ADD, 'a', 'b'),
                    op(tokens.OP_SUB, 'c', 'd')
                ))
            );

            expect(parser.expression(new Lexer("info.text"))).to.be.eql(
                ast.createExpression(op(
                    tokens.OP_DOT,
                    ast.createIdentifier('info'),
                    ast.createIdentifier('text')
                ))
            );

            expect(parser.expression(new Lexer("info[name + id].text"))).to.be.eql(
                ast.createExpression(op(
                    tokens.OP_DOT,
                    op(
                        tokens.OP_LB,
                        ast.createIdentifier('info'),
                        op(
                            tokens.OP_ADD,
                            ast.createIdentifier('name'),
                            ast.createIdentifier('id')
                        )
                    ),
                    ast.createIdentifier('text')
                ))
            );
        });
    });
});
