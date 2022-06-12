import imageSources from "./image/mod.ts";
import textSources from "./text/mod.ts";
import { random } from "./deps.ts";

// Pre warm sources
type Source = {
  generator: Generator | AsyncGenerator;
  preWarm?(): void;
};

const sources: Source[] = [
  ...imageSources,
  ...textSources,
];

sources.forEach((source) => {
  const { preWarm } = source;
  if (preWarm !== undefined) {
    preWarm.call(source);
  }
});

// Combine source generators
const makeCombinedGenerator = async function* (sources: Source[]) {
  const generators = sources.map((source) => source.generator);

  while (true) {
    const generator = random.element(generators);
    const content = await generator.next();

    yield content.value;
  }
};

const generators = {
  image: makeCombinedGenerator(imageSources),
  text: makeCombinedGenerator(textSources),
};

// UI
const select = (selector: string) =>
  document.querySelector(selector) as HTMLElement;
const css = (element: HTMLElement, props: Record<string, string | number>) =>
  Object.assign(element.style, props);

const ui = {
  grid: select("#grid"),
  box1: select("#box1"),
  box2: select("#box2"),
  text: select("#text"),
  image: select("#image"),
  info1: select("#box1 > .info"),
  info2: select("#box2 > .info"),
  start: select("#start"),
  modal: select("#modal"),
  modalBody: select("#modal > .body"),
  modalClose: select("#modal > .close"),
};

const inLandscape = () => {
  const { clientWidth, clientHeight } = document.body;
  return clientWidth > clientHeight;
};

const resizeImage = () => {
  const { image } = ui;
  if (image === null) {
    return;
  }

  // Make sure image fits within its box
  const { clientWidth, clientHeight } = document.body;
  const landscape = inLandscape();
  const widthMultiplier = landscape ? 0.4 : 0.8;
  const heightMultiplier = landscape ? 0.8 : 0.4;
  const maxWidth = `${clientWidth * widthMultiplier}px`;
  const maxHeight = `${clientHeight * heightMultiplier}px`;

  css(image, { maxWidth, maxHeight });
};

const resize = () => {
  // Left and right in landscape
  // Top and bottom in portrait
  const { grid, box1, box2 } = ui;
  const landscape = inLandscape();
  const height = landscape ? "100%" : "50%";
  const columnCount = landscape ? 2 : 1;

  css(grid, { columnCount });
  css(box1, { height });
  css(box2, { height });

  resizeImage();
};

const showNewImageContent = async (
  image: HTMLImageElement,
  info: HTMLElement,
) => {
  const content = await generators.image.next();
  const { url, source } = content.value;

  image.src = url;

  info.onpointerup = (event) => {
    event.stopPropagation();
    alert(source);
  };
};

const showNewTextContent = async (text: HTMLElement, info: HTMLElement) => {
  const content = await generators.text.next();
  const { text: newText, source } = content.value;

  text.innerHTML = newText;

  info.onpointerup = (event) => {
    event.stopPropagation();
    alert(source);
  };
};

const showNewContent = () => {
  const { text, box1, box2, info1, info2 } = ui;
  // Create a new img element
  // to avoid corrupt/truncated issue with loading new src
  const image = document.createElement("img");
  // Pick sides
  const textOnTheLeft = random.coin();
  const [textBox, imageBox] = textOnTheLeft ? [box1, box2] : [box2, box1];
  const [textInfo, imageInfo] = textOnTheLeft ? [info1, info2] : [info2, info1];

  text.textContent = "";

  // Prep text side
  textBox.classList.remove("image");
  textBox.classList.add("text");
  textBox.querySelector(".contents")?.replaceChildren(text);

  // Prep image side, showing an ellipsis while loading
  const imageContents = imageBox.querySelector(".contents")!;

  imageBox.classList.remove("text");
  imageBox.classList.add("image");
  imageContents.replaceChildren();

  const ellipsisTimeout = setTimeout(() => {
    const ellipsis = document.createElement("h1");
    ellipsis.textContent = "...";
    imageContents.replaceChildren(ellipsis);
  }, 2000);

  // Only show image once it has loaded,
  // to make sure it is sized properly
  // and won't "snap" between dimensions
  image.onload = () => {
    clearTimeout(ellipsisTimeout);
    imageContents.replaceChildren(image);
    ui.image = image;
    resizeImage();
  };

  // Fetch and insert content
  showNewImageContent(image, imageInfo).catch(console.error);
  showNewTextContent(text, textInfo).catch(console.error);
};

// Show new content on tap/click or arrow press
window.onkeyup = (event) => {
  if (event.key.startsWith("Arrow")) {
    showNewContent();
  }
};

window.onpointerup = showNewContent;

// Before content has loaded, the info buttons
// should show an about modal
const showAbout = (event: Event) => {
  event.stopPropagation();
  ui.modal.classList.remove("hidden");
};

ui.info1.onpointerup = showAbout;
ui.info2.onpointerup = showAbout;

// Don't cause new content to be fetched/shown
// when tapping on things in the modal
ui.modal.onpointerup = (event) => {
  event.stopPropagation();
};

// Hide the modal when close is pressed
ui.modalClose.onpointerup = () => {
  ui.modal.classList.add("hidden");
};

// Resize (coalesced) when the page is resized
let resizeTimeoutId: number | null = null;

window.onresize = () => {
  if (resizeTimeoutId !== null) {
    clearTimeout(resizeTimeoutId);
  }

  resizeTimeoutId = setTimeout(resize, 100);
};

resize();
