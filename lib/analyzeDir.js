import fs from 'fs';
import path from 'path';
import { analyzeCodebase } from './analyze.js';
import chalk from 'chalk';

const SUPPORTED_EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];

function getAllCodeFiles(dirPath) {
  let codeFiles = [];

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      codeFiles = codeFiles.concat(getAllCodeFiles(filePath));
    } else if (SUPPORTED_EXTENSIONS.includes(path.extname(file))) {
      codeFiles.push(filePath);
    }
  });

  return codeFiles;
}

export async function analyzeDirectory(directoryPath, outputFilePath) {
  console.log(chalk.cyan(`\n🔍 Scanning directory: ${directoryPath}\n`));

  const files = getAllCodeFiles(directoryPath);
  if (files.length === 0) {
    console.log(chalk.yellow('No supported code files found.'));
    return;
  }

  const results = [];

  for (const file of files) {
    console.log(chalk.blue(`\n📁 Analyzing: ${file}`));
    const result = await analyzeCodebase(file, true); // request raw JSON
    if (result) {
      results.push({ file, ...result });
    }
  }

  if (outputFilePath) {
    const ext = path.extname(outputFilePath).toLowerCase();

    if (ext === '.json') {
      fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
      console.log(chalk.green(`\n✅ JSON report written to: ${outputFilePath}`));
    } else if (ext === '.md') {
      const markdown = results
        .map((res) => {
          return `### 📄 ${res.file}\n` +
            `- **Readability**: ${res.readability}\n` +
            `- **Maintainability**: ${res.maintainability}\n` +
            `- **Testability**: ${res.testability}\n` +
            `- **Summary**: ${res.summary}\n` +
            (res.recommendations.length
              ? `- **Recommendations**:\n${res.recommendations.map((r) => `  - ${r}`).join('\n')}\n`
              : '');
        })
        .join('\n\n---\n\n');

      fs.writeFileSync(outputFilePath, `# 📊 CodebaseGuardian Report\n\n${markdown}`);
      console.log(chalk.green(`\n✅ Markdown report written to: ${outputFilePath}`));
    } else {
      console.log(chalk.red(`Unsupported file format: ${ext}. Use .json or .md`));
    }
  }

  console.log(chalk.green('\n✅ Directory analysis complete.\n'));
}
