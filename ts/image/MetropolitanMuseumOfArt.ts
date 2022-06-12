import { random } from "../deps.ts";

let objectIDs: number[] = [];

// Pre-warm
let resolvePreWarm: (value?: unknown) => void = () => {};
const preWarmPromise = new Promise((resolve) => {
  // Hold off on resolution
  // so we can ensure preWarm finishes before
  // the generator uses the `objectIDs` array
  resolvePreWarm = resolve;
});

const preWarm = async () => {
  // Only fetch works that have an image
  const url =
    "https://collectionapi.metmuseum.org/public/collection/v1/search?q=%27%27&hasImages=true";

  console.log("Fetching", url);

  const response = await fetch(url);
  const json = await response.json();

  objectIDs = json.objectIDs;

  console.log("MET pre-warm complete");

  // Resolve, so generator can start yielding
  resolvePreWarm();
};

// Generator
const makeGenerator = async function* () {
  // Wait for pre-warm
  await preWarmPromise;

  // Set up object ids
  const unusedObjectIDs = [...objectIDs];

  while (true) {
    // Allow any object id once all have been used
    if (unusedObjectIDs.length === 0) {
      unusedObjectIDs.push(...objectIDs);
    }

    // Pick/remove a random object id from the list
    const index = random.int(0, unusedObjectIDs.length - 1);
    const [objectID] = unusedObjectIDs.splice(index, 1);

    // Fetch the object's data
    const url =
      `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`;

    console.log("Fetching", url);

    const response = await fetch(url);
    const json = await response.json();
    const {
      title,
      artistDisplayName,
      creditLine,
      primaryImageSmall,
      isPublicDomain,
      rightsAndReproduction,
      linkResource,
      objectURL,
    } = json;

    // Only use works in the public domain
    if (isPublicDomain !== true) {
      console.log("Not public domain", json);
      continue;
    }

    // If there is no small image to show, fetch again
    if (primaryImageSmall === undefined || primaryImageSmall.length === 0) {
      continue;
    }

    // Build source from title, artist name, credit, rights, and ref url
    let source = `${title}`;

    if (
      artistDisplayName !== undefined && artistDisplayName !== null &&
      artistDisplayName.length > 0
    ) {
      source += `, by ${artistDisplayName}`;
    }

    source += ". ";

    if (
      creditLine !== undefined && creditLine !== null && creditLine.length > 0
    ) {
      source += `${creditLine}. `;
    }

    if (
      rightsAndReproduction !== undefined && rightsAndReproduction !== null &&
      rightsAndReproduction.length > 0
    ) {
      source += ` ${rightsAndReproduction}. `;
    }

    let referenceURL = linkResource;
    if (
      linkResource === undefined || linkResource === null ||
      linkResource.length === 0
    ) {
      referenceURL = objectURL;
    }

    // Yield the image content
    yield {
      url: primaryImageSmall,
      source: {
        url: referenceURL,
        details: source,
      },
    };
  }
};

const generator = makeGenerator();

export default { generator, preWarm };
