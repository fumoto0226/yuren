# 项目任务指引

仅当任务涉及衣服、裤子、换装缩略图或服装与肢体的图层关系时，阅读 `CLOTHING_RULES.md`。其他任务无需阅读该文件。

仅当任务涉及动作库、录制动作、关键帧动画或动作节奏时，阅读 `MOTION_RULES.md`。其他任务无需阅读该文件。

涉及导出、提取、统计或复用本网站的服装款式、配色、花纹、装饰目录及相关素材数据时，先阅读 `EXPORT_RULES.md`。

## 本机 SVG 预览：避免 Inkscape 意外退出

- 本机的 ImageMagick 直接读取 `.svg` 时会自动调用 PATH 中的 Inkscape。已复现 `magick svg/red-tee.svg ...` 触发 Inkscape `SIGABRT`；2026-10-14 和 2026-10-16 的 macOS 崩溃报告均显示在启动时的 `RegisterApplication` / `gdk_quartz_display` 调用链中退出。不要用 `magick input.svg output.png` 批量预览，也不要反复重新打开崩溃弹窗来重试。
- 简单 SVG 临时预览，明确指定 ImageMagick 的内置渲染器：`magick 'msvg:svg/red-tee.svg' /tmp/red-tee.png`。这个命令已在本机验证可生成 PNG，且不会启动 Inkscape。SVG 语法检查可用 `xmllint --noout svg/red-tee.svg`。
- **MSVG 不适合确认本项目的最终视觉效果**：它对 `mask`、`clipPath` 等效果支持不完整，连体裤缩略图可能显示错误。含遮罩或裁切的服装，应在浏览器中查看原始 SVG 或实际页面；不要根据 MSVG 的失真图修改服装路径。
- 若确实需要 Inkscape 的导出功能，先在普通桌面会话里单独排查其启动问题；本项目生成缩略图只需运行 `node tests/generate-decoration-thumbnails.cjs`，该脚本直接写 SVG，不依赖 Inkscape。
- 参考：[ImageMagick 的 SVG 渲染器说明](https://imagemagick.org/formats/)及[强制使用 MSVG 的方法](https://usage.imagemagick.org/draw/)。
