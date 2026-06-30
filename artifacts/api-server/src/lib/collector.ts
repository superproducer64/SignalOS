import RSSParser from "rss-parser";
import type { SourceConfig } from "./sources-config";

export interface CollectedItem {
  headline: string;
  summary: string;
  source_domain: string;
  category: string;
  timestamp: string;
  raw_data: Record<string, unknown>;
}

const parser = new RSSParser({
  timeout: 10000,
  headers: {
    "User-Agent": "SignalOS-Collector/1.0 (RSS reader)",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
});

function stripHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toIso(raw: string | undefined): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function collectFromSource(
  source: SourceConfig
): Promise<CollectedItem[]> {
  let feed;
  try {
    feed = await parser.parseURL(source.endpointUrl);
  } catch (err) {
    throw new Error(
      `Failed to fetch/parse feed "${source.sourceName}" (${source.endpointUrl}): ${(err as Error).message}`
    );
  }

  const items: CollectedItem[] = [];

  for (const item of feed.items ?? []) {
    const headline = stripHtml(item.title ?? "").slice(0, 500);
    if (!headline) continue;

    const summary = stripHtml(
      item.contentSnippet ?? item.content ?? item.summary ?? ""
    ).slice(0, 2000);

    items.push({
      headline,
      summary,
      source_domain: source.domain,
      category: source.category,
      timestamp: toIso(item.pubDate ?? item.isoDate),
      raw_data: {
        sourceId: source.sourceId,
        sourceName: source.sourceName,
        link: item.link ?? null,
        guid: item.guid ?? null,
        author: item.creator ?? item.author ?? null,
      },
    });
  }

  return items;
}
