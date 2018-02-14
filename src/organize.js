const { JSDOM } = require("jsdom");
const promisify = require("fs-promisify");
const fs = require("fs-extra");
const progress = require("cli-progress");
const normalizePath = require("normalize-path");
const path = require("path");
const { getHtml } = require("./answer-html");
const loki = require("lokijs");

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const [_, __, quarkivePath, outputDirName = __dirname + "/quarkive", quarkiveAssetsPath] = process.argv;
const outputDir = normalizePath(outputDirName);
let answerCounter = 0;

if (!quarkivePath) {
  throw new Error("You must specify the path to a source file, e.g. ./quarkive.html");
}

const getAnswers = async () => {
  console.log("Parsing answers. Please be patient ...");
  const dom = await JSDOM.fromFile(quarkivePath);
  const answers = Array.from(
    dom.window.document.querySelectorAll(".quark_answer")
  );
  console.log(answers.length + " answers parsed.");
  return answers;
};

const initStatusMessage = (max) => {
  var bar = new progress.Bar({}, progress.Presets.shades_classic);
  bar.start(max, 0);
  return bar;
}

const getAnswerParts = (answer) => {
  const link = answer.dataset["quark_link"];
  const date = answer.querySelector(".quark_date").textContent;
  const epoch = new Date(date).getTime();
  const title = answer.querySelector(".quark_title").textContent;
  const id = title.replace(/\s/g, "_").replace(/\W/g, "").replace(/_/g, "-");
  const content = answer.querySelector(".quark_content");
  return { id, link, date, epoch, title, content };
};

const addAnswerToDb = (answersCollection, record, epoch) => {
  answersCollection.insert(Object.assign({}, record, {
    date: epoch,
    display: true,
    favorite: false,
    topics: [],
    tags: []
  }));
};

const createAnswerFile = async (id, record, content) => {
  await writeFile(
    outputDir + "/quarkive/answers/" + id + ".html",
    getHtml(record, content.innerHTML)
  );
};

const processAnswer = async (toc, bar, answersCollection, answer) => {
  try {
    const { id, link, date, epoch, title, content } = getAnswerParts(answer);
    const record = { id, link, date, epoch, title };
    toc.push(record);
    addAnswerToDb(answersCollection, record, epoch);
    await createAnswerFile(id, record, content);
  } catch (e) { }
};

const makeDb = () => {
  const db = new loki(outputDir + "/quarkive/answers/answers.json");
  const answers = db.addCollection("answers");
  return [db, answers];
};

const makeDirectories = () => {
  fs.mkdirSync(outputDir + "/quarkive", () => { });
  fs.mkdirSync(outputDir + "/quarkive/answers", () => { });
};

const answersForEach = async (toc, bar, answersCollection, answers) => {
  const totalAnswers = answers.length;
  let counter = 0;
  for (let counter = 0, totalAnswers = answers.length; counter < totalAnswers; counter++) {
    await processAnswer(toc, bar, answersCollection, answers[counter]);
    bar.increment();
  }
};

const processAnswers = async (answers) => {
  const toc = [];
  const totalAnswers = answers.length;
  const [db, answersCollection] = makeDb();
  const bar = initStatusMessage(totalAnswers);
  await answersForEach(toc, bar, answersCollection, answers);
  db.save();
  bar.stop();
  return toc;
};

const writeAnswersFile = async (toc) => {
  await writeFile(
    outputDir + "/quarkive/answers.js",
    "var data = " + JSON.stringify(toc)
  );
};

const maybeCopyAssets = () => {
  if (quarkiveAssetsPath) {
    const assetsPath = normalizePath(quarkiveAssetsPath);
    const pathParts = assetsPath.split(path.sep);
    const lastPart = pathParts[pathParts.length - 1];
    fs.copySync(path.resolve(assetsPath + "/"), outputDir + "/quarkive/answers/" + lastPart);
  }
};

const copyAssets = () => {
  fs.copySync(path.resolve(__dirname, "./index.html"), outputDir + "/quarkive/index.html");
  fs.copySync(path.resolve(__dirname, "./main.css"), outputDir + "/quarkive/main.css");
  fs.copySync(path.resolve(__dirname, "./answer.css"), outputDir + "/quarkive/answers/answer.css");
  fs.copySync(path.resolve(__dirname, "./answer-script.js"), outputDir + "/quarkive/answers/answer-script.js");
  maybeCopyAssets();
};

const init = async () => {
  makeDirectories();
  const answers = await getAnswers();
  const toc = await processAnswers(answers);
  await writeAnswersFile(toc);
  copyAssets();
  console.log("quarkive directory created. Open", outputDir + "/quarkive/index.html");
  process.exit();
};

init();
