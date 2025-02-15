#!/usr/bin/env node
const path = require('path');
const minimist = require('minimist');
const chokidar = require('chokidar');
const { performance } = require('perf_hooks');

const readConfig = require('./src/readConfig');
const createConfig = require('./src/createConfig');
const run = require('./src/run');

const args = minimist(process.argv.slice(2), {
  alias: {
    root: 'r',
    config: 'c',
    output: 'o',
    name: 'n',
    script: 's',
    file: 'f',
    wait: 'w'
  }
});

const config = createConfig(
  readConfig(path.resolve(process.cwd(), (args.config || ''))) ||
  readConfig(path.resolve(process.cwd(), '.ticbundle.js')) ||
  readConfig(path.resolve(process.cwd(), '.ticbundle.json')) ||
  {}
);

const files = config.files.map(file => path.resolve(config.root, file));
const bundle = () => {
  const ts = performance.now();
  run(args, config);
  console.info(`Generated bundle in: ${Math.round(performance.now() - ts)}ms`);
};

chokidar
  .watch(files, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: args.wait || config.wait
    }
  })
  .on('ready', () => {
    console.group('[tic-bundle] watching files');
    files.forEach(file => console.info(file));
    console.groupEnd();

    bundle();
  })
  .on('add', bundle)
  .on('change', bundle);
