import fs from 'fs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function promptUser(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

export async function fixCode(filePath, applyFix = false) {
  try {
    const absolutePath = path.resolve(filePath);
    const code = fs.readFileSync(absolutePath, 'utf8');

    const prompt = `
You are an expert software engineer. Refactor the following code to:

- Improve readability and maintainability
- Fix any obvious code smells
- Apply best practices and clean coding principles

Return ONLY the full, corrected code block.

\`\`\`js
${code}
\`\`\`
`;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-r1:free',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiOutput = response.data.choices[0].message.content;
    const newCode = extractCode(aiOutput);

    if (!newCode) {
      console.log(chalk.red('❌ Could not extract updated code from AI response.'));
      return;
    }

    console.log(chalk.green('\n✅ AI-suggested refactored code:\n'));
    console.log(newCode);

    if (!applyFix) {
      const answer = await promptUser(
        chalk.yellow('\n⚠️ Apply this change to the original file? (y/n): ')
      );
      if (answer.toLowerCase() !== 'y') {
        rl.close();
        return;
      }
    }

    fs.writeFileSync(absolutePath, newCode, 'utf8');
    console.log(chalk.green(`\n💾 File updated: ${filePath}\n`));
    rl.close();
  } catch (err) {
    console.log(chalk.red('❌ Error during auto-fix:'), err.message);
  }
}

function extractCode(aiText) {
  const match = aiText.match(/```(?:[a-z]*)\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}
