# js-components
object model for abstraction from DOM / HTML

**Status:** *work in progress*

## Roadmap

1. ~~lexer~~
2. parser
3. component compilation

## TODO: Features

1. CSS: unique class names for component classes (```css .some-class { /* ... */ }``` -> ```css .login_form_class_some-class { /* ... */ }```)
2. CSS: unique class names for component tags (```css form { /* ... */ }``` -> ```css .login_form_tag_form { /* ... */ }```)
3. CSS: unique class names for component IDs (```css #username { /* ... */ }``` -> ```css .login_form_id_username { /* ... */ }```)
4. CSS: obfuscation / minification for classes (```.login_form_class_some-class``` -> ```.q9```)
5. CSS: LESS support
6. safe HTML via function call (```div = html(someHtml)```)
7. concat text with html via function call (```div= concat(html("<b>"), "some bold text", html("</b>"))```)
8. ```update()``` method for component
9. auto-update for component [via properties observation] (asap)
10. enhanced events ("change" event will be triggered without focus change from input)
11. getter / setter generation for component properties
12. CSS: themes support
