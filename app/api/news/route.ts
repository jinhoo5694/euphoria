import { NextResponse } from 'next/server';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  category: 'producthunt' | 'tech' | 'ai' | 'startup';
  imageUrl?: string;
  publishedAt: string;
  votes?: number;
  comments?: number;
  maker?: string;
}

// Fetch from ProductHunt using proxy to get actual page data
async function fetchProductHunt(): Promise<NewsItem[]> {
  try {
    // Use a CORS proxy to fetch the Product Hunt homepage
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.producthunt.com/')}`;

    const response = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error('ProductHunt proxy fetch failed:', response.status);
      // Try alternative method
      return await fetchProductHuntAlternative();
    }

    const html = await response.text();
    const items: NewsItem[] = [];

    // Product Hunt embeds data in a script tag as JSON
    // Look for the Next.js data or embedded JSON
    const scriptDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

    if (scriptDataMatch) {
      try {
        const jsonData = JSON.parse(scriptDataMatch[1]);
        const posts = extractPostsFromNextData(jsonData);
        if (posts.length > 0) {
          return posts;
        }
      } catch (e) {
        console.error('Failed to parse Next.js data:', e);
      }
    }

    // Fallback: Parse HTML directly for product cards
    // Look for product links and titles
    const productPattern = /<a[^>]*href="\/posts\/([^"]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi;
    let match;
    let count = 0;

    while ((match = productPattern.exec(html)) !== null && count < 15) {
      const slug = match[1];
      const title = cleanHtml(match[2]);

      if (title && slug && !slug.includes('/') && title.length > 2) {
        items.push({
          id: `ph-${slug}`,
          title,
          description: '',
          url: `https://www.producthunt.com/posts/${slug}`,
          source: 'Product Hunt',
          category: 'producthunt',
          publishedAt: new Date().toISOString(),
        });
        count++;
      }
    }

    // If HTML parsing didn't work well, try alternative
    if (items.length < 3) {
      return await fetchProductHuntAlternative();
    }

    return items;
  } catch (error) {
    console.error('ProductHunt error:', error);
    return await fetchProductHuntAlternative();
  }
}

// Alternative: Fetch from Product Hunt's unofficial API endpoints
async function fetchProductHuntAlternative(): Promise<NewsItem[]> {
  try {
    // Try fetching from the daily posts endpoint via proxy
    const today = new Date().toISOString().split('T')[0];
    const apiUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.producthunt.com/frontend/graphql`)}`;

    // GraphQL query for today's posts
    const query = {
      operationName: "HomePage",
      query: `
        query HomePage {
          homefeed(first: 20) {
            edges {
              node {
                ... on Post {
                  id
                  name
                  tagline
                  votesCount
                  commentsCount
                  slug
                  thumbnail {
                    url
                  }
                  makers {
                    name
                  }
                }
              }
            }
          }
        }
      `
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.data?.homefeed?.edges) {
        return data.data.homefeed.edges
          .filter((edge: any) => edge.node?.name)
          .slice(0, 15)
          .map((edge: any) => ({
            id: `ph-${edge.node.id}`,
            title: edge.node.name,
            description: edge.node.tagline || '',
            url: `https://www.producthunt.com/posts/${edge.node.slug}`,
            source: 'Product Hunt',
            category: 'producthunt' as const,
            imageUrl: edge.node.thumbnail?.url,
            publishedAt: new Date().toISOString(),
            votes: edge.node.votesCount,
            comments: edge.node.commentsCount,
            maker: edge.node.makers?.[0]?.name,
          }));
      }
    }
  } catch (e) {
    console.error('GraphQL fetch failed:', e);
  }

  // Final fallback: Use RSS feed via proxy
  try {
    const rssUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.producthunt.com/feed')}`;
    const response = await fetch(rssUrl, { next: { revalidate: 300 } });

    if (response.ok) {
      const xml = await response.text();
      const items: NewsItem[] = [];
      const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const item of itemMatches.slice(0, 15)) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
                      item.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const description = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ||
                            item.match(/<description>(.*?)<\/description>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';

        if (title && link) {
          items.push({
            id: `ph-${Buffer.from(link).toString('base64').slice(0, 10)}`,
            title: cleanHtml(title),
            description: cleanHtml(description).slice(0, 200),
            url: link,
            source: 'Product Hunt',
            category: 'producthunt',
            publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          });
        }
      }

      if (items.length > 0) return items;
    }
  } catch (e) {
    console.error('RSS fetch failed:', e);
  }

  // Use embedded fallback data for demo
  return getProductHuntFallback();
}

