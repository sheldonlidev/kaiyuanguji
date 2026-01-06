import 'package:flutter/material.dart';
import '../../../../../core/theme/app_theme.dart';

/// 通用章节头部
class SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const SectionHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        GestureDetector(
          onTap: onTap,
          child: MouseRegion(
            cursor: onTap != null
                ? SystemMouseCursors.click
                : MouseCursor.defer,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    letterSpacing: 4,
                    fontWeight: FontWeight.bold,
                    color: onTap != null ? AppTheme.vermilionRed : null,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (onTap != null) ...[
                  const SizedBox(width: 8),
                  const Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: AppTheme.vermilionRed,
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          subtitle,
          style: Theme.of(
            context,
          ).textTheme.bodyLarge?.copyWith(color: AppTheme.secondaryGray),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 16),
        Container(width: 40, height: 3, color: AppTheme.vermilionRed),
      ],
    );
  }
}
