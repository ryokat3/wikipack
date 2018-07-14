# Inline Markdown

A portable HTML file to render the embedded Markdown without any preview applications/plugins.

## Usage

Copy the inline_markdown.html file, and edit the Markdown
between `<script type="text/template" id="markdown">`
and `</screen>` at the top.

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<script type="text/template" id="markdown">

# Write your Markdown here !!

</script>
```

## Keywords Highlight

A code block is highlighted by [highlight.js](https://highlightjs.org/).
Other than the languages supported by [highlight.js](https://highlightjs.org/),
any keywords can be highlighed with a special language name like
`%[word1,word2,word3,...],#[word4,word5,...]`.


``````````
```%[foo,bar],#[baz,qux]
My name is foo, and
its name is bar.
```
``````````

will be rendered as

```
<pre>
<code>
My name is <span class="hljs-name">foo</span>, and
its name is <span class="hljs-name">bar</span>.
</code>
</pre>
```

## Customize

In order to apply othor CSS on your preference, edit the template
HTML file, and generate new HTML file with other CSS inlined.

1. Download npm modules
   ```
   $ npm install
   ```

2. Edit the HTML template
   In order to apply anothor CSSes on your preference, edit `html/template.html`.

   ```html
   <link inline rel="stylesheet" href="../node_modules/highlight.js/styles/monokai.css"/>
   <link inline rel="stylesheet" href="github.css"/>
   ```

   [MarkedCustomStyles](https://github.com/ttscoff/MarkedCustomStyles) provides
   excellent CSSes that can be used for 'marked' HTML files.
   

3. Generate new HTML file
   ```
   $ npm run build
   ```