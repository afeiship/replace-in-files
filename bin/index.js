#!/usr/bin/env node

import { Command } from 'commander';
import { join } from 'path';
import { loadJsonFileSync } from 'load-json-file';
import fg from 'fast-glob';
import fs from 'node:fs';
import replaceInFile from 'replace-in-file';

import '@jswork/next-yaml-configuration';

const __dirname = new URL('../', import.meta.url).pathname;
const pkg = loadJsonFileSync(join(__dirname, 'package.json'));
const program = new Command();
const initConfigFile = join(__dirname, 'config.init.yaml');

program.version(pkg.version);
program
  .option('-i, --init', 'Init config file.', false)
  .option('-c, --config', 'Config file path.', 'config.yaml')
  .option('-v, --verbose', 'Verbose mode.', false)
  .parse(process.argv);

/**
 * @help: rifc -h
 * @description: rifc -c
 */

class CliApp {
  constructor() {
    this.args = program.args;
    this.opts = program.opts();
    this.cfg = new nx.YamlConfiguration({
      path: join(process.cwd(), this.opts.config),
    });
  }

  getFiles() {
    const globs = this.cfg.get('files') || '*';
    return fg.glob.sync(globs);
  }

  getReplacements() {
    return this.cfg.get('replacements');
  }

  cmdReplace() {
    const { verbose } = this.opts;
    // 1. get files
    const files = this.getFiles();
    // 2. replace by replacement
    const replacements = this.getReplacements();

    // 3. do replace
    for (let replacement of replacements) {
      replaceInFile({
        files,
        ...replacement,
      }).then((results) => {
        if (verbose) console.log('⚡️Replacement results:', results);
      });
    }
  }

  cmdInit() {
    const { init, verbose } = this.opts;
    if (!init) return;
    fs.copyFileSync(initConfigFile, this.opts.config);
    if (verbose) console.log('⚡️Init config file:', this.opts.config);
  }

  run() {
    this.cmdInit();
    this.cmdReplace();
  }
}

new CliApp().run();
