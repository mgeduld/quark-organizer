const { JSDOM } = require("jsdom");
const promisify = require("fs-promisify");
const fs = require("fs-extra");
const shortid = require("shortid");
const progress = require("cli-progress");
const normalizePath = require('normalize-path');
const path = require('path');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const [_, __, quarkivePath, outputDirName = __dirname + "/quarkive", quarkiveAssetsPath] = process.argv;
const outputDir = normalizePath(outputDirName);

if (!quarkivePath) {
  throw new Error('You must specify the path to a source file, e.g. ./quarkive.html');
}

const getHtml = ({ id, link, title, date, epoch }, content) =>
  `<!DOCTYPE HTML>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <link rel="stylesheet" type="text/css" href="answer.css"> 
    <title>${title}</title>
    </head>
  <body>
    <div class='quark_answer answer_${id}'>
      <div class='quark_id'>${id}</title>
      <div class='quark_title'>${title}</title>
      <div class='quark_link'><a href="${link}">[quora]</a></title>
      <div class='quark_date'>${date}</title>
      <div class='quark_epoch'>${epoch}</title>
      <div class='quark_content'>${content}</div>
    </div>
  </body>
</html>`;


const getAnswers = async () => {
  console.log('Parsing answers. Please be patient ...');
  const data = await readFile(quarkivePath, "utf8");
  const dom = new JSDOM(data);
  const answers = Array.from(
    dom.window.document.querySelectorAll(".quark_answer")
  );
  console.log(answers.length + ' answers parsed.');
  return answers;
};

const initStatusMessage = (max) => {
  var bar = new progress.Bar({}, progress.Presets.shades_classic);
  bar.start(max, 0);
  return bar;
}

const processAnswer = (toc, bar) => async (answer, index) => {
  const id = shortid.generate();
  const link = answer.dataset["quark_link"];
  const date = answer.querySelector(".quark_date").textContent;
  const epoch = new Date(date).getTime();
  const title = answer.querySelector(".quark_title").textContent;
  const content = answer.querySelector(".quark_content");
  const record = { id, link, date, epoch, title };
  toc.push(record);
  await writeFile(
    outputDir + "/quarkive/answers/" + id + ".html",
    getHtml(record, content.innerHTML)
  );
};

const init = async () => {
  const answers = await getAnswers();
  const totalAnswers = answers.length;
  // chmod?
  fs.mkdirSync(outputDir + '/quarkive', () => { });
  fs.mkdirSync(outputDir + '/quarkive/answers', () => { });
  const toc = [];
  const bar = initStatusMessage(totalAnswers);
  let counter = 0;
  while (counter < totalAnswers) {
    await processAnswer(toc, bar)(answers[counter]);
    bar.increment();
    counter++;
  };
  bar.stop();
  await writeFile(
    outputDir + "/quarkive/answers.js",
    "var data = " + JSON.stringify(toc)
  );
  console.log('quarkive dir created at. Open', outputDir + '/quarkive/index.html');
  fs.copySync(path.resolve(__dirname, './index.html'), outputDir + '/quarkive/index.html');
  fs.copySync(path.resolve(__dirname, './main.css'), outputDir + '/quarkive/main.css');
  fs.copySync(path.resolve(__dirname, './answer.css'), outputDir + '/quarkive/answers/answer.css');
  if (quarkiveAssetsPath) {
    const assetsPath = normalizePath(quarkiveAssetsPath);
    const pathParts = assetsPath.split(path.sep);
    const lastPart = pathParts[pathParts.length - 1];
    fs.copySync(path.resolve(assetsPath + '/'), outputDir + '/quarkive/answers/' + lastPart);
  }
  process.exit()
};

init();
