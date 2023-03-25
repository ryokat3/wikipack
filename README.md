# Markdown All-in-One HTML

A portable HTML file to render the embedded Markdown without any preview applications/plugins.

## Usage

Copy the markdown-all-in-one.html file, and edit the Markdown
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
`#<text-color>[word1,word2,word3,...];%<background-color>[word4,word5,...];#....`.

``````````plaintext
```%yellow[foo,bar];#ff0000[baz,qux]
My name is foo, and
its name is bar.
```
``````````

will be rendered as

```html
<pre>
<code>
My name is <span style="background-color:yellow">foo</span>, and
its name is <span style="color:#ff0000">bar</span>.
</code>
</pre>
```

## Customize

In order to apply othor CSS on your preference, edit the template
HTML file, and generate new HTML file with other CSS inlined.

1. Download npm modules

   ```shell
   npm install
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

   ```shell
   npm run build
   ```
