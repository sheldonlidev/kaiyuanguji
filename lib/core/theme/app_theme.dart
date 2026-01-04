import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// 应用主题配置
/// 实现古籍风格的视觉设计系统
class AppTheme {
  // 禁止实例化
  AppTheme._();

  /// 宣纸色背景（米黄色，缓解长时间阅读疲劳）
  static const Color paperBackground = Color(0xFFF5F2E9);

  /// 墨黑色文字
  static const Color inkBlack = Color(0xFF2C2C2C);

  /// 朱砂红强调色（用于按钮、重点节点）
  static const Color vermilionRed = Color(0xFF8B0000);

  /// 浅灰色（用于次要文本）
  static const Color secondaryGray = Color(0xFF666666);

  /// 边框颜色
  static const Color borderColor = Color(0xFFD4CFC0);

  /// 获取应用的 ThemeData
  static ThemeData get themeData {
    return ThemeData(
      // 基础颜色方案
      colorScheme: ColorScheme.light(
        primary: vermilionRed,
        onPrimary: paperBackground,
        secondary: inkBlack,
        onSecondary: paperBackground,
        surface: paperBackground,
        onSurface: inkBlack,
      ),

      // 脚手架背景色
      scaffoldBackgroundColor: paperBackground,

      // 应用栏主题
      appBarTheme: AppBarTheme(
        backgroundColor: paperBackground,
        foregroundColor: inkBlack,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: GoogleFonts.notoSerifSc(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: inkBlack,
          letterSpacing: 2.0,
        ),
      ),

      // 文本主题 - 使用思源宋体（Google Fonts 的 Noto Serif SC）
      textTheme: TextTheme(
        displayLarge: GoogleFonts.notoSerifSc(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: inkBlack,
          height: 1.5,
        ),
        displayMedium: GoogleFonts.notoSerifSc(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: inkBlack,
          height: 1.5,
        ),
        displaySmall: GoogleFonts.notoSerifSc(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: inkBlack,
          height: 1.5,
        ),
        headlineLarge: GoogleFonts.notoSerifSc(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          color: inkBlack,
          height: 1.6,
        ),
        headlineMedium: GoogleFonts.notoSerifSc(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: inkBlack,
          height: 1.6,
        ),
        headlineSmall: GoogleFonts.notoSerifSc(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: inkBlack,
          height: 1.6,
        ),
        bodyLarge: GoogleFonts.notoSerifSc(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          color: inkBlack,
          height: 1.8,
          letterSpacing: 0.5,
        ),
        bodyMedium: GoogleFonts.notoSerifSc(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          color: inkBlack,
          height: 1.8,
          letterSpacing: 0.5,
        ),
        bodySmall: GoogleFonts.notoSerifSc(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          color: secondaryGray,
          height: 1.6,
        ),
        labelLarge: GoogleFonts.notoSerifSc(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: inkBlack,
        ),
      ),

      // 卡片主题
      cardTheme: CardThemeData(
        color: paperBackground,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: BorderSide(color: borderColor, width: 1),
        ),
      ),

      // 分割线主题
      dividerTheme: DividerThemeData(
        color: borderColor,
        thickness: 1,
        space: 24,
      ),

      // 图标主题
      iconTheme: IconThemeData(
        color: inkBlack,
        size: 24,
      ),

      // 按钮主题
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: vermilionRed,
          foregroundColor: paperBackground,
          elevation: 2,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
          ),
          textStyle: GoogleFonts.notoSerifSc(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: vermilionRed,
          textStyle: GoogleFonts.notoSerifSc(
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  /// 获取响应式的内容最大宽度
  static double getContentMaxWidth(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    if (screenWidth > 1200) {
      return 800; // 桌面端
    } else if (screenWidth > 600) {
      return 600; // 平板
    } else {
      return screenWidth * 0.9; // 手机端
    }
  }

  /// 获取响应式的内容边距
  static EdgeInsets getContentPadding(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    if (screenWidth > 1200) {
      return const EdgeInsets.all(48);
    } else if (screenWidth > 600) {
      return const EdgeInsets.all(32);
    } else {
      return const EdgeInsets.all(16);
    }
  }
}
