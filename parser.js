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
    while (token.id !== tokens.EOF) {
        statements.push(this.statement(lexer));
        token = lexer.peek();
    }
    return statements;
};

/**
 * TODO statement: tag_statement;
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
    this.tagContent(lexer, tag);
    return tag;
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
 * // TODO
 * @param {Lexer} lexer
 * @param {TagStatement} tag
 */
Parser.prototype.tagContent = function (lexer, tag) {
};

module.exports = Parser;