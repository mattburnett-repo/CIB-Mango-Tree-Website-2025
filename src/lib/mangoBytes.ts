import { API_URL } from "@utils/constants/url";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";

export interface MangoByte {
  id: string | number;
  title: string;
  slug: string;
  publishedAt?: string | null;
  meta?: { description?: string | null };
  content?: SerializedEditorState;
}

interface Result {
  docs: MangoByte[];
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export async function getMangoBytes(options: {
  limit?: number;
  page?: number;
  slug?: string;
} = {}): Promise<Result> {
  // Resolve the category by name rather than assuming its numeric ID.
  const categoryParams = new URLSearchParams({
    "where[title][equals]": "Mango Bytes",
    limit: "1",
    depth: "0",
  });
  const categoryResponse = await fetch(`${API_URL}/api/categories?${categoryParams}`);
  if (!categoryResponse.ok) throw new Error(`Category request failed: ${categoryResponse.status}`);
  const categories = await categoryResponse.json();
  const category = categories.docs?.[0];
  if (!category) throw new Error('The "Mango Bytes" category was not found.');

  const params = new URLSearchParams({
    "where[_status][equals]": "published",
    "where[categories][in]": String(category.id),
    sort: "-publishedAt,-id",
    limit: String(options.limit ?? 4),
    page: String(options.page ?? 1),
    depth: "1",
    draft: "false",
  });
  if (options.slug) params.set("where[slug][equals]", options.slug);
  const response = await fetch(`${API_URL}/api/posts?${params}`);
  if (!response.ok) throw new Error(`Post request failed: ${response.status}`);
  const result = await response.json();
  if (!Array.isArray(result.docs)) throw new Error("Unexpected CMS response.");
  return result as Result;
}

export function formatMangoDate(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}
