# Markdown All-in-One HTML

A portable HTML file to pack markdown, image, any data files into itself.

## Usage

1. Download [this HTML file](https://raw.githubusercontent.com/ryokat3/markdown-all-in-one-html/main/markdown-all-in-one.html)

2. Open the downloaded HTML file

3. Drag-and-drop the directory (not a file [^1]) holding your markdown and image files

4. Select 'Save as...' from the pull-down menu

5. Open the saved HTML file. You can find that the saved HTML file embeds all your markdown and image files.
   You can transfer it to anyone as a file, as an attachment of mail, via file server, memory device etc.


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