function extractPostsFromNextData(data: any): NewsItem[] {
  const items: NewsItem[] = [];

  try {
    // Navigate through the Next.js data structure
    const findPosts = (obj: any, depth = 0): any[] => {
      if (depth > 10) return [];
      if (!obj || typeof obj !== 'object') return [];

      // Look for arrays that might contain posts
      if (Array.isArray(obj)) {
        const posts: any[] = [];
        for (const item of obj) {
          if (item?.name && item?.tagline && item?.slug) {
            posts.push(item);
          } else {
            posts.push(...findPosts(item, depth + 1));
          }
        }
        return posts;
      }

      // Look for post-like objects
      if (obj.name && obj.tagline && obj.slug) {
        return [obj];
      }

      // Recurse into object properties
      const posts: any[] = [];
      for (const key of Object.keys(obj)) {
        posts.push(...findPosts(obj[key], depth + 1));
      }
      return posts;
    };

    const posts = findPosts(data);

    for (const post of posts.slice(0, 15)) {
      items.push({
        id: `ph-${post.id || post.slug}`,
        title: post.name,
        description: post.tagline || '',
        url: `https://www.producthunt.com/posts/${post.slug}`,
        source: 'Product Hunt',
        category: 'producthunt',
        imageUrl: post.thumbnail?.url || post.thumbnailUrl,
        publishedAt: post.createdAt || new Date().toISOString(),
        votes: post.votesCount,
        comments: post.commentsCount,
        maker: post.makers?.[0]?.name,
      });
    }
  } catch (e) {
    console.error('Failed to extract posts from Next.js data:', e);
  }

  return items;
}

// Fetch tech news from HackerNews
async function fetchHackerNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return getTechNewsFallback();
    }

    const storyIds: number[] = await response.json();
    const topIds = storyIds.slice(0, 15);

    const stories = await Promise.all(
      topIds.map(async (id) => {
        const storyRes = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { next: { revalidate: 300 } }
        );
        return storyRes.json();
      })
    );

    return stories
      .filter((story) => story && story.title && story.url)
      .map((story) => ({
        id: `hn-${story.id}`,
        title: story.title,
        description: `${story.score} points by ${story.by} | ${story.descendants || 0} comments`,
        url: story.url,
        source: 'Hacker News',
        category: 'tech' as const,
        publishedAt: new Date(story.time * 1000).toISOString(),
        votes: story.score,
        comments: story.descendants || 0,
      }));
  } catch (error) {
    console.error('HackerNews error:', error);
    return getTechNewsFallback();
  }
}

// Fetch AI/ML news from various sources
async function fetchAINews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      'https://hn.algolia.com/api/v1/search?query=AI%20OR%20GPT%20OR%20LLM%20OR%20machine%20learning%20OR%20Claude%20OR%20OpenAI&tags=story&hitsPerPage=15',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return getAINewsFallback();
    }

    const data = await response.json();

    return data.hits
      .filter((hit: { title: string; url: string }) => hit.title && hit.url)
      .slice(0, 15)
      .map((hit: { objectID: string; title: string; url: string; points: number; author: string; num_comments: number; created_at: string }) => ({
        id: `ai-${hit.objectID}`,
        title: hit.title,
        description: `${hit.points || 0} points by ${hit.author} | ${hit.num_comments || 0} comments`,
        url: hit.url,
        source: 'AI News',
        category: 'ai' as const,
        publishedAt: hit.created_at,
        votes: hit.points,
        comments: hit.num_comments,
      }));
  } catch (error) {
    console.error('AI News error:', error);
    return getAINewsFallback();
  }
}

// Fetch startup news
async function fetchStartupNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(
      'https://hn.algolia.com/api/v1/search?query=startup%20OR%20funding%20OR%20YC%20OR%20Series%20A%20OR%20seed%20round&tags=story&hitsPerPage=15',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      return getStartupNewsFallback();
    }

    const data = await response.json();

    return data.hits
      .filter((hit: { title: string; url: string }) => hit.title && hit.url)
      .slice(0, 15)
      .map((hit: { objectID: string; title: string; url: string; points: number; author: string; num_comments: number; created_at: string }) => ({
        id: `startup-${hit.objectID}`,
        title: hit.title,
        description: `${hit.points || 0} points by ${hit.author} | ${hit.num_comments || 0} comments`,
        url: hit.url,
        source: 'Startup News',
        category: 'startup' as const,
        publishedAt: hit.created_at,
        votes: hit.points,
        comments: hit.num_comments,
      }));
  } catch (error) {
    console.error('Startup News error:', error);
    return getStartupNewsFallback();
  }
}

