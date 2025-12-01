import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, title: fallbackTitle, description: fallbackDesc } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const hostname = new URL(url).hostname;

    // Try multiple methods to fetch content
    let result = null;

    // Method 1: Try direct fetch with browser-like headers
    result = await tryDirectFetch(url);

    // Method 2: If direct fetch fails, try using a CORS proxy
    if (!result || result.fetchFailed) {
      result = await tryWithProxy(url);
    }

    // Method 3: If still failing, try extracting from Google Cache or Web Archive
    if (!result || result.fetchFailed) {
      result = await tryWebArchive(url);
    }

    // If all methods fail, return basic info
    if (!result || result.fetchFailed) {
      return NextResponse.json({
        title: fallbackTitle || 'Article',
        description: fallbackDesc || '',
        image: '',
        siteName: hostname,
        content: '',
        url,
        fetchFailed: true,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Fetch article error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

async function tryDirectFetch(url: string): Promise<ArticleResult | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    if (!html || html.length < 500) {
      return null;
    }

    return extractReadableContent(html, url);
  } catch (e) {
    console.error('Direct fetch failed:', e);
    return null;
  }
}

async function tryWithProxy(url: string): Promise<ArticleResult | null> {
  // Try using allorigins.win as a CORS proxy
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of proxyUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const html = await response.text();

      if (!html || html.length < 500) continue;

      const result = extractReadableContent(html, url);
      if (result && result.content) {
        return result;
      }
    } catch (e) {
      console.error(`Proxy fetch failed for ${proxyUrl}:`, e);
      continue;
    }
  }

  return null;
}

async function tryWebArchive(url: string): Promise<ArticleResult | null> {
  try {
    // Try to get from Wayback Machine
    const archiveApiUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(archiveApiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();

    if (data.archived_snapshots?.closest?.url) {
      const archiveUrl = data.archived_snapshots.closest.url;
      return await tryDirectFetch(archiveUrl);
    }
  } catch (e) {
    console.error('Web Archive fetch failed:', e);
  }

  return null;
}

interface ArticleResult {
  title: string;
  description: string;
  image: string;
  siteName: string;
  content: string;
  url: string;
  fetchFailed?: boolean;
}

function extractReadableContent(html: string, url: string): ArticleResult {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
  const title = ogTitleMatch?.[1] || titleMatch?.[1] || 'Untitled';

  // Extract description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
  const description = ogDescMatch?.[1] || descMatch?.[1] || '';

  // Extract image
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) ||
                       html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i);
  const image = ogImageMatch?.[1] || '';

  // Extract site name
  const siteNameMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:site_name["']/i);
  const siteName = siteNameMatch?.[1] || new URL(url).hostname;

  // Extract main content with multiple strategies
  let bodyContent = '';

  // Strategy 1: Look for article tag
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  // Strategy 2: Look for main tag
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

  // Strategy 3: Look for common content class names
  const contentPatterns = [
    /<div[^>]*class=["'][^"']*(?:post-content|article-content|entry-content|content-body|story-body|article-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*(?:post|article|entry|story|content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class=["'][^"']*(?:content|article|post)[^"']*["'][^>]*>([\s\S]*?)<\/section>/i,
  ];

  let rawContent = articleMatch?.[1] || mainMatch?.[1] || '';

  if (!rawContent) {
    for (const pattern of contentPatterns) {
      const match = html.match(pattern);
      if (match?.[1] && match[1].length > 200) {
        rawContent = match[1];
        break;
      }
    }
  }

  // Strategy 4: Extract all paragraphs if no content found
  if (!rawContent || rawContent.length < 200) {
    const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    const longParagraphs = paragraphs.filter(p => p.length > 100);
    if (longParagraphs.length > 0) {
      rawContent = longParagraphs.join('\n');
    }
  }

  if (rawContent) {
    bodyContent = cleanHtmlContent(rawContent);
  }

  // If no content found, use description
  if (!bodyContent.trim() || bodyContent.length < 50) {
    bodyContent = decodeHtmlEntities(description);
  }

  return {
    title: decodeHtmlEntities(title),
    description: decodeHtmlEntities(description),
    image,
    siteName: decodeHtmlEntities(siteName),
    content: bodyContent,
    url,
    fetchFailed: !bodyContent || bodyContent.length < 50,
  };
}

function cleanHtmlContent(html: string): string {
  // Remove script and style tags
  let cleaned = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  cleaned = cleaned.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '');
  cleaned = cleaned.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');

  // Remove comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Remove nav, header, footer, aside
  cleaned = cleaned.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  cleaned = cleaned.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');
  cleaned = cleaned.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  cleaned = cleaned.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '');
  cleaned = cleaned.replace(/<button[^>]*>[\s\S]*?<\/button>/gi, '');

  // Convert headers to styled text
  cleaned = cleaned.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n## $1\n');
  cleaned = cleaned.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n### $1\n');
  cleaned = cleaned.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n#### $1\n');
  cleaned = cleaned.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, '\n##### $1\n');

  // Convert paragraphs
  cleaned = cleaned.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');

  // Convert lists
  cleaned = cleaned.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '\n• $1');
  cleaned = cleaned.replace(/<\/?[uo]l[^>]*>/gi, '\n');

  // Convert line breaks
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/div>/gi, '\n');

  // Convert links - keep text only
  cleaned = cleaned.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1');

  // Convert strong/bold
  cleaned = cleaned.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/(strong|b)>/gi, '**$2**');

  // Convert em/italic
  cleaned = cleaned.replace(/<(em|i)[^>]*>([\s\S]*?)<\/(em|i)>/gi, '*$2*');

  // Remove remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  cleaned = decodeHtmlEntities(cleaned);

  // Clean up whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');
  cleaned = cleaned.replace(/^\s+/gm, '');
  cleaned = cleaned.trim();

  // Remove very short lines (likely navigation/UI elements)
  const lines = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    // Keep headers, list items, and lines with more than 30 chars
    return trimmed.startsWith('#') ||
           trimmed.startsWith('•') ||
           trimmed.startsWith('**') ||
           trimmed.length > 30 ||
           trimmed === '';
  });

  return lines.join('\n').trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}
