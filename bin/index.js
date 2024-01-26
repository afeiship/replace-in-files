#!/usr/bin/env node

import { Command } from 'commander';
import { join } from 'path';
import { loadJsonFileSync } from 'load-json-file';
import fg from 'fast-glob';
import replaceInFile from 'replace-in-file';

import '@jswork/next-yaml-configuration';

const __dirname = new URL('../', import.meta.url).pathname;
const pkg = loadJsonFileSync(join(__dirname, 'package.json'));
const program = new Command();

program.version(pkg.version);
program.option('-c, --config', 'Config file path.', 'config.yaml').parse(process.argv);

/**
 * @help: rifc -h
 * @description: rifc -c
 */

class CliApp {
  constructor() {
    this.args = program.args;
    this.opts = program.opts();
    this.cfg = new nx.YamlConfiguration({
      path: join(__dirname, 'config.yaml'),
    });
  }

  getFiles() {
    const globs = this.cfg.get('files') || '*';
    return fg.glob.sync(globs);
  }

  getReplacements() {
    return this.cfg.get('replacements');
  }

  run() {
    // 1. get files
    const files = this.getFiles();
    // 2. replace by replacement
    const replacements = this.getReplacements();

    // 3. do replace
    replacements.forEach((replacement) => {
      console.log(files, replacement);
      // replaceInFile({
      //   files,
      //   ...replacement,
      // });
    });
  }
}

new CliApp().run();
