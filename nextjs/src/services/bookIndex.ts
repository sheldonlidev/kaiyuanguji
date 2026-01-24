import { BookIndexItem, BookResourceType, BookIndexResponse } from '@/types';

// GitHub 数据源 URL
const DRAFT_INDEX_URL = 'https://raw.githubusercontent.com/open-guji/book-index-draft/main/index.json';
const OFFICIAL_INDEX_URL = 'https://raw.githubusercontent.com/open-guji/book-index/main/index.json';

// 内存缓存
let cachedItems: BookIndexItem[] | null = null;

/**
 * 从 GitHub 获取索引数据
 */
async function fetchIndexFromGitHub(url: string, isDraft: boolean): Promise<BookIndexItem[]> {
  const response = await fetch(url, {
    cache: 'no-store', // 禁用缓存，确保获取最新数据
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from ${url}: ${response.statusText}`);
  }

  const data: BookIndexResponse = await response.json();
  const items: BookIndexItem[] = [];

  // 解析 books
  if (data.books) {
    Object.values(data.books).forEach((book) => {
      items.push({
        id: book.id,
        name: book.title,
        type: BookResourceType.BOOK,
        isDraft,
        rawPath: book.path,
        author: book.author,
        collection: book.collection,
        year: book.year,
        holder: book.holder,
      });
    });
  }

  // 解析 collections
  if (data.collections) {
    Object.values(data.collections).forEach((collection) => {
      items.push({
        id: collection.id,
        name: collection.title,
        type: BookResourceType.COLLECTION,
        isDraft,
        rawPath: collection.path,
        author: collection.author,
        year: collection.year,
      });
    });
  }

  // 解析 works
  if (data.works) {
    Object.values(data.works).forEach((work) => {
      items.push({
        id: work.id,
        name: work.title,
        type: BookResourceType.WORK,
        isDraft,
        rawPath: work.path,
        author: work.author,
        year: work.year,
      });
    });
  }

  return items;
}

/**
 * 获取所有古籍（含缓存）
 */
export async function fetchAllBooks(): Promise<BookIndexItem[]> {
  // 返回缓存
  if (cachedItems) {
    return cachedItems;
  }

  const allItems: BookIndexItem[] = [];

  // 获取草稿版（失败不影响流程）
  try {
    const draftItems = await fetchIndexFromGitHub(DRAFT_INDEX_URL, true);
    allItems.push(...draftItems);
  } catch (error) {
    console.warn('Failed to fetch draft index:', error);
  }

  // 获取正式版
  try {
    const officialItems = await fetchIndexFromGitHub(OFFICIAL_INDEX_URL, false);
    allItems.push(...officialItems);
  } catch (error) {
    console.warn('Official index not available (this is expected if it hasn\'t been initialized):', error);
  }

  // 缓存结果
  // 去重：如果同一个 ID 既在草稿又在正式版，优先保留正式版
  const uniqueItemsMap = new Map<string, BookIndexItem>();

  // 先放草稿
  allItems.forEach(item => {
    uniqueItemsMap.set(item.id, item);
  });

  // 后放正式版（覆盖草稿）
  // 注意：在之前的 logic 中，allItems 已经按顺序 push 了草稿和正式版
  // 我们直接用 allItems 重新构建 map 即可
  const finalItems = Array.from(uniqueItemsMap.values());

  cachedItems = finalItems;
  return finalItems;
}

/**
 * 根据 ID 查找古籍
 */
export async function findBookById(id: string): Promise<BookIndexItem | null> {
  const allBooks = await fetchAllBooks();
  return allBooks.find((book) => book.id === id) || null;
}

/**
 * 获取古籍内容（Markdown）
 */
export async function fetchBookContent(book: BookIndexItem): Promise<string> {
  const baseUrl = book.isDraft
    ? 'https://raw.githubusercontent.com/open-guji/book-index-draft/main'
    : 'https://raw.githubusercontent.com/open-guji/book-index/main';

  const url = `${baseUrl}/${book.rawPath}`;

  const response = await fetch(url, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch book content: ${response.statusText}`);
  }

  return response.text();
}

/**
 * 根据 ID 获取古籍内容
 */
export async function fetchContentById(id: string): Promise<string | null> {
  const book = await findBookById(id);
  if (!book) {
    return null;
  }
  return fetchBookContent(book);
}

/**
 * 清除缓存
 */
export function clearCache(): void {
  cachedItems = null;
}

/**
 * 搜索古籍（按名称或 ID）
 */
export async function searchBooks(query: string): Promise<BookIndexItem[]> {
  const allBooks = await fetchAllBooks();

  if (!query.trim()) {
    return allBooks;
  }

  const lowerQuery = query.toLowerCase();
  return allBooks.filter(
    (book) =>
      book.name.toLowerCase().includes(lowerQuery) ||
      book.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * 获取类型标签文本
 */
export function getTypeLabel(type: BookResourceType): string {
  switch (type) {
    case BookResourceType.WORK:
      return '作品';
    case BookResourceType.COLLECTION:
      return '丛编';
    case BookResourceType.BOOK:
      return '书';
    default:
      return '';
  }
}

/**
 * 获取状态标签文本
 */
export function getStatusLabel(isDraft: boolean): string {
  return isDraft ? '草稿' : '正式';
}
