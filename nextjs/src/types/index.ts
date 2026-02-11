// 古籍索引类型定义

export enum BookResourceType {
  WORK = 'work',           // 作品
  COLLECTION = 'collection', // 丛编
  BOOK = 'book',           // 书
}

export interface BookIndexItem {
  id: string;              // 唯一ID
  name: string;            // 古籍名称
  type: BookResourceType;  // 资源类型
  isDraft: boolean;        // 是否为草稿
  rawPath: string;         // GitHub 原始文件路径
  author?: string;         // 作者
  collection?: string;     // 收录于
  year?: string;           // 年份
  holder?: string;         // 现藏于
}

// 详情 JSON 共享类型
export interface SourceRef {
  id: string;
  name?: string;
  type?: string;
  version?: string;
  processor_version?: string;
}

export interface DescriptionInfo {
  text: string;
  sources?: string[];
}

export interface AuthorInfo {
  name: string;
  role?: string;
  dynasty?: string;
  source?: string;
}

export interface PublicationInfo {
  year?: string;
  details?: string;
  source?: string;
}

export interface LocationInfo {
  name: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  source?: string;
}

export interface VolumeCount {
  number?: number;
  description?: string;
  source?: string;
}

export interface PageCount {
  number?: number;
  description?: string;
  source?: string;
}

export interface ResourceLink {
  name: string;
  url: string;
  details?: string;
}

// Book 详情
export interface BookDetailData {
  id: string;
  type: 'book';
  title: string;
  description?: DescriptionInfo;
  authors?: AuthorInfo[];
  work_id?: string;
  contained_in?: string[];
  publication_info?: PublicationInfo;
  current_location?: LocationInfo;
  volume_count?: VolumeCount;
  page_count?: PageCount;
  text_resources?: ResourceLink[];
  image_resources?: ResourceLink[];
  location_history?: LocationInfo[];
  related_books?: string[];
  sources?: SourceRef[];
}

// Collection 详情
export interface CollectionDetailData {
  id: string;
  type: 'collection';
  title: string;
  description?: DescriptionInfo;
  authors?: AuthorInfo[];
  contained_in?: string[];
  publication_info?: PublicationInfo;
  current_location?: LocationInfo;
  volume_count?: VolumeCount;
  history?: string[];
  books?: string[];
  sources?: SourceRef[];
}

// Work 详情
export interface WorkDetailData {
  id: string;
  type: 'work';
  title: string;
  description?: DescriptionInfo;
  authors?: AuthorInfo[];
  parent_works?: string[];
  books?: string[];
  sources?: SourceRef[];
}

export type BookIndexDetailData = BookDetailData | CollectionDetailData | WorkDetailData;

// GitHub API 返回的 JSON 结构
// 统一使用 Object/Map (Record) 格式
export interface BookIndexResponse {
  books?: Record<string, {
    id: string;
    title: string;
    path: string;
    type?: string;
    author?: string;
    collection?: string;
    year?: string;
    holder?: string;
  }>;
  collections?: Record<string, {
    id: string;
    title: string;
    path: string;
    type?: string;
    author?: string;
    year?: string;
  }>;
  works?: Record<string, {
    id: string;
    title: string;
    path: string;
    type?: string;
    author?: string;
    year?: string;
  }>;
}
