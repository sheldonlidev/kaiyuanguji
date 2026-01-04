---
title: 第一阶段：中文古籍排版支持
author: 开源古籍团队
tags: [排版, LaTeX, Flutter]
---

# 第一阶段：中文古籍排版支持

> 实现符合古籍审美与学术规范的数字动态排版

---

## 核心目标

通过深度定制 LaTeX 宏包和 Flutter 渲染引擎，实现专业级的古籍排版系统，还原传统线装书的视觉美感和阅读体验。

---

## 技术路线

### 1. LaTeX 宏包深度定制

我们基于 LaTeX 强大的排版引擎，开发了专门针对中文古籍的扩展宏包：

#### 核心功能
- **纵排支持 (Vertical Layout)**: 从右至左、从上至下的传统阅读方向
- **双行小注 (Warichu)**: 在正文行间插入注释，不破坏版面整体感
- **版式边框**: 支持四周单边、黑口、象眼等传统装帧元素
- **界栏装饰**: 鱼尾、书耳等古籍特色元素

#### 排版样式
```latex
\usepackage{ancientbook}
\setverticaltext{true}
\setbookstyle{songban}  % 宋版风格
```

### 2. Flutter 跨平台渲染

虽然 LaTeX 擅长生成高质量的 PDF，但我们需要在移动端和 Web 端提供动态、可交互的阅读体验。

#### 技术方案
- 使用 Flutter `CustomPainter` 和 `TextPainter` 实现纵排文本绘制
- 自定义布局算法，精确控制字距、行距
- 支持实时参数调整（字号、行距、边距）
- Canvas 实时重绘，提供流畅的视觉体验

---

## 关键功能

### 📚 标准化模板库

我们预设了多种经典古籍版式，开箱即用：

| 模板类型 | 特点 | 适用场景 |
|---------|------|---------|
| **宋版** | 字体端庄、版心规整 | 经史子集 |
| **明刻** | 刻工精细、字形秀丽 | 诗词文集 |
| **清稿本** | 手抄风格、批注丰富 | 学术研究 |
| **简排** | 简洁现代、便于阅读 | 普及读物 |

### ✏️ 句读与批注

- **圈点**: 在重要字词下方添加圈点符号
- **侧批**: 页面侧边添加评注文字
- **眉批**: 页眉位置记录心得
- **夹注**: 正文中插入小字注释

### 🔤 字体适配

集成开源古籍字体，确保生僻字正常显示：

- **思源宋体古籍版** (Noto Serif SC): 覆盖大量 CJK 扩展字符
- **全宋体**: 包含 9 万多汉字
- **花园明朝体**: 日本开发的开源字体，支持古汉字
- **龙爪体**: 手写风格，适合批注场景

---

## 技术实现

### 排版引擎架构

```
用户输入 (Markdown/LaTeX)
    ↓
内容解析器 (ContentParser)
    ↓
排版计算引擎 (LayoutEngine)
    ↓
Flutter 渲染层 (CustomPainter)
    ↓
多平台输出 (Web/iOS/Android/Desktop)
```

### 示例代码

```dart
// 使用古籍排版组件
AncientBookPage(
  content: '道可道，非常道。名可名，非常名。',
  style: BookStyle.songban,
  layout: VerticalLayout(
    lineSpacing: 1.8,
    charSpacing: 0.5,
  ),
  annotation: BookAnnotation(
    sideNote: '老子《道德经》首章',
    punctuation: true,
  ),
)
```

---

## 当前进展

✅ **已完成**
- 基础纵排文本渲染
- Markdown 内容加载与解析
- 古籍风格主题系统
- 响应式布局适配

🔨 **进行中**
- LaTeX 宏包开发
- 复杂版式渲染（双行小注、批注）
- 在线编辑器原型

📋 **待开发**
- 多种模板预设
- 导出为 PDF 功能
- 实时预览与参数调整

---

## 参考资料

- [LaTeX 纵排宏包文档](https://ctan.org/pkg/vertical)
- [思源宋体项目](https://github.com/adobe-fonts/source-han-serif)
- [中国古籍版式研究](https://example.com)

---

[← 返回首页](/) | [下一阶段：校对工具集 →](/read/phase2)