// Helper to clean HTML
function cleanHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// Fallback data with real-looking demo products
function getProductHuntFallback(): NewsItem[] {
  return [
    {
      id: 'ph-demo-1',
      title: 'Notion Calendar',
      description: 'Your calendar, tasks, and notes in one place',
      url: 'https://www.producthunt.com/posts/notion-calendar',
      source: 'Product Hunt',
      category: 'producthunt',
      publishedAt: new Date().toISOString(),
      votes: 1247,
      comments: 89,
      maker: 'Ivan Zhao',
      imageUrl: 'https://ph-files.imgix.net/notion-logo.png',
    },
    {
      id: 'ph-demo-2',
      title: 'Arc Max',
      description: 'AI-powered features for the Arc Browser',
      url: 'https://www.producthunt.com/posts/arc-max',
      source: 'Product Hunt',
      category: 'producthunt',
      publishedAt: new Date().toISOString(),
      votes: 892,
      comments: 156,
      maker: 'Josh Miller',
      imageUrl: 'https://ph-files.imgix.net/arc-logo.png',
    },
    {
      id: 'ph-demo-3',
      title: 'Raycast Pro',
      description: 'Your shortcut to everything on Mac',
      url: 'https://www.producthunt.com/posts/raycast-pro',
      source: 'Product Hunt',
      category: 'producthunt',
      publishedAt: new Date().toISOString(),
      votes: 756,
      comments: 67,
      maker: 'Thomas Paul Mann',
      imageUrl: 'https://ph-files.imgix.net/raycast-logo.png',
    },
    {
      id: 'ph-demo-4',
      title: 'Linear Asks',
      description: 'AI-powered issue creation for teams',
      url: 'https://www.producthunt.com/posts/linear-asks',
      source: 'Product Hunt',
      category: 'producthunt',
      publishedAt: new Date().toISOString(),
      votes: 634,
      comments: 45,
      maker: 'Karri Saarinen',
      imageUrl: 'https://ph-files.imgix.net/linear-logo.png',
    },
    {
      id: 'ph-demo-5',
      title: 'Figma AI',
      description: 'Design faster with AI-powered tools',
      url: 'https://www.producthunt.com/posts/figma-ai',
      source: 'Product Hunt',
      category: 'producthunt',
      publishedAt: new Date().toISOString(),
      votes: 521,
      comments: 78,
      maker: 'Dylan Field',
      imageUrl: 'https://ph-files.imgix.net/figma-logo.png',
    },
    {
      id: 'ph-demo-6',
      title: 'Claude 3.5 Sonnet',
      description: 'Anthropic\'s most intelligent AI model',
      url: 'https://www.producthunt.com/posts/claude-3-5-sonnet',
      source: 'Product Hunt',
      category: 'producthunt',
      publishedAt: new Date().toISOString(),
      votes: 2103,
      comments: 234,
      maker: 'Anthropic',
      imageUrl: 'https://ph-files.imgix.net/claude-logo.png',
    },
    {
      id: 'ph-demo-7',
      title: 'Cursor',
      description: 'The AI-first code editor',
      url: 'https://www.producthunt.com/posts/cursor-2',
      source: 'Product Hunt',
      category: 'producthunt',
      publishedAt: new Date().toISOString(),
      votes: 1876,
      comments: 189,
      maker: 'Michael Truell',
      imageUrl: 'https://ph-files.imgix.net/cursor-logo.png',
    },
    {
      id: 'ph-demo-8',
      title: 'Perplexity Pro',
      description: 'AI-powered answer engine for research',
      url: 'https://www.producthunt.com/posts/perplexity-pro',
      source: 'Product Hunt',
      category: 'producthunt',
      publishedAt: new Date().toISOString(),
      votes: 1543,
      comments: 127,
      maker: 'Aravind Srinivas',
      imageUrl: 'https://ph-files.imgix.net/perplexity-logo.png',
    },
  ];
}

function getTechNewsFallback(): NewsItem[] {
  return [
    {
      id: 'tech-1',
      title: 'Latest Tech News',
      description: 'Stay updated with the latest technology news',
      url: 'https://news.ycombinator.com',
      source: 'Hacker News',
      category: 'tech',
      publishedAt: new Date().toISOString(),
    },
  ];
}

function getAINewsFallback(): NewsItem[] {
  return [
    {
      id: 'ai-1',
      title: 'AI & Machine Learning Updates',
      description: 'Latest developments in artificial intelligence',
      url: 'https://news.ycombinator.com',
      source: 'AI News',
      category: 'ai',
      publishedAt: new Date().toISOString(),
    },
  ];
}

function getStartupNewsFallback(): NewsItem[] {
  return [
    {
      id: 'startup-1',
      title: 'Startup & Funding News',
      description: 'Latest startup ecosystem updates',
      url: 'https://news.ycombinator.com',
      source: 'Startup News',
      category: 'startup',
      publishedAt: new Date().toISOString(),
    },
  ];
}

export async function GET() {
  try {
    const [productHunt, hackerNews, aiNews, startupNews] = await Promise.all([
      fetchProductHunt(),
      fetchHackerNews(),
      fetchAINews(),
      fetchStartupNews(),
    ]);

    const allNews = {
      productHunt,
      techNews: hackerNews,
      aiNews,
      startupNews,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(allNews);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
