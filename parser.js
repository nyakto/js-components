var Lexer = require('./lexer');
var tokens = require('./tokens');
var ast = require('./ast');

/*
 form
 @method "POST"
 @action "/login"
 input.correct(correctUsername)#username
 @on:change(value) validateUsername(value)
 input.correct(correctPassword)#password
 @on:change(value) validatePassword(value)
 button Login
 @disabled !canSubmit
 @on:click "submit"
 */

// TODO: CSS для классов компонента должны переименовываться в уникальные названия классов (.some-class { /* ... */ } -> .login_form_some-class { /* ... */ })
// TODO: CSS для тегов компонента должен превращаться в CSS с классами (form { /* ... */ } -> .login_form_tag_form { /* ... */ })
// TODO: CSS для идентификаторов должен превращаться в CSS с классами (#username { /* ... */ } -> .login_form_id_username { /* ... */ })
// TODO: режим минификации / обфускации CSS классов
// TODO: написание стилей в формате LESS (с наследованием переменных и прочими плюшками)
// TODO: для вставки HTML нужно использовать функцию html(): div= html(safeHtml)
// TODO: для объединения текста и HTML нужно использовать функцию concat(): div= concat("<html>", html(someHtml), "</html>")
// TODO: у компонента должен быть метод update() для принудительного обновления представления
// TODO: компонент автоматически обновляет представление после изменения опций, которые он может отследить (asap)
// TODO: улучшенная поддержка событий (@on:change - будет вызываться сразу при изменении value у input, а не после смены фокуса)
// TODO: для полей компонента должны генерироваться getter / setter (this.setValue('qwe asd'), this.getValue()) + универсальный ( this.set('value', 'qwe asd'), this.get('value'))
// TODO: поддержка "тем оформления"

/**
 * @param {Lexer} lexer
 * @param {number} id
 * @returns {boolean|object}
 */
function consume(lexer, id) {
    var token = lexer.peek();
    if (token.id === id) {
        return lexer.next();
    }
    return false;
}

function Parser() {
}

/**
 * template: <empty>;
 * template: statement template;
 * @param {Lexer} lexer
 * @returns {Statement[]}
 */
Parser.prototype.template = function (lexer) {
    var statements = [];
    var token = lexer.peek();
    while (token.id !== tokens.EOF && token.id !== tokens.UNINDENT) {
        statements.push(this.statement(lexer));
        token = lexer.peek();
    }
    return statements;
};

/**
 * statement: tag_statement;
 * TODO statement: text_statement;
 * TODO statement: expr_statement;
 * TODO statement: component_statement;
 * TODO statement: each_statement;
 * TODO statement: if_statement;
 * @param {Lexer} lexer
 * @returns {Statement}
 */
Parser.prototype.statement = function (lexer) {
    var token = lexer.peek();
    switch (token.id) {
        case tokens.WORD:
        case tokens.CLASS_START:
        case tokens.ID_START:
            return this.tagStatement(lexer);
    }
    throw new Error();
};

/**
 * tag_statement: tag_decl tag_inline_content tag_content;
 * @param {Lexer} lexer
 */
Parser.prototype.tagStatement = function (lexer) {
    var tag = ast.createTag();
    this.tagDeclaration(lexer, tag);
    this.tagInlineContent(lexer, tag);
    if (consume(lexer, tokens.LF)) {
        this.tagContent(lexer, tag);
    }
    return tag;
};

/**
 * text_statement: TEXT_START TEXT LF?;
 * @param {Lexer} lexer
 */
Parser.prototype.textStatement = function (lexer) {
    if (!consume(lexer, tokens.TEXT_START)) {
        throw new Error();
    }
    lexer.setMode(Lexer.TEXT_MODE);
    var token = consume(lexer, tokens.TEXT);
    if (!token) {
        throw new Error();
    }
    consume(lexer, tokens.LF);
    return ast.createText(token.text);
};

