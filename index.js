// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const coin = ()=>{
    return Math.random() < 0.5;
};
const __int = (low, high)=>{
    const min = Math.ceil(low);
    const max = Math.floor(high);
    return Math.floor(Math.random() * (max - min + 1) + min);
};
const rgb = (low = 0, high = 255)=>{
    const r = __int(low, high);
    const g = __int(low, high);
    const b = __int(low, high);
    return {
        r,
        g,
        b
    };
};
const color = (low = 0, high = 255)=>{
    const { r , g , b  } = rgb(low, high);
    return `rgb(${r}, ${g}, ${b})`;
};
const element = (array)=>{
    const high = array.length - 1;
    const index = __int(0, high);
    return array[index];
};
const __default = {
    coin,
    int: __int,
    rgb,
    color,
    element
};
let data = [];
let resolvePreWarm = ()=>{};
const preWarmPromise = new Promise((resolve)=>{
    resolvePreWarm = resolve;
});
const preWarm = async ()=>{
    const url1 = "https://openaccess-api.clevelandart.org/api/artworks?has_image=1&cc0=1";
    console.log("Fetching", url1);
    const response = await fetch(url1);
    const json = await response.json();
    data = json.data.filter((work)=>{
        const { images: { web  }  } = work;
        return web?.url !== undefined;
    });
    console.log("CLE pre-warm complete");
    resolvePreWarm();
};
const makeGenerator = async function*() {
    await preWarmPromise;
    const unusedData = [
        ...data
    ];
    while(true){
        if (unusedData.length === 0) {
            unusedData.push(...data);
        }
        const index = __default.int(0, unusedData.length - 1);
        const [work] = unusedData.splice(index, 1);
        const { title , creators , copyright , url: url2 , images ,  } = work;
        let credit = title;
        if (creators.length > 0) {
            const creatorDescriptions = [];
            for (const { description  } of creators){
                if (description !== undefined && description !== null && description.length > 0) {
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
        const source = `${credit}${url2}`;
        yield {
            url: images.web.url,
            source
        };
    }
};
const generator = makeGenerator();
const __default1 = {
    generator,
    preWarm
};
let objectIDs = [];
let resolvePreWarm1 = ()=>{};
const preWarmPromise1 = new Promise((resolve)=>{
    resolvePreWarm1 = resolve;
});
const preWarm1 = async ()=>{
    const url3 = "https://collectionapi.metmuseum.org/public/collection/v1/search?q=%27%27&hasImages=true";
    console.log("Fetching", url3);
    const response = await fetch(url3);
    const json = await response.json();
    objectIDs = json.objectIDs;
    console.log("MET pre-warm complete");
    resolvePreWarm1();
};
const makeGenerator1 = async function*() {
    await preWarmPromise1;
    const unusedObjectIDs = [
        ...objectIDs
    ];
    while(true){
        if (unusedObjectIDs.length === 0) {
            unusedObjectIDs.push(...objectIDs);
        }
        const index = __default.int(0, unusedObjectIDs.length - 1);
        const [objectID] = unusedObjectIDs.splice(index, 1);
        const url4 = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`;
        console.log("Fetching", url4);
        const response = await fetch(url4);
        const json = await response.json();
        const { title , artistDisplayName , creditLine , primaryImageSmall , isPublicDomain , rightsAndReproduction , linkResource , objectURL ,  } = json;
        if (isPublicDomain !== true) {
            console.log("Not public domain", json);
            continue;
        }
        if (primaryImageSmall === undefined || primaryImageSmall.length === 0) {
            continue;
        }
        let source = `${title}`;
        if (artistDisplayName !== undefined && artistDisplayName !== null && artistDisplayName.length > 0) {
            source += `, by ${artistDisplayName}`;
        }
        source += ". ";
        if (creditLine !== undefined && creditLine !== null && creditLine.length > 0) {
            source += `${creditLine}. `;
        }
        if (rightsAndReproduction !== undefined && rightsAndReproduction !== null && rightsAndReproduction.length > 0) {
            source += ` ${rightsAndReproduction}. `;
        }
        let referenceURL = linkResource;
        if (linkResource === undefined || linkResource === null || linkResource.length === 0) {
            referenceURL = objectURL;
        }
        source += referenceURL;
        yield {
            url: primaryImageSmall,
            source
        };
    }
};
const generator1 = makeGenerator1();
const __default2 = {
    generator: generator1,
    preWarm: preWarm1
};
const sources = [
    __default1,
    __default2, 
];
const halfCacheSize = 20 / 2;
const url = `https://poetrydb.org/random/${20}/author,title,lines.json`;
const underscore = /_([^_]+)_/g;
const regexes = [
    /^[.,;:-]+/,
    /[.,;:-]+$/,
    /^['"]+/,
    /['"]+$/, 
];
const cachedPoems = [];
const cachePoems = async ()=>{
    console.log("Fetching", url);
    const response = await fetch(url);
    const poems = await response.json();
    cachedPoems.push(...poems);
};
const preWarm2 = cachePoems;
const makeGenerator2 = async function*() {
    while(true){
        const { length  } = cachedPoems;
        if (length < halfCacheSize) {
            if (length === 0) {
                await cachePoems();
            } else {
                cachePoems();
            }
        }
        const poem = cachedPoems.shift();
        const { author , title , lines  } = poem;
        let line = "";
        do {
            line = __default.element(lines);
            line = line.trim();
            for (const regex of regexes){
                line = line.replace(regex, "");
            }
        }while (line === "")
        line = line.replace(underscore, (_, inner)=>{
            return `<em>${inner}</em>`;
        });
        yield {
            text: line,
            source: `${title}, by ${author}. https://poetrydb.org`
        };
    }
};
const generator2 = makeGenerator2();
const __default3 = {
    generator: generator2,
    preWarm: preWarm2
};
const sources1 = [
    __default3, 
];
const sources2 = [
    ...sources,
    ...sources1, 
];
sources2.forEach((source)=>{
    const { preWarm: preWarm3  } = source;
    if (preWarm3 !== undefined) {
        preWarm3.call(source);
    }
});
const makeCombinedGenerator = async function*(sources11) {
    const generators1 = sources11.map((source)=>source.generator
    );
    while(true){
        const generator3 = __default.element(generators1);
        const content = await generator3.next();
        yield content.value;
    }
};
const generators = {
    image: makeCombinedGenerator(sources),
    text: makeCombinedGenerator(sources1)
};
const select = (selector)=>document.querySelector(selector)
;
const css = (element1, props)=>Object.assign(element1.style, props)
;
const ui = {
    grid: select("#grid"),
    box1: select("#box1"),
    box2: select("#box2"),
    text: select("#text"),
    image: select("#image"),
    info1: select("#box1 > .info"),
    info2: select("#box2 > .info"),
    start: select("#start")
};
const inLandscape = ()=>{
    const { clientWidth , clientHeight  } = document.body;
    return clientWidth > clientHeight;
};
const resizeImage = ()=>{
    const { image  } = ui;
    if (image === null) {
        return;
    }
    const { clientWidth , clientHeight  } = document.body;
    const landscape = inLandscape();
    const widthMultiplier = landscape ? 0.4 : 0.8;
    const heightMultiplier = landscape ? 0.8 : 0.4;
    const maxWidth = `${clientWidth * widthMultiplier}px`;
    const maxHeight = `${clientHeight * heightMultiplier}px`;
    css(image, {
        maxWidth,
        maxHeight
    });
};
const resize = ()=>{
    const { grid , box1 , box2  } = ui;
    const landscape = inLandscape();
    const height = landscape ? "100%" : "50%";
    const columnCount = landscape ? 2 : 1;
    css(grid, {
        columnCount
    });
    css(box1, {
        height
    });
    css(box2, {
        height
    });
    resizeImage();
};
const showNewImageContent = async (image, info)=>{
    const content = await generators.image.next();
    const { url: url5 , source  } = content.value;
    image.src = url5;
    info.onpointerup = (event)=>{
        event.stopPropagation();
        alert(source);
    };
};
const showNewTextContent = async (text, info)=>{
    const content = await generators.text.next();
    const { text: newText , source  } = content.value;
    text.innerHTML = newText;
    info.onpointerup = (event)=>{
        event.stopPropagation();
        alert(source);
    };
};
const showNewContent = ()=>{
    const { text , box1 , box2 , info1 , info2  } = ui;
    const image = document.createElement("img");
    const textOnTheLeft = __default.coin();
    const [textBox, imageBox] = textOnTheLeft ? [
        box1,
        box2
    ] : [
        box2,
        box1
    ];
    const [textInfo, imageInfo] = textOnTheLeft ? [
        info1,
        info2
    ] : [
        info2,
        info1
    ];
    text.textContent = "";
    textBox.classList.remove("image");
    textBox.classList.add("text");
    textBox.querySelector(".contents")?.replaceChildren(text);
    const imageContents = imageBox.querySelector(".contents");
    imageBox.classList.remove("text");
    imageBox.classList.add("image");
    imageContents.replaceChildren();
    const ellipsisTimeout = setTimeout(()=>{
        const ellipsis = document.createElement("h1");
        ellipsis.textContent = "...";
        imageContents.replaceChildren(ellipsis);
    }, 2000);
    image.onload = ()=>{
        clearTimeout(ellipsisTimeout);
        imageContents.replaceChildren(image);
        ui.image = image;
        resizeImage();
    };
    showNewImageContent(image, imageInfo).catch(console.error);
    showNewTextContent(text, textInfo).catch(console.error);
};
window.onkeyup = (event)=>{
    if (event.key.startsWith("Arrow")) {
        showNewContent();
    }
};
window.onpointerup = showNewContent;
const goToGitHub = (event)=>{
    event.stopPropagation();
    window.open("https://github.com/davidsteinberg/juxtapoetry", "_blank");
};
ui.info1.onpointerup = goToGitHub;
ui.info2.onpointerup = goToGitHub;
let resizeTimeoutId = null;
window.onresize = ()=>{
    if (resizeTimeoutId !== null) {
        clearTimeout(resizeTimeoutId);
    }
    resizeTimeoutId = setTimeout(resize, 100);
};
resize();
