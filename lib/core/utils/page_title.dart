/// 页面标题工具
library;

/// 用于在 Web 平台上动态更新浏览器标签页标题
/// 使用条件导入以支持跨平台编译

export 'page_title_stub.dart' if (dart.library.js_interop) 'page_title_web.dart';