/**
 * tag_decl: WORD tag_optional_description;
 * tag_decl: (=> CLASS_START) tag_optional_description;
 * tag_decl: (=> ID_START) tag_optional_description;
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.tagDeclaration = function (lexer, tag) {
    var token = lexer.peek();
    switch (token.id) {
        case tokens.WORD:
            tag.setTagName(token.text);
            lexer.next();
            this.tagOptionalDescription(lexer, tag);
            return;
        case tokens.CLASS_START:
        case tokens.ID_START:
            this.tagOptionalDescription(lexer, tag);
            return;
    }
    throw new Error();
};

/**
 * tag_optional_description: <empty>;
 * tag_optional_description: (=> CLASS_START) tag_class_list tag_optional_id;
 * tag_optional_description: (=> ID_START) tag_optional_id tag_class_list;
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.tagOptionalDescription = function (lexer, tag) {
    var token = lexer.peek();
    switch (token.id) {
        case tokens.CLASS_START:
            this.tagClassList(lexer, tag);
            this.tagOptionalId(lexer, tag);
            return;
        case tokens.ID_START:
            this.tagOptionalId(lexer, tag);
            this.tagClassList(lexer, tag);
            return;
    }
};

/**
 * tag_class_list: <empty>;
 * tag_class_list: CLASS_START WORD tag_class_list;
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.tagClassList = function (lexer, tag) {
    var token = lexer.peek();
    while (token.id === tokens.CLASS_START) {
        lexer.next();
        token = lexer.next();
        if (token.id !== tokens.WORD) {
            throw new Error();
        }
        tag.addClass(token.text);
        // TODO: условные выражения для классов .visible(a + b > 100)
        token = lexer.peek();
    }
};

/**
 * tag_optional_id: <empty>;
 * tag_optional_id: ID_START WORD;
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.tagOptionalId = function (lexer, tag) {
    var token = lexer.peek();
    if (token.id === tokens.ID_START) {
        lexer.next();
        token = lexer.next();
        if (token.id !== tokens.WORD) {
            throw new Error();
        }
        tag.setId(token.text);
    }
};

/**
 * // tag_inline_content: <empty>;
 * // tag_inline_content: WHITESPACE {expect_text} TEXT {default};
 * // tag_inline_content: WHITESPACE {expect_text} TEXT_START {text} TEXT {default};
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.tagInlineContent = function (lexer, tag) {
    var token = lexer.peek();
    if (token.id === tokens.WHITESPACE) {
        lexer.next();
        lexer.setMode(Lexer.EXPECT_TEXT_MODE);
        token = lexer.next();
        switch (token.id) {
            case tokens.TEXT_START:
                lexer.setMode(Lexer.TEXT_MODE);
                token = lexer.next();
                if (token.id !== tokens.TEXT) {
                    throw new Error();
                }
                tag.addContent(ast.createText(token.text));
                lexer.setMode(Lexer.DEFAULT_MODE);
                return;
            case tokens.TEXT:
                tag.addContent(ast.createText(token.text));
                lexer.setMode(Lexer.DEFAULT_MODE);
                return;
            default:
                throw new Error();
        }
    }
};

/**
 * tag_content: <empty>;
 * tag_content: INDENT attributes_list template UNINDENT;
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.tagContent = function (lexer, tag) {
    var token = lexer.peek();
    if (token.id === tokens.INDENT) {
        lexer.next();
        this.attributesList(lexer, tag);
        this.template(lexer).forEach(function (statement) {
            tag.addContent(statement);
        });
        token = lexer.next();
        if (token.id !== tokens.UNINDENT) {
            throw new Error();
        }
    }
};

/**
 * attributes_list: <empty>;
 * attributes_list: attribute attributes_list;
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.attributesList = function (lexer, tag) {
    var token = lexer.peek();
    while (token.id === tokens.ATTR_START) {
        tag.addAttribute(this.attribute(lexer));
        token = lexer.peek();
    }
};

/**
 * // TODO: conditional attributes (@checked(isChecked))
 * attribute: ATTR_START WORD optional_attribute_value LF?;
 * optional_attribute_value: <empty>;
 * optional_attribute_value: WHITESPACE expression;
 * @param {Lexer} lexer
 * @returns {Attribute}
 */
