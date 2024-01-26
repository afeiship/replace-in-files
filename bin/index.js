#!/usr/bin/env node

import { Command } from 'commander';
import { join } from 'path';
import { loadJsonFileSync } from 'load-json-file';

const __dirname = new URL('../', import.meta.url).pathname;
const pkg = loadJsonFileSync(join(__dirname, 'package.json'));
const program = new Command();

program.version(pkg.version);
program.option('-f, --force', 'force to create').parse(process.argv);

/**
 * @help: rifc -h
 * @description: rifc -f
 */

class CliApp {
  constructor() {
    this.args = program.args;
    this.opts = program.opts();
  }

  run() {
    console.log('run cli: ', __dirname, this.args, this.opts);
  }
}

new CliApp().run();
