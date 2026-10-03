# 论文书架

Jason 的个人论文网页库，共 50 份文档。

- 在线书架：<https://jasontao0507-pixel.github.io/paper-library/>
- 网站由 GitHub Pages 从 `main` 分支根目录发布。
- 手机阅读版 v2（2026-10-02），重点适配 iPhone 13 Pro Max 的横竖屏。

首页支持中文、英文题名及 DOI 搜索和排序。阅读页提供字号选择、章节目录与原图查看；正文图像保持原始比例，宽表格与公式在自身区域滚动。现有中英切换功能保留。

图片保持原始字节与清晰度。部分内嵌图片独立为可缓存的资源，以减少手机首次解析正文的负担。此网站是在线书架，未启用离线缓存服务。

## 后续维护

首页样式和交互位于 `shelf.css`、`shelf.js`，阅读层位于 `mobile-reader.css`、`mobile-reader.js`。新增阅读页应包含：

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<link rel="stylesheet" href="../../mobile-reader.css?v=20261002">
<script defer src="../../mobile-reader.js?v=20261002"></script>
```

`structures-and-mechanisms-of-the-northward-propagating-boreal-summer-intraseasonal-oscilla-f4463da5` 保留原有的严格内容安全策略，其阅读层与图片采用内嵌方式；更新共享阅读层时须同步该页的内嵌副本。其他阅读页共享外部资源。

页面保留 `noindex`，用于减少搜索引擎收录；这不影响通过链接访问。论文出版信息、来源及说明保留在各阅读页中。文献版权与许可归原作者或权利方；译文及导读仅供非商业学习与研究使用。
