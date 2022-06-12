import { random } from "../deps.ts";

// Relevant sub-shape of objects API returns
type Work = {
  title: string;
  copyright: string;
  creators: { description: string }[];
  url: string;
  images: {
    web: {
      url: string;
    };
  };
};

let data: Work[] = [];

// Pre-warm
let resolvePreWarm: (value?: unknown) => void = () => {};
const preWarmPromise = new Promise((resolve) => {
  // Hold off on resolution
  // so we can ensure preWarm finishes before
  // the generator uses the `data` array
  resolvePreWarm = resolve;
});

const preWarm = async () => {
  // Only fetch works that have an image and are under CC0
  const url =
    "https://openaccess-api.clevelandart.org/api/artworks?has_image=1&cc0=1";

  console.log("Fetching", url);

  const response = await fetch(url);
  const json = await response.json();

  data = json.data.filter((work: Work) => {
    // Only keep works that have a web image url
    const { images: { web } } = work;
    return web?.url !== undefined;
  });

  console.log("CLE pre-warm complete");

  // Resolve, so generator can start yielding
  resolvePreWarm();
};

// Generator
const makeGenerator = async function* () {
  // Wait for pre-warm
  await preWarmPromise;

  // Set up data
  const unusedData = [...data];

  while (true) {
    // Allow any work once all have been used
    if (unusedData.length === 0) {
      unusedData.push(...data);
    }

    // Pick/remove a random work from the list
    const index = random.int(0, unusedData.length - 1);
    const [work] = unusedData.splice(index, 1);
    const {
      title,
      creators,
      copyright,
      url,
      images,
    } = work;

    // Build credit from title, creators, and copyright
    let credit = title;

    if (creators.length > 0) {
      const creatorDescriptions: string[] = [];
      for (const { description } of creators) {
        if (
          description !== undefined && description !== null &&
          description.length > 0
        ) {
          creatorDescriptions.push(description);
        }
      }

      if (creatorDescriptions.length > 0) {
        credit += `, by ${creatorDescriptions.join(", ")}`;
      }
    }

    credit += ". ";

    if (copyright !== undefined && copyright !== null && copyright.length > 0) {
      credit += `${copyright}. `;
    }

    // Yield the image content
    yield {
      url: images.web.url,
      source: {
        url,
        details: credit,
      },
    };
  }
};

const generator = makeGenerator();

export default { generator, preWarm };
