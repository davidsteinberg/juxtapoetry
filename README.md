# Juxtapoetry

Juxtapoetry is a site that displays random images and texts next to each other,
allowing the viewer's brain to [construct a connecting narrative][1].

Tapping the `i` icons in the lower corners presents information about a text or
image's source, including a title and URL where the content was received.
Tapping any other part of the page flips to the next random content.

### Content sources

By default, images are fetched from the [Cleveland Museum of Art][2] and
[Metropolitan Museum of Art][3]'s APIs, and text is fetched from the
[Poetry DB][4] API.

The architecture allows for simple addition of new sources:

1. Add a TypeScript/JavaScript file under the `ts/image` or `ts/text`
   directories, e.g. `ts/text/MyNewTextSource.ts`.

2. In the file, export a default object that has these properties:

- A `generator` (async or not) that infinitely yields objects of the appropriate
  type:
  ```ts
  type ImageContent = {
    url: string;
    source: Source;
  };

  type TextContent = {
    text: string;
    source: Source;
  };

  type Source = {
    url: string;
    details: string;
  };
  ```
- An optional `preWarm` function, called when the page loads, that allows
  sources to preemptively perform work needed for later content generation -
  e.g. to fetch a set of identifiers that will be used in later fetches for the
  source. See the `ts/image` sources for examples.

3. Import and add the source to the exported list in the relevant
   `ts/image/mod.ts` or `ts/text/mod.ts`.

Here is a complete example of creating/adding a new text source:

```ts
// ts/text/MyTextSource.ts

const makeGenerator = function* () {
  while (true) {
    yield {
      text: "My Text",
      source: {
        url: "http://localhost:8000",
        details: "Sample text used in my source",
      },
    };
  }
};

const generator = makeGenerator();

export default { generator };
```

```ts
// ts/text/mod.ts

...
import MyTextSource from "./MyTextSource.ts";

const sources = [
  ...
  MyTextSource,
];

export default sources;
```

### Bundling

The site's script, `index.js`, is bundled from the TypeScript source in the `ts`
directory using this command:

`deno bundle ts/index.ts index.js`

The `deno.json` file is implicitly required, as it specifies dom-related
libraries to use when bundling.

### Future directions

1. Create new image and text sources, e.g. more museums and poetry, memes,
   quotes, etc. Users could conceivably be able to choose sources before content
   is generated.

2. The screen's halves could be treated as blank canvases that a source uses to
   present content, e.g. an image source would produce an `<img>` element. New
   source types could be added, such as video, without needing to update
   `index.ts`.

[1]: https://en.wikipedia.org/wiki/Apophenia
[2]: https://openaccess-api.clevelandart.org
[3]: https://metmuseum.github.io
[4]: https://poetrydb.org/index.html
