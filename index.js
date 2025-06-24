#!/usr/bin/env node
import { program } from 'commander';
import { analyzeCodebase } from './lib/analyze.js';
import dotenv from 'dotenv';

dotenv.config();

program
  .name('codebaseguardian')
  .description('AI-powered codebase analyzer using DeepSeek on OpenRouter')
  .version('0.1.0');

program
  .command('analyze <file>')
  .description('Analyze a specific code file')
  .action(async (file) => {
    await analyzeCodebase(file);
  });

program
  .command('analyze-dir <directory>')
  .description('Analyze all JavaScript/TypeScript files in a directory recursively')
  .option('--output <file>', 'Export the full report to a .json or .md file')
  .action(async (dir, options) => {
    const { analyzeDirectory } = await import('./lib/analyzeDir.js');
    await analyzeDirectory(dir, options.output);
  });

program
  .command('fix <file>')
  .description('Use AI to suggest and optionally apply code improvements')
  .option('--apply', 'Apply the fix directly to the file')
  .action(async (file, options) => {
    const { fixCode } = await import('./lib/fix.js');
    await fixCode(file, options.apply);
  });


program.parse(process.argv);