Parser.prototype.attribute = function (lexer) {
    var token = lexer.next();
    if (token.id !== tokens.ATTR_START) {
        throw new Error();
    }
    token = lexer.next();
    if (token.id !== tokens.WORD) {
        throw new Error();
    }
    var name = token.text;
    var value;
    token = lexer.peek();
    if (token.id === tokens.WHITESPACE) {
        lexer.next();
        value = this.expression(lexer);
    } else {
        value = ast.createExpression(
            ast.createValue(true)
        );
    }
    consume(lexer, tokens.LF);
    return ast.createAttribute(name, value);
};

/**
 * expression: expr;
 * @param {Lexer} lexer
 * @returns {ExpressionStatement}
 */
Parser.prototype.expression = function (lexer) {
    lexer.setMode(Lexer.EXPR_MODE);
    var expr = ast.createExpression(
        this.expr(lexer)
    );
    lexer.setMode(Lexer.DEFAULT_MODE);
    return expr;
};

/**
 * expr: operand expr_tail;
 * @param {Lexer} lexer
 * @returns {Operand}
 */
Parser.prototype.expr = function (lexer) {
    var reversePolishNotation = ast.createReversePolishNotation();
    reversePolishNotation.addValue(this.operand(lexer));
    var token = lexer.peek();
    if (tokens.isBinaryOperator(token.id) || token.id === tokens.OP_LB) {
        this.exprTail(lexer, reversePolishNotation);
    }
    return reversePolishNotation.convert();
};

/**
 * expr_tail: <empty>;
 * expr_tail: OP_LB expr OP_RB expr_tail;
 * expr_tail: binary_operator operand expr_tail;
 * @param {Lexer} lexer
 * @param {ReversePolishNotation} reversePolishNotation
 */
Parser.prototype.exprTail = function (lexer, reversePolishNotation) {
    var token = lexer.peek();
    while (true) {
        if (tokens.isBinaryOperator(token.id)) {
            lexer.next();
            reversePolishNotation.addOperator(token);
            reversePolishNotation.addValue(
                this.operand(lexer)
            );
        } else if (token.id === tokens.OP_LB) {
            lexer.next();
            reversePolishNotation.addOperator(token);
            reversePolishNotation.addValue(
                this.expr(lexer)
            );
            token = lexer.next();
            if (token.id !== tokens.OP_RB) {
                throw new Error();
            }
        } else {
            return;
        }
        token = lexer.peek();
    }
};

/**
 * operand: OP_LP expr OP_RP;
 * operand: IDENTIFIER;
 * operand: NULL_LITERAL;
 * operand: BOOLEAN_LITERAL;
 * operand: STRING_LITERAL;
 * operand: NUMBER_LITERAL;
 * @param {Lexer} lexer
 * @returns {Operand}
 */
Parser.prototype.operand = function (lexer) {
    var token = lexer.peek();
    switch (token.id) {
        case tokens.IDENTIFIER:
            lexer.next();
            return ast.createIdentifier(token.text);
        case tokens.NULL_LITERAL:
            lexer.next();
            return ast.createValue(null);
        case tokens.BOOLEAN_LITERAL:
            lexer.next();
            return ast.createBooleanLiteral(token.text);
        case tokens.STRING_LITERAL:
            lexer.next();
            return ast.createStringLiteral(token.text);
        case tokens.NUMBER_LITERAL:
            lexer.next();
            return ast.createNumberLiteral(token.text);
        case tokens.OP_LP:
            lexer.next();
            var result = this.expr(lexer);
            token = lexer.next();
            if (token.id !== tokens.OP_RP) {
                throw new Error();
            }
            return result;
    }
    throw new Error();
};

module.exports = Parser;
