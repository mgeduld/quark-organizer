# quark-organizer

Quark organizer is a companion app to (https://ominax.com/quark)[quark], a Quora content-downloader, which bundles all of your answers into a single html file.

Quora organizers splits that file up into separate files--one for each answer. It also creates another a table-of-contents document that links to all the answers.

Note: this is an early draft. It's currently only works as a command-line node application. Future plans include making a more user-friendly version with a graphical user interface. 

## installation

1. install (https://nodejs.org/en/)[node].
1. clone this repo: `git clone https://github.com/mgeduld/quark-organizer`
1. cd into the repo and run `npm install`

## suggestion

If you have images in your answers, they'll still be stored on Quora's servers. To archive them on your computer, open quarkive.html in your browser and choose File > Save. 

In Chrome, this will save a directory called `quarkive_files` along with another copy of th quarkive.html. The `quarkive_files` director will contain all your images.

Most other browsers will behave simularly.

## usage

cd into the repo and then run the following command:

`node src/organize PATH-TO-QUARKIVE OUTPUT-PATH`

PATH-TO_ARCHIVE is the the path to the quarkive.html file that was created by quark.

OUTPUT-PATH is where you'd like the new files to be stored. It should be a directory, such as `~/Desktop`. Quark Organizer will create a sub-directory there called `quarkive`, where it will store all the files it creates. 

Example: `node src/organize ~/Downloads/quarkive.html ~/Desktop`

When Quark Organizer is done running, you can view the contents by opening `OUTPUT-PATH/quarkive/index.html` in your browser. 

Note: if you've saved a `quarkive_files` directory (see `suggestion`, above), you can ask Quork Organizer to copy it into the output directory for you, so that all your answer image links will still work. Just add a path to the `quarkive_files` directory as a third parameter:

`node src/organize PATH-TO-QUARKIVE OUTPUT-PATH ASSETS_PATH`

Example: `node src/organize ~/Downloads/quarkive.html ~/Desktop ~/Downloads/quarkive_files`

If you forget to do this, you can fix your image links by manually copying the entire `quarkive_files` directory into `OUTPUT-PATH/quarkive/answers`

## customization

The table-of-contents file is styled by `OUTPUT-PATH/quarkive/main.css` and the answers are styled by `OUTPUT-PATH/quarkive/answers/answer.css`. You can edit these files to change look of the TOC and the answers.

The answers use `src/answer-html` as their page template. And the toc (`index.html`) uses `src/index.html.`

If you've already run Quark Organizer, it's too late to edit `answer-html`. If you've made changes, you'll have to run Quark Organizer again. 

## removing answers

The TOC file (`index.html`) uses `OUTPUT-PATH/quarkive/answers.js` as its database. This is a javascript file that is mostly JSON. You can carefully edit it to remove answers from the TOC or to rename them.
