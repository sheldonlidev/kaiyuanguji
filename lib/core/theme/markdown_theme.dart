import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_theme.dart';

/// Markdown 样式配置
/// 定制古籍风格的 Markdown 渲染样式
class MarkdownTheme {
  // 禁止实例化
  MarkdownTheme._();

  /// 获取 Markdown 样式表
  static MarkdownStyleSheet getStyleSheet(BuildContext context) {
    return MarkdownStyleSheet(
      // 段落样式
      p: GoogleFonts.notoSerifSc(
        fontSize: 16,
        height: 1.8,
        color: AppTheme.inkBlack,
        letterSpacing: 0.5,
      ),

      // 各级标题样式
      h1: GoogleFonts.notoSerifSc(
        fontSize: 28,
        fontWeight: FontWeight.bold,
        color: AppTheme.inkBlack,
        height: 1.5,
        letterSpacing: 2.0,
      ),
      h1Padding: const EdgeInsets.only(top: 24, bottom: 16),

      h2: GoogleFonts.notoSerifSc(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: AppTheme.inkBlack,
        height: 1.5,
        letterSpacing: 1.5,
      ),
      h2Padding: const EdgeInsets.only(top: 20, bottom: 12),

      h3: GoogleFonts.notoSerifSc(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: AppTheme.inkBlack,
        height: 1.5,
        letterSpacing: 1.0,
      ),
      h3Padding: const EdgeInsets.only(top: 16, bottom: 8),

      h4: GoogleFonts.notoSerifSc(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppTheme.inkBlack,
        height: 1.5,
      ),
      h4Padding: const EdgeInsets.only(top: 12, bottom: 8),

      h5: GoogleFonts.notoSerifSc(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppTheme.inkBlack,
        height: 1.5,
      ),

      h6: GoogleFonts.notoSerifSc(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppTheme.secondaryGray,
        height: 1.5,
      ),

      // 引用块样式（古籍批注风格）
      blockquote: GoogleFonts.notoSerifSc(
        fontSize: 14,
        fontStyle: FontStyle.italic,
        color: AppTheme.secondaryGray,
        height: 1.8,
      ),
      blockquotePadding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 12,
      ),
      blockquoteDecoration: BoxDecoration(
        color: AppTheme.paperBackground,
        border: Border(
          left: BorderSide(
            color: AppTheme.vermilionRed,
            width: 3,
          ),
        ),
      ),

      // 代码样式
      code: GoogleFonts.sourceCodePro(
        fontSize: 14,
        backgroundColor: const Color(0xFFECE9E0),
        color: AppTheme.inkBlack,
      ),

      codeblockPadding: const EdgeInsets.all(16),
      codeblockDecoration: BoxDecoration(
        color: const Color(0xFFECE9E0),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: AppTheme.borderColor,
          width: 1,
        ),
      ),

      // 列表样式
      listBullet: GoogleFonts.notoSerifSc(
        fontSize: 16,
        color: AppTheme.vermilionRed,
      ),

      // 链接样式
      a: GoogleFonts.notoSerifSc(
        fontSize: 16,
        color: AppTheme.vermilionRed,
        decoration: TextDecoration.underline,
      ),

      // 强调文本
      em: GoogleFonts.notoSerifSc(
        fontSize: 16,
        fontStyle: FontStyle.italic,
        color: AppTheme.inkBlack,
      ),

      strong: GoogleFonts.notoSerifSc(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: AppTheme.inkBlack,
      ),

      // 删除线
      del: GoogleFonts.notoSerifSc(
        fontSize: 16,
        decoration: TextDecoration.lineThrough,
        color: AppTheme.secondaryGray,
      ),

      // 表格样式
      tableHead: GoogleFonts.notoSerifSc(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: AppTheme.inkBlack,
      ),

      tableBody: GoogleFonts.notoSerifSc(
        fontSize: 14,
        color: AppTheme.inkBlack,
      ),

      tableBorder: TableBorder.all(
        color: AppTheme.borderColor,
        width: 1,
      ),

      // 水平分割线
      horizontalRuleDecoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: AppTheme.borderColor,
            width: 1,
          ),
        ),
      ),

      // 段落间距
      pPadding: const EdgeInsets.only(bottom: 12),

      // 列表间距
      listIndent: 24,
    );
  }

  /// 获取用于居中标题的样式表
  static MarkdownStyleSheet getCenteredStyleSheet(BuildContext context) {
    final baseStyleSheet = getStyleSheet(context);

    return baseStyleSheet.copyWith(
      h1Align: WrapAlignment.center,
      h2Align: WrapAlignment.center,
    );
  }

  /// 获取用于古籍正文的样式表（更大的字号和行距）
  static MarkdownStyleSheet getClassicTextStyleSheet(BuildContext context) {
    return getStyleSheet(context).copyWith(
      p: GoogleFonts.notoSerifSc(
        fontSize: 18,
        height: 2.0,
        color: AppTheme.inkBlack,
        letterSpacing: 1.0,
      ),
    );
  }
}
