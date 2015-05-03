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
 * @returns {boolean|Token}
 */
function consume(lexer, id) {
    var token = lexer.peek();
    if (token.id === id) {
        return lexer.next();
    }
    return false;
}

/**
 * @param {Lexer} lexer
 * @param {string} word
 */
function consumeWord(lexer, word) {
    var token = lexer.peek();
    if (token.id === tokens.WORD && token.text === word) {
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
 * statement: text_statement;
 * statement: expr_statement;
 * TODO statement: component_statement;
 * statement: each_statement;
 * statement: if_statement;
 * @param {Lexer} lexer
 * @returns {Statement}
 */
Parser.prototype.statement = function (lexer) {
    var token = lexer.peek();
    switch (token.id) {
        case tokens.WORD:
            switch (token.text) {
                case 'if':
                    return this.ifStatement(lexer);
                case 'else':
                    throw new Error();
                case 'each':
                    return this.eachStatement(lexer);
            }
            return this.tagStatement(lexer);
        case tokens.CLASS_START:
        case tokens.ID_START:
            return this.tagStatement(lexer);
        case tokens.TEXT_START:
            return this.textStatement(lexer);
        case tokens.EXPR_START:
            return this.expressionStatement(lexer);
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
 * text_statement: TEXT_START {text} TEXT {default} LF?;
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
    lexer.setMode(Lexer.DEFAULT_MODE);
    consume(lexer, tokens.LF);
    return ast.createText(token.text);
};

/**
 * expr_statement: EXPR_START expression LF?;
 * @param {Lexer} lexer
 */
Parser.prototype.expressionStatement = function (lexer) {
    if (!consume(lexer, tokens.EXPR_START)) {
        throw new Error();
    }
    var result = this.expression(lexer);
    consume(lexer, tokens.LF);
    return result;
};

/**
 * each_statement: WORD[each] WHITESPACE WORD WHITESPACE WORD[in] expression LF? inner_content;
 * each_statement: WORD[each] WHITESPACE WORD WHITESPACE? OP_COMMA, WHITESPACE? WORD WHITESPACE WORD[in] expression LF? inner_content;
 * @param {Lexer} lexer
 * @returns {EachStatement}
 */
Parser.prototype.eachStatement = function (lexer) {
    var result = ast.createEach();
    if (!consumeWord(lexer, 'each')) {
        throw new Error();
    }
    consume(lexer, tokens.WHITESPACE);
    var keyOrValue = consume(lexer, tokens.WORD);
    if (!keyOrValue) {
        throw new Error();
    }
    consume(lexer, tokens.WHITESPACE);
    if (consume(lexer, tokens.OP_COMMA)) {
        consume(lexer, tokens.WHITESPACE);
        var valueName = consume(lexer, tokens.WORD);
        if (!valueName) {
            throw new Error();
        }
        consume(lexer, tokens.WHITESPACE);
        result.setKeyName(keyOrValue.text);
        result.setValueName(valueName.text);
    } else {
        result.setValueName(keyOrValue.text);
    }
    if (!consumeWord(lexer, 'in')) {
        throw new Error();
    }
    result.setExpression(
        this.expression(lexer)
    );
    if (consume(lexer, tokens.LF)) {
        result.setContent(
            this.innerContent(lexer)
        );
    }
    return result;
};

/**
 * if_statement: WORD[if] expression LF? inner_content if_statement_tail;
 * @param {Lexer} lexer
 * @returns {IfStatement}
 */
Parser.prototype.ifStatement = function (lexer) {
    var result = ast.createIf();
    if (!consumeWord(lexer, 'if')) {
        throw new Error();
    }
    var condition = this.expression(lexer);
    if (consume(lexer, tokens.LF)) {
        var content = this.innerContent(lexer);
        result.addConditionalContent(condition, content);
        this.ifStatementTail(lexer, result);
    } else {
        result.addConditionalContent(condition, []);
    }
    return result;
};

/**
 * inner_content: <empty>;
 * inner_content: INDENT template UNINDENT;
 * @param {Lexer} lexer
 * @returns {Statement[]}
 */
Parser.prototype.innerContent = function (lexer) {
    var result = [];
    if (consume(lexer, tokens.INDENT)) {
        result = this.template(lexer);
        if(!consume(lexer, tokens.UNINDENT)) {
            throw new Error();
        }
    }
    return result;
};

/**
 * if_statement_tail: <empty>;
 * if_statement_tail: WORD[else] WHITESPACE WORD[if] expression LF? inner_content if_statement_tail;
 * if_statement_tail: WORD[else] LF? inner_content;
 * @param {Lexer} lexer
 * @param {IfStatement} ifStatement
 */
Parser.prototype.ifStatementTail = function (lexer, ifStatement) {
    var elseIf, condition, content;
    while (consumeWord(lexer, 'else')) {
        lexer.pushState();
        elseIf = false;
        try {
            if (consume(lexer, tokens.WHITESPACE)) {
                elseIf = consumeWord(lexer, 'if');
            }
        } catch (ignored) {
        }
        lexer.popState();
        if (elseIf) {
            consume(lexer, tokens.WHITESPACE);
            consumeWord(lexer, 'if');
            condition = this.expression(lexer);
            if (consume(lexer, tokens.LF)) {
                content = this.innerContent(lexer);
                ifStatement.addConditionalContent(condition, content);
            } else {
                ifStatement.addConditionalContent(condition, []);
                return;
            }
        } else {
            if (consume(lexer, tokens.LF)) {
                ifStatement.setElseContent(
                    this.innerContent(lexer)
                );
            }
            return;
        }
    }
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
    var condition;
    while (token.id === tokens.CLASS_START) {
        lexer.next();
        if (!(token = consume(lexer, tokens.WORD))) {
            throw new Error();
        }
        condition = true;
        if (consume(lexer, tokens.OP_LP)) {
            condition = this.expression(lexer);
            if (!consume(lexer, tokens.OP_RP)) {
                throw new Error();
            }
        }
        tag.addClass(token.text, condition);
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
 * // tag_inline_content: EXPR_START expression;
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
    } else if (token.id === tokens.EXPR_START) {
        lexer.next();
        tag.addContent(this.expression(lexer));
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
        this.attribute(lexer, tag);
        token = lexer.peek();
    }
};

/**
 * // TODO: conditional attributes (@checked(isChecked))
 * attribute: tag_attribute;
 * attribute: event_binding;
 * tag_attribute: ATTR_START WORD optional_attribute_value LF?;
 * event_binding: ATTR_START WORD[^on:] event_binding_args WHITESPACE expression LF?;
 * optional_attribute_value: <empty>;
 * optional_attribute_value: WHITESPACE expression;
 * event_binding_args: <empty>;
 * event_binding_args: OP_LP WHITESPACE? (WORD WHITESPACE? (OP_COMMA WHITESPACE? WORD WHITESPACE?)*)? OP_RP;
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.attribute = function (lexer, tag) {
    if (!consume(lexer, tokens.ATTR_START)) {
        throw new Error();
    }
    var token = consume(lexer, tokens.WORD);
    if (!token) {
        throw new Error();
    }
    var name = token.text;
    if (name.substr(0, 3) === 'on:') {
        name = name.substr(3);
        var args = [];
        if (consume(lexer, tokens.OP_LP)) {
            consume(lexer, tokens.WHITESPACE);
            token = consume(lexer, tokens.WORD);
            if (token) {
                args.push(token.text);
                consume(lexer, tokens.WHITESPACE);
                while (consume(lexer, tokens.OP_COMMA)) {
                    consume(lexer, tokens.WHITESPACE);
                    token = consume(lexer, tokens.WORD);
                    if (!token) {
                        throw new Error();
                    }
                    args.push(token.text);
                    consume(lexer, tokens.WHITESPACE);
                }
            }
            if (!consume(lexer, tokens.OP_RP)) {
                throw new Error();
            }
        }
        if (!consume(lexer, tokens.WHITESPACE)) {
            throw new Error();
        }
        var action = this.expression(lexer);
        tag.addEventBinding(ast.createEventBinding(name, args, action));
    } else {
        var value;
        if (consume(lexer, tokens.WHITESPACE)) {
            value = this.expression(lexer);
        } else {
            value = ast.createExpression(
                ast.createValue(true)
            );
        }
        consume(lexer, tokens.LF);
        tag.addAttribute(ast.createAttribute(name, value));
    }
};

/**
 * expression: {expr} expr {default};
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
    this.operand(lexer, reversePolishNotation);
    var token = lexer.peek();
    if (token.id === tokens.OP_INC) {
        lexer.next();
        token.id = tokens.OP_GET_AND_INC;
        reversePolishNotation.addOperator(token, true);
        token = lexer.peek();
    } else if (token.id === tokens.OP_DEC) {
        lexer.next();
        token.id = tokens.OP_GET_AND_DEC;
        reversePolishNotation.addOperator(token, true);
        token = lexer.peek();
    }
    if (tokens.isBinaryOperator(token.id)) {
        this.exprTail(lexer, reversePolishNotation);
    }
    return reversePolishNotation.convert();
};

/**
 * expr_tail: <empty>;
 * expr_tail: OP_LB expr OP_RB expr_tail;
 * expr_tail: OP_LP function_args OP_RP expr_tail;
 * expr_tail: binary_operator operand expr_tail;
 * @param {Lexer} lexer
 * @param {ReversePolishNotation} reversePolishNotation
 */
Parser.prototype.exprTail = function (lexer, reversePolishNotation) {
    var token = lexer.peek();
    while (true) {
        if (token.id === tokens.OP_LB) {
            lexer.next();
            reversePolishNotation.addOperator(token);
            reversePolishNotation.addValue(
                this.expr(lexer)
            );
            if (!consume(lexer, tokens.OP_RB)) {
                throw new Error();
            }
        } else if (token.id === tokens.OP_LP) {
            lexer.next();
            reversePolishNotation.addOperator(token);
            reversePolishNotation.addValue(
                ast.createValue(
                    this.functionArgs(lexer)
                )
            );
            if (!consume(lexer, tokens.OP_RP)) {
                throw new Error();
            }
        } else if (tokens.isBinaryOperator(token.id)) {
            lexer.next();
            reversePolishNotation.addOperator(token);
            this.operand(lexer, reversePolishNotation);
        } else {
            return;
        }
        token = lexer.peek();
    }
};

/**
 * function_args: <empty>;
 * function_args: expr (OP_COMMA expr)*;
 * @param {Lexer} lexer
 * @returns {Operand[]}
 */
Parser.prototype.functionArgs = function (lexer) {
    var token = lexer.peek();
    if (token.id === tokens.OP_RP) {
        return [];
    }
    var result = [
        this.expr(lexer)
    ];
    while (consume(lexer, tokens.OP_COMMA)) {
        result.push(this.expr(lexer));
    }
    return result;
};

/**
 * operand: OP_LP expr OP_RP;
 * operand: IDENTIFIER;
 * operand: NULL_LITERAL;
 * operand: BOOLEAN_LITERAL;
 * operand: STRING_LITERAL;
 * operand: NUMBER_LITERAL;
 * operand: OP_NOT operand;
 * @param {Lexer} lexer
 * @param {ReversePolishNotation} reversePolishNotation
 */
Parser.prototype.operand = function (lexer, reversePolishNotation) {
    var token;
    while (true) {
        token = lexer.peek();
        switch (token.id) {
            case tokens.IDENTIFIER:
                lexer.next();
                reversePolishNotation.addValue(ast.createIdentifier(token.text));
                return;
            case tokens.NULL_LITERAL:
                lexer.next();
                reversePolishNotation.addValue(ast.createValue(null));
                return;
            case tokens.BOOLEAN_LITERAL:
                lexer.next();
                reversePolishNotation.addValue(ast.createBooleanLiteral(token.text));
                return;
            case tokens.STRING_LITERAL:
                lexer.next();
                reversePolishNotation.addValue(ast.createStringLiteral(token.text));
                return;
            case tokens.NUMBER_LITERAL:
                lexer.next();
                reversePolishNotation.addValue(ast.createNumberLiteral(token.text));
                return;
            case tokens.OP_LP:
                lexer.next();
                reversePolishNotation.addValue(this.expr(lexer));
                if (!consume(lexer, tokens.OP_RP)) {
                    throw new Error();
                }
                return;
            case tokens.OP_NOT:
                lexer.next();
                reversePolishNotation.addOperator(token, true);
                continue;
            case tokens.OP_ADD:
                lexer.next();
                token.id = tokens.OP_UNARY_PLUS;
                reversePolishNotation.addOperator(token, true);
                continue;
            case tokens.OP_SUB:
                lexer.next();
                token.id = tokens.OP_UNARY_MINUS;
                reversePolishNotation.addOperator(token, true);
                continue;
            case tokens.OP_INC:
                lexer.next();
                token.id = tokens.OP_INC_AND_GET;
                reversePolishNotation.addOperator(token, true);
                continue;
            case tokens.OP_DEC:
                lexer.next();
                token.id = tokens.OP_DEC_AND_GET;
                reversePolishNotation.addOperator(token, true);
                continue;
        }
        throw new Error();
    }
};

module.exports = Parser;
