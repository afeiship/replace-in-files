#!/usr/bin/env node

import { Command } from 'commander';
import { join } from 'path';
import { loadJsonFileSync } from 'load-json-file';
import fg from 'fast-glob';
import fs from 'node:fs';
import replaceInFile from 'replace-in-file';

import '@jswork/next-yaml-configuration';
import '@jswork/next-literal-tmpl';

const __dirname = new URL('../', import.meta.url).pathname;
const env = process.env;
const pkg = loadJsonFileSync(join(__dirname, 'package.json'));
const program = new Command();
const initConfigFile = join(__dirname, 'config.init.yaml');

program.version(pkg.version);
program
  .option('-i, --init', 'Init config file.', false)
  .option('-f, --force', 'Force init config file.', false)
  .option('-c, --config', 'Config file path.', 'rif.config.yaml')
  .option('-v, --verbose', 'Verbose mode.', false)
  .parse(process.argv);

/**
 * @help: rifc -h
 * @description: rifc -c
 */

class CliApp {
  get configFile() {
    return join(process.cwd(), this.opts.config);
  }

  constructor() {
    this.args = program.args;
    this.opts = program.opts();
    this.context = { pkg, env };
  }

  getFiles() {
    const globs = this.cfg.get('files') || '*';
    return fg.glob.sync(globs);
  }

  getReplacements() {
    return this.cfg.get('replacements');
  }

  async cmdReplace() {
    const { init, verbose } = this.opts;
    if (init) return;
    // 0. load config
    this.cfg = this.cfg || new nx.YamlConfiguration({ path: this.configFile });
    // 1. get files
    const files = this.getFiles();
    // 2. replace by replacement
    const replacements = this.getReplacements();
    // 3. do replace
    for (let replacement of replacements) {
      let { from ,to } = replacement;
      if(!to && from.includes('${')) to = nx.literalTmpl(from, this.context);
      const options = { files, from, to };
      await replaceInFile(options).then((results) => {
        if (verbose) console.log('⚡️Replacement results:', results);
      });
    }
  }

  cmdInit() {
    const { init, force, verbose } = this.opts;
    if (!init) return;
    const dest = join(process.cwd(), this.opts.config);
    const shouldInit = !fs.existsSync(dest) || force;
    if (shouldInit) {
      fs.copyFileSync(initConfigFile, dest);
      if(verbose) console.log('✅ Init config file:', this.opts.config);
    } else {
      if(verbose) console.log('😂 Config file exists, please use -f option.');
    }
  }

  async run() {
    this.cmdInit();
    await this.cmdReplace();
  }
}

new CliApp().run();
