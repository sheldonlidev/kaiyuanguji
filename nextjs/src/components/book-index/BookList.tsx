'use client';

import { useState, useEffect } from 'react';
import { BookIndexItem, BookResourceType } from '@/types';
import { fetchAllBooks, searchBooks, getTypeLabel } from '@/services/bookIndex';
import BookListItem from './BookListItem';
import { useSource } from '../common/SourceContext';

const FILTER_TYPES = [
  { id: 'all', label: '全部' },
  { id: BookResourceType.WORK, label: '作品' },
  { id: BookResourceType.COLLECTION, label: '丛编' },
  { id: BookResourceType.BOOK, label: '书' },
];

export default function BookList() {
  const { source } = useSource();
  const [allBooks, setAllBooks] = useState<BookIndexItem[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookIndexItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const books = await fetchAllBooks(source);
        setAllBooks(books);
        setFilteredBooks(books);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, [source]);

  // 搜索和过滤处理
  useEffect(() => {
    let result = [...allBooks];

    // 按类型搜索
    if (selectedType !== 'all') {
      result = result.filter(book => book.type === selectedType);
    }

    // 按关键词搜索
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        book =>
          book.name.toLowerCase().includes(lowerQuery) ||
          book.id.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredBooks(result);
  }, [searchQuery, selectedType, allBooks]);

  // 重载/重试
  const handleRetry = () => {
    setIsLoading(true);
    setError(null);
    fetchAllBooks(source)
      .then(books => {
        setAllBooks(books);
        setFilteredBooks(books);
      })
      .catch(err => setError(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-2xl border border-border/40 shadow-sm space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索书名、作者或 ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-paper/50 border border-border/60 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-vermilion/20 focus:border-vermilion
                     transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-secondary mr-2">类型筛选:</span>
          {FILTER_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`
                px-4 py-1.5 text-xs rounded-full border transition-all
                ${selectedType === type.id
                  ? 'bg-ink text-white border-ink'
                  : 'bg-transparent text-secondary border-border/60 hover:border-vermilion/40 hover:text-vermilion'
                }
              `}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats and Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <p className="text-secondary text-sm">
            找到 <span className="text-ink font-semibold">{filteredBooks.length}</span> 部相关古籍
            {source === 'github' ? ' (GitHub 源)' : ' (Gitee 源)'}
          </p>
          {error && (
            <button
              onClick={handleRetry}
              className="text-vermilion text-xs hover:underline flex items-center gap-1"
            >
              加载出错，点击重试
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-paper/30 h-48 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookListItem key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-paper/20 rounded-3xl border border-dashed border-border/40">
            <p className="text-secondary">未找到匹配的古籍</p>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedType('all'); }}
                className="mt-4 text-vermilion text-sm hover:underline"
              >
                清除所有过滤条件
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
