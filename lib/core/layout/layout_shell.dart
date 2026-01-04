import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

/// 统一的页面布局框架
/// 提供响应式导航栏和页面结构
class LayoutShell extends StatelessWidget {
  /// 页面主体内容
  final Widget child;

  /// 当前页面标题（可选）
  final String? title;

  /// 是否显示返回按钮
  final bool showBackButton;

  const LayoutShell({
    super.key,
    required this.child,
    this.title,
    this.showBackButton = false,
  });

  @override
  Widget build(BuildContext context) {
    // 判断是否为移动端
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      backgroundColor: AppTheme.paperBackground,
      appBar: _buildAppBar(context, isMobile),
      drawer: isMobile ? _buildDrawer(context) : null,
      body: child,
    );
  }

  /// 构建顶部导航栏
  PreferredSizeWidget _buildAppBar(BuildContext context, bool isMobile) {
    return AppBar(
      backgroundColor: AppTheme.paperBackground,
      elevation: 0,
      centerTitle: false,
      leading: showBackButton
          ? IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: () => context.pop(),
            )
          : (isMobile
              ? null // 移动端使用默认的 Drawer 按钮
              : IconButton(
                  icon: Icon(
                    Icons.book,
                    color: AppTheme.vermilionRed,
                  ),
                  onPressed: () => context.go('/'),
                  tooltip: '返回首页',
                )),
      title: isMobile
          ? _buildLogoText(context)
          : _buildLogoText(context),
      actions: isMobile ? null : _buildDesktopActions(context),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(
          height: 1,
          color: AppTheme.borderColor,
        ),
      ),
    );
  }

  /// Logo文字组件（仅文字，用于AppBar title）
  Widget _buildLogoText(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go('/'),
      child: Text(
        '开源古籍',
        style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: AppTheme.inkBlack,
              fontWeight: FontWeight.bold,
              letterSpacing: 2.0,
            ),
      ),
    );
  }

  /// 桌面端导航按钮
  List<Widget> _buildDesktopActions(BuildContext context) {
    return [
      _buildNavButton(context, '排版', '/read/phase1'),
      _buildNavButton(context, '校对', '/read/phase2'),
      _buildNavButton(context, 'OCR', '/read/phase3'),
      _buildNavButton(context, '共享', '/read/phase4'),
      _buildNavButton(context, '图谱', '/read/phase5'),
      const SizedBox(width: 16),
    ];
  }

  /// 单个导航按钮
  Widget _buildNavButton(BuildContext context, String label, String route) {
    final currentRoute = GoRouterState.of(context).uri.toString();
    final isActive = currentRoute == route ||
        (route != '/' && currentRoute.startsWith(route));

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: TextButton(
        onPressed: () => context.go(route),
        style: TextButton.styleFrom(
          foregroundColor:
              isActive ? AppTheme.vermilionRed : AppTheme.inkBlack,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            letterSpacing: 1.0,
          ),
        ),
      ),
    );
  }

  /// 移动端抽屉菜单
  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: AppTheme.paperBackground,
      child: SafeArea(
        child: Column(
          children: [
            // 抽屉头部
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: AppTheme.borderColor,
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.book,
                    color: AppTheme.vermilionRed,
                    size: 32,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '开源古籍',
                      style:
                          Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2.0,
                              ),
                    ),
                  ),
                ],
              ),
            ),

            // 导航菜单
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _buildDrawerItem(context, Icons.home, '首页', '/'),
                  const Divider(height: 1),
                  _buildDrawerSectionHeader(context, '项目路线图'),
                  _buildDrawerItem(
                      context, Icons.text_format, '排版', '/read/phase1'),
                  _buildDrawerItem(
                      context, Icons.edit, '校对', '/read/phase2'),
                  _buildDrawerItem(
                      context, Icons.document_scanner, 'OCR', '/read/phase3'),
                  _buildDrawerItem(
                      context, Icons.share, '共享', '/read/phase4'),
                  _buildDrawerItem(
                      context, Icons.account_tree, '图谱', '/read/phase5'),
                  const Divider(height: 1),
                  _buildDrawerSectionHeader(context, '其他'),
                  _buildDrawerItem(
                      context, Icons.description, '示例章节', '/read/chapter_1'),
                ],
              ),
            ),

            // 底部信息
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: AppTheme.borderColor,
                    width: 1,
                  ),
                ),
              ),
              child: Text(
                '开源古籍项目\n让古籍数字化更简单',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      height: 1.6,
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 抽屉菜单分组标题
  Widget _buildDrawerSectionHeader(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.secondaryGray,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
            ),
      ),
    );
  }

  /// 抽屉菜单项
  Widget _buildDrawerItem(
    BuildContext context,
    IconData icon,
    String label,
    String route,
  ) {
    final currentRoute = GoRouterState.of(context).uri.toString();
    final isActive = currentRoute == route ||
        (route != '/' && currentRoute.startsWith(route));

    return ListTile(
      leading: Icon(
        icon,
        color: isActive ? AppTheme.vermilionRed : AppTheme.inkBlack,
        size: 20,
      ),
      title: Text(
        label,
        style: TextStyle(
          color: isActive ? AppTheme.vermilionRed : AppTheme.inkBlack,
          fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
          fontSize: 14,
          letterSpacing: 0.5,
        ),
      ),
      selected: isActive,
      selectedTileColor: AppTheme.vermilionRed.withValues(alpha: 0.05),
      onTap: () {
        context.go(route);
        Navigator.of(context).pop(); // 关闭抽屉
      },
    );
  }
}
