import OpenAI from 'openai';
import fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

interface PexelsPhoto {
  id: number;
  alt: string;
  src: {
    original: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

interface PexelsResponse {
  photos: PexelsPhoto[];
}
async function fetchPexelsImages(query: string, perPage: number = 10): Promise<{ url: string, altText: string }[]> {
  const API_KEY = process.env.PIXELS_API;

  if (!API_KEY) {
    throw new Error('API_KEY is not defined in environment variables');
  }
  const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`, {
    headers: {
      'Authorization': API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Pexels API Error: ${response.statusText}`);
  }

  const data = await response.json() as PexelsResponse;

  return data.photos.map(photo => ({
    url: photo.src.original,
    altText: photo.alt || 'Pexels image'
  }));
}


interface BlogContent {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  date: string;
  readingTime: string;
  featuredImage: {
    url: string;
    altText: string;
    caption: string;
  };
  sections: Array<{
    title: string;
    content: string;
    image?: {
      url: string;
      altText: string;
      caption: string;
    };
    listItems?: string[];
  }>;
  tags: string[];
  relatedPosts: Array<{
    title: string;
    url: string;
  }>;
}

class BlogGenerator {
  private openai: OpenAI;
  private siteUrl: string;

  constructor(apiKey: string, siteUrl: string) {
    this.openai = new OpenAI({
      baseURL: process.env.BASE_URL,
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': siteUrl,
        'X-Title': 'Blog Content Generator',
        'Authorization': `Bearer ${apiKey}`
      },
    });
    this.siteUrl = siteUrl;
  }

  async generateBlogPost(topic: string): Promise<string> {
    const content = await this.generateBlogContent(topic);

    // Use the exact same topic for Pexels image search
    const images = await fetchPexelsImages(topic);

    // Inject featured image
    if (images.length > 0) {
      content.featuredImage.url = images[0].url;
      content.featuredImage.altText = images[0].altText;
    }

    // Inject images into sections
    for (let i = 0; i < content.sections.length; i++) {
      if (images[i + 1]) {
        content.sections[i].image = {
          url: images[i + 1].url,
          altText: images[i + 1].altText,
          caption: images[i + 1].altText
        };
      }
    }

    return this.renderTemplate(content);
  }



  private async generateBlogContent(topic: string): Promise<BlogContent> {
    const prompt = this.createContentPrompt(topic);
    const response = await this.callOpenRouterAPI(prompt);

    // Handle Markdown code block wrapping
    let jsonString = response.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.slice(7, -3).trim(); // Remove ```json and trailing ```
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.slice(3, -3).trim(); // Remove ``` and trailing ```
    }

    try {
      return JSON.parse(jsonString) as BlogContent;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.error('Problematic content:', jsonString);
      throw new Error('Failed to parse generated content');
    }
  }

  private createContentPrompt(topic: string): string {
    return `Generate blog content about "${topic}" in RAW JSON format (no Markdown, just pure JSON) with this exact structure:
{
"title": "10 Essential [Topic] you should know about",
"description": "[150-160 character meta description]",
"keywords": ["keyword1", "keyword2", "keyword3"],
"author": "Author Name",
"date": "YYYY-MM-DD",
"readingTime": "X min read",
"featuredImage": {
  "url": "https://picsum.photos/600/300?random=1",
  "altText": "Descriptive alt text",
  "caption": "Image caption"
},
"sections": [
  {
    "title": "Section 1",
    "content": "Paragraph text...",
    "image": {
      "url": "https://picsum.photos/600/300?random=${Math.random()}",
      "altText": "Descriptive alt text",
      "caption": "Image caption"
    },
    "listItems": ["Item 1", "Item 2", "Item 3"]
  }
],
"tags": ["tag1", "tag2", "tag3"],

}

IMPORTANT:
1. Output must be pure JSON only
2. Do not include any Markdown code blocks
3. Do not include any explanatory text
4. Maintain the exact structure shown above`;
  }


  private async callOpenRouterAPI(prompt: string): Promise<string> {
    const completion = await this.openai.chat.completions.create({
      model: 'deepseek/deepseek-r1-distill-qwen-32b:free',
      messages: [
        {
          role: 'system',
          content: 'You must respond with ONLY raw JSON output. Do not include any Markdown code blocks or additional text.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in API response');
    }
    return content;
  }

  private renderTemplate(content: BlogContent): string {
    return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${content.description}">
    <meta name="keywords" content="${content.keywords.join(', ')}">
    <meta name="author" content="${content.author}">
    <meta property="og:title" content="${content.title}">
    <meta property="og:description" content="${content.description}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${this.siteUrl}/blogs/}">
    <meta property="og:image" content="${content.featuredImage.url}">
    
    <title>${content.title} | My Website</title>
    <link rel="icon" href="https://cdn.jsdelivr.net/gh/w3cdpass/static@latest/(blogs)/public/favicon.png" type="image/x-icon">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
</head>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    @font-face {
        font-family: "semiBoldW";
        src: url("http://cdn.jsdelivr.net/gh/w3cdpass/static@latest/(blogs)/fonts/Exo2-SemiBold.ttf");
    }
    
    @font-face {
        font-family: "mediumW";
        src: url("http://cdn.jsdelivr.net/gh/w3cdpass/static@latest/(blogs)/fonts/Exo2-Medium.ttf");
    }

    body {
        font-family: "mediumW", sans-serif;
        line-height: 1.6;
        color: #333;
        background-color: #f5f5f5;
    }

    .pageWrap {
        width: 100%;
        min-height: 100vh;
        display: flex;
        justify-content: center;
    }

    .container {
        padding: 20px;
        width: 100%;
        max-width: 1200px;
    }

    .breadcrumb {
        margin-bottom: 20px;
        font-size: 14px;
    }

    .sidebar-container {
        display: grid;
        grid-template-columns: 75% 25%;
        gap: 30px;
    }
    
    .content, .sidebar {
        padding: 25px;
        border-radius: 8px;
        background-color: #fff;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    .article-header {
        margin-bottom: 30px;
    }

    .article-title {
        font-family: "semiBoldW";
        font-size: 32px;
        color: #222;
        margin-bottom: 15px;
        line-height: 1.3;
    }

    .article-meta {
        display: flex;
        gap: 15px;
        color: #666;
        font-size: 14px;
        margin-bottom: 20px;
    }

    .featured-image {
        width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 20px 0;
        object-fit: cover;
    }

    .article-content h2 {
        font-family: "semiBoldW";
        font-size: 24px;
        margin: 25px 0 15px;
        color: #222;
    }

    .article-content h3 {
        font-family: "semiBoldW";
        font-size: 20px;
        margin: 20px 0 12px;
    }

    .article-content p {
        margin-bottom: 15px;
        font-size: 16px;
    }

    .article-content ul, .article-content ol {
        margin: 15px 0 15px 25px;
    }

    .article-content li {
        margin-bottom: 8px;
    }

    .image-caption {
        text-align: center;
        font-size: 14px;
        color: #666;
        margin-top: -15px;
        margin-bottom: 20px;
    }

    .cta-section {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin: 30px 0;
        text-align: center;
    }

    .sidebar-title {
        font-family: "semiBoldW";
        font-size: 20px;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }

    .related-post {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
    }

    .related-post:last-child {
        border-bottom: none;
    }

    .related-post a {
        color: #333;
        text-decoration: none;
        transition: color 0.3s;
    }

    .related-post a:hover {
        color: #0066cc;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 20px;
    }

    .tag {
        background-color: #f0f0f0;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 14px;
    }

    @media (max-width: 768px) {
        .sidebar-container {
            grid-template-columns: 1fr;
        }
        
        .article-title {
            font-size: 26px;
        }
            
        
        .article-content h2 {
            font-size: 22px;
        }
    }
</style>

<body>
    <div class="pageWrap">
        <div class="container">
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <a href="/blogs/"><i class="fa-solid fa-house"></i> Home</a> &raquo; <a href="../feature/Index.html">Blog</a> &raquo; ${content.title}
            </nav>
            
            <div class="sidebar-container">
                <main class="content" itemscope itemtype="https://schema.org/Article">
                    <header class="article-header">
                        <h1 class="article-title" itemprop="headline">${content.title}</h1>
                        <div class="article-meta">
                            <span itemprop="author">By ${content.author}</span>
                            <span itemprop="datePublished" content="${content.date}">${new Date(content.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            <span>${content.readingTime}</span>
                        </div>
                        <img src="${content.featuredImage.url}" alt="${content.featuredImage.altText}" class="featured-image" itemprop="image">
                        <p class="image-caption">${content.featuredImage.caption}</p>
                    </header>
                    
                    <div class="article-content" itemprop="articleBody">
                        ${content.sections.map(section => `
                            <h2>${section.title}</h2>
                            <p>${section.content}</p>
                            ${section.listItems?.length ? `
                                <ul>
                                    ${section.listItems.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            ` : ''}
                            ${section.image ? `
                              <img src="${section.image.url}" alt="${section.image.altText}" class="featured-image">
                              <p class="image-caption">${section.image.caption}</p>
                            ` : ''}
                        `).join('')}
                        
                        <div class="cta-section">
                            <h3>Ready to Transform Your Workflow?</h3>
                            <p>Start your free trial today and experience these features firsthand.</p>
                            <button style="padding: 10px 20px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">Start Free Trial</button>
                        </div>
                    </div>
                    
                    <div class="tags">
                        ${content.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </main>
                
                <aside class="sidebar">
                    
                    
                    <h3 class="sidebar-title" style="margin-top: 30px;">Newsletter</h3>
                    <p>Get the latest tips and updates delivered to your inbox.</p>
                    <form style="margin-top: 15px;">
                        <input type="email" placeholder="Your email address" style="width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px;">
                        <button type="submit" style="width: 100%; padding: 10px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">Subscribe</button>
                    </form>
                    
                    <h3 class="sidebar-title" style="margin-top: 30px;">Popular Tags</h3>
                    <div class="tags">
                        ${content.tags.slice(0, 5).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </aside>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .substring(0, 60);
  }
}

export { BlogGenerator };