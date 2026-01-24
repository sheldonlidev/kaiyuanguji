import 'dart:convert';
import 'package:http/http.dart' as http;
import 'book_index_model.dart';

/// 古籍索引服务
/// 从 GitHub 仓库的 index.json 动态获取古籍数据
class BookIndexService {
  static const String _draftIndexUrl =
      'https://raw.githubusercontent.com/open-guji/book-index-draft/main/index.json';
  static const String _officialIndexUrl =
      'https://raw.githubusercontent.com/open-guji/book-index/main/index.json';

  /// 缓存索引数据
  static List<BookIndexItem>? _cachedItems;

  /// 获取所有古籍列表
  static Future<List<BookIndexItem>> fetchAllBooks() async {
    // 如果有缓存，直接返回
    if (_cachedItems != null) {
      return _cachedItems!;
    }

    final List<BookIndexItem> allItems = [];

    // 获取草稿版索引
    try {
      final draftItems = await _fetchIndexFromUrl(_draftIndexUrl, isDraft: true);
      allItems.addAll(draftItems);
    } catch (e) {
      // 草稿版获取失败，忽略
    }

    // 获取正式版索引（如果有的话）
    try {
      final officialItems = await _fetchIndexFromUrl(_officialIndexUrl, isDraft: false);
      allItems.addAll(officialItems);
    } catch (e) {
      // 正式版可能还没有index.json，忽略
    }

    _cachedItems = allItems;
    return allItems;
  }

  /// 从URL获取索引
  static Future<List<BookIndexItem>> _fetchIndexFromUrl(
    String url, {
    required bool isDraft,
  }) async {
    final response = await http.get(Uri.parse(url));
    if (response.statusCode != 200) {
      throw Exception('Failed to fetch index: ${response.statusCode}');
    }

    final Map<String, dynamic> data = json.decode(utf8.decode(response.bodyBytes));
    final List<BookIndexItem> items = [];

    // 解析 books
    if (data['books'] != null) {
      final books = data['books'] as Map<String, dynamic>;
      for (final entry in books.entries) {
        items.add(_parseItem(entry.value, BookResourceType.book, isDraft));
      }
    }

    // 解析 collections
    if (data['collections'] != null) {
      final collections = data['collections'] as Map<String, dynamic>;
      for (final entry in collections.entries) {
        items.add(_parseItem(entry.value, BookResourceType.collection, isDraft));
      }
    }

    // 解析 works
    if (data['works'] != null) {
      final works = data['works'] as Map<String, dynamic>;
      for (final entry in works.entries) {
        items.add(_parseItem(entry.value, BookResourceType.work, isDraft));
      }
    }

    return items;
  }

  /// 解析单个条目
  static BookIndexItem _parseItem(
    Map<String, dynamic> json,
    BookResourceType type,
    bool isDraft,
  ) {
    return BookIndexItem(
      id: json['id'] as String,
      name: json['title'] as String,
      type: type,
      isDraft: isDraft,
      rawPath: json['path'] as String,
      author: json['author'] as String?,
      collection: json['collection'] as String?,
      year: json['year'] as String?,
      holder: json['holder'] as String?,
    );
  }

  /// 清除缓存（用于刷新数据）
  static void clearCache() {
    _cachedItems = null;
  }

  /// 根据ID查找古籍
  static Future<BookIndexItem?> findBookById(String id) async {
    final allBooks = await fetchAllBooks();
    try {
      return allBooks.firstWhere((item) => item.id == id);
    } catch (e) {
      return null;
    }
  }

  /// 搜索古籍（按名称）
  static Future<List<BookIndexItem>> searchBooks(String query) async {
    if (query.isEmpty) {
      return fetchAllBooks();
    }

    final allBooks = await fetchAllBooks();
    final lowerQuery = query.toLowerCase();

    return allBooks.where((item) {
      return item.name.toLowerCase().contains(lowerQuery) ||
          item.id.toLowerCase().contains(lowerQuery);
    }).toList();
  }

  /// 获取古籍的 Markdown 内容
  static Future<String> fetchBookContent(BookIndexItem item) async {
    try {
      final response = await http.get(Uri.parse(item.rawUrl));
      if (response.statusCode == 200) {
        return utf8.decode(response.bodyBytes);
      }
      throw Exception('Failed to load content: ${response.statusCode}');
    } catch (e) {
      throw Exception('Failed to fetch book content: $e');
    }
  }

  /// 根据ID直接获取内容（用于详情页）
  static Future<String> fetchContentById(String id) async {
    final item = await findBookById(id);
    if (item == null) {
      throw Exception('Book not found: $id');
    }
    return fetchBookContent(item);
  }
}
