export type SourceType = "rss";
export type SignalCategory =
  | "NEWS"
  | "ANALYSIS"
  | "HIGHLIGHT"
  | "SCORE"
  | "TRADE"
  | "INJURY"
  | "OPINION";

export interface SourceConfig {
  sourceId: string;
  domain: string;
  sourceName: string;
  sourceType: SourceType;
  endpointUrl: string;
  category: SignalCategory;
  active: boolean;
}

export const SOURCES: SourceConfig[] = [
  {
    sourceId: "nyt-home",
    domain: "general",
    sourceName: "New York Times",
    sourceType: "rss",
    endpointUrl: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    category: "NEWS",
    active: true,
  },
  {
    sourceId: "bbc-news",
    domain: "general",
    sourceName: "BBC News",
    sourceType: "rss",
    endpointUrl: "https://feeds.bbci.co.uk/news/rss.xml",
    category: "NEWS",
    active: true,
  },
  {
    sourceId: "npr-news",
    domain: "general",
    sourceName: "NPR News",
    sourceType: "rss",
    endpointUrl: "https://feeds.npr.org/1001/rss.xml",
    category: "NEWS",
    active: false,
  },
  {
    sourceId: "hacker-news",
    domain: "technology",
    sourceName: "Hacker News",
    sourceType: "rss",
    endpointUrl: "https://hnrss.org/frontpage",
    category: "ANALYSIS",
    active: true,
  },
];

export function getActiveSources(): SourceConfig[] {
  return SOURCES.filter((s) => s.active);
}
