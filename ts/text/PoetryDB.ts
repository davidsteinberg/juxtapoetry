import { random } from "../deps.ts";

const cacheSize = 20;
const halfCacheSize = cacheSize / 2;
const url = `https://poetrydb.org/random/${cacheSize}/author,title,lines.json`;
const underscore = /_([^_]+)_/g;
const regexes = [
  /^[.,;:-]+/,
  /[.,;:-]+$/,
  /^['"]+/,
  /['"]+$/,
];

// Shape of objects API returns
type Poem = {
  author: string;
  title: string;
  lines: string[];
};

// Cache
const cachedPoems: Poem[] = [];
const cachePoems = async () => {
  console.log("Fetching", url);

  const response = await fetch(url);
  const poems = await response.json();

  cachedPoems.push(...poems);
};

// Pre-warm
const preWarm = cachePoems;

// Generator
const makeGenerator = async function* () {
  while (true) {
    // Keep the cache full as we use up poems
    const { length } = cachedPoems;
    if (length < halfCacheSize) {
      if (length === 0) {
        // If we were asked to generate so quickly that we're empty,
        // wait until we have poems to use, so we can yield content
        await cachePoems();
      } else {
        cachePoems();
      }
    }

    // Get the first poem
    const poem = cachedPoems.shift()!;
    const { author, title, lines } = poem;

    // Pick a random, non-empty line
    let line = "";
    do {
      line = random.element(lines);
      line = line.trim();

      for (const regex of regexes) {
        line = line.replace(regex, "");
      }
    } while (line === "");

    // Transform italics
    line = line.replace(underscore, (_, inner) => {
      return `<em>${inner}</em>`;
    });

    // Yield the text content
    yield {
      text: line,
      source: {
        url: "https://poetrydb.org",
        details: `Line from ${title}, by ${author}.`,
      },
    };
  }
};

const generator = makeGenerator();

export default { generator, preWarm };
