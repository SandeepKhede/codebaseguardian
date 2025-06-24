import fs from 'fs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';

export async function analyzeCodebase(filePath, returnRaw = false) {
    try {
        const absolutePath = path.resolve(filePath);
        const code = fs.readFileSync(absolutePath, 'utf8');
        const prompt = `
        You are an expert software reviewer. Given the following code, assess and score it in the following categories:
        
        1. Readability (0-100) – Are variable names clear? Is the function structure understandable?
        2. Maintainability (0-100) – How easy is it to change or extend this code?
        3. Testability (0-100) – How easy is it to write unit tests for this code?
        
        Also return:
        - A short summary of potential issues or good practices.
        - 1–3 key recommendations for improvement (if applicable).
        
        Respond ONLY in the following JSON format:
        
        {
        "readability": 0-100,
        "maintainability": 0-100,
        "testability": 0-100,
        "summary": "short bullet or sentence summary",
        "recommendations": ["", "", ""]
        }
        
        Now, here is the code:
        
        \`\`\`
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

    const result = response.data.choices[0].message.content;

    const analysis = JSON.parse(result);

    if (returnRaw) return analysis;

    function grade(score) {
      if (score >= 85) return '🟢 Excellent';
      if (score >= 60) return '🟡 Moderate';
      return '🔴 Poor';
    }

    console.log(chalk.bold(`\n📊 Code Health Report:`));
    console.log(`   Readability:     ${analysis.readability} (${grade(analysis.readability)})`);
    console.log(`   Maintainability: ${analysis.maintainability} (${grade(analysis.maintainability)})`);
    console.log(`   Testability:     ${analysis.testability} (${grade(analysis.testability)})`);

    console.log(chalk.cyan(`\n📝 Summary:`));
    console.log(`   ${analysis.summary}`);

    if (analysis.recommendations?.length) {
      console.log(chalk.yellow(`\n🔧 Recommendations:`));
      analysis.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    console.log('\n');
    return analysis;
  } catch (e) {
    console.log(chalk.red(`❌ Error analyzing: ${filePath}`));
    console.log(e.message);
    return null;
  }
}
