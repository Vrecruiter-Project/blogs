import { BlogGenerator } from './blogGenerator';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();
async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
  }

  const siteUrl = 'http://127.0.0.1:3000';

  const blogGenerator = new BlogGenerator(apiKey, siteUrl);

  // Get topic from command-line arguments
  const topic = process.argv.slice(2).join(' ').trim();
  if (!topic) {
    console.error('❌ Please provide a topic. Example: npm run generate "Benefits of Outdoor Games"');
    process.exit(1);
  }

  try {
    console.log(`📝 Generating blog post about: "${topic}"`);

    const htmlOutput = await blogGenerator.generateBlogPost(topic);

    const slug = topic.toLowerCase().replace(/\s+/g, '-');
    const fileName = `./blogs/popular/blog-${slug}.html`;

    fs.mkdirSync('./blogs/latest', { recursive: true });
    fs.writeFileSync(fileName, htmlOutput);

    console.log(`✅ Successfully generated blog post: ${fileName}`);
    console.log(`🔍 Preview (first 300 characters):\n${htmlOutput.substring(0, 300)}...`);

  } catch (error) {
    console.error('❌ Error generating blog post:', error);
  }
}
main()