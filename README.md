# WikiPack

A portable HTML file to pack markdown, image, css, and any data files into itself.

## Usage

1. Open [the HTML file](https://ryokat3.github.io/wikipack/)

2. Drag-and-drop the directory (not a file [^1]) holding your markdown and image files

3. Select 'Pack...' from the pull-down menu, then all files under the directory will be packed in a single HTML file.

4. Open the saved HTML file. You can find that the saved HTML file packs all your markdown and image files.
   You can transfer it to anyone as a file, as an attachment of mail, via file server, memory device etc.

## CSS

CSS files in the same directory and 'css' sub-directory of the markdown file will be loaded and applied.

### Default CSS

- __Markdown CSS__ : [GitHub Flavoured](https://github.com/sindresorhus/github-markdown-css)
- __Code Highlight CSS__ : [highlight.js](https://github.com/highlightjs/highlight.js/)

## Extended Markdown Syntax

### Keywords Highlight

Any keywords can be highlighed with a special language name like

`#<text-color>[word1,word2,word3,...];%<background-color>[word4,word5,...];#....`.

``````````plaintext
```#blue[text-blue,foo];#dc143c[text-#dc143c,bar];%yellow[background-yellow,baz];%7fff00[background-#7fff00]
text-blue
text-#dc143c
background-yellow
background-#7fff00
```
``````````

will be rendered as

```html
<pre>
   <code class="language-#blue[text-blue,foo];#dc143c[text-#dc143c,bar];%yellow[background-yellow,baz];%7fff00[background-#7fff00]">
   <pre>
      <code>
         <span style="color:blue">text-blue</span>
         <span style="color:#dc143c">text-#dc143c</span>
         <span style="background-color:yellow">background-yellow</span>
         <span style="background-color:#7fff00">background-#7fff00</span></code></pre>
      </code>
   </pre>
</pre>
```

[^1]: No reference image will be displayed if a markdown file (not directory) is drag-and-dropped