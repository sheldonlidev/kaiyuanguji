/// 资源类型枚举
enum BookResourceType {
  work, // 作品
  collection, // 丛编
  book, // 书
}

/// 古籍资源信息
class BookIndexItem {
  /// 唯一ID (如 CX8nMA93gxX)
  final String id;

  /// 名称
  final String name;

  /// 资源类型
  final BookResourceType type;

  /// 是否为草稿
  final bool isDraft;

  /// GitHub 原始文件路径
  final String rawPath;

  /// 作者
  final String? author;

  /// 收录于（丛书/系列）
  final String? collection;

  /// 年份
  final String? year;

  /// 现藏于
  final String? holder;

  const BookIndexItem({
    required this.id,
    required this.name,
    required this.type,
    required this.isDraft,
    required this.rawPath,
    this.author,
    this.collection,
    this.year,
    this.holder,
  });

  /// 获取类型的中文名称
  String get typeLabel {
    switch (type) {
      case BookResourceType.work:
        return '作品';
      case BookResourceType.collection:
        return '丛编';
      case BookResourceType.book:
        return '书';
    }
  }

  /// 获取状态标签
  String get statusLabel => isDraft ? '草稿' : '正式';

  /// 获取 GitHub 原始文件 URL
  String get rawUrl {
    final repo = isDraft ? 'book-index-draft' : 'book-index';
    return 'https://raw.githubusercontent.com/open-guji/$repo/main/$rawPath';
  }
}
