import { findBookById, fetchAllBooks } from '@/services/bookIndex';
import { Metadata } from 'next';
import BookDetailContent from '@/components/book-index/BookDetailContent';

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    // 静态导出默认用 github 数据生成元数据
    const book = await findBookById(id, 'github');
    const title = book ? `${book.name} - 古籍详情` : `古籍详情 - ${id}`;
    const description = book ? `查看古籍《${book.name}》的详细信息。` : `查看古籍 ${id} 的详细信息。`;

    return {
      title,
      description,
      alternates: {
        canonical: `/book-index/${id}`,
      },
    };
  } catch {
    return { title: '古籍详情' };
  }
}

export async function generateStaticParams() {
  try {
    const books = await fetchAllBooks('github');
    return books.map((book) => ({
      id: book.id,
    }));
  } catch (error) {
    console.error('Failed to generate static params:', error);
    return [];
  }
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  return <BookDetailContent id={id} />;
}
