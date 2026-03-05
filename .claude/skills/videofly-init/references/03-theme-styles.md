# Step 3: Theme & Style Configuration

使用 tweakcn 主题生成器创建完整的主题配色，替换到 `src/styles/globals.css` 中。

## 方案: tweakcn 主题生成器

**推荐方式** — 使用 CLI 直接安装预制主题或自定义主题：

```bash
# 安装预制主题（示例：twitter 主题）
pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/twitter.json

# 或者访问编辑器自定义主题，然后复制 CSS 变量
# https://tweakcn.com/editor/theme
```

### 工作流

1. 根据用户的 `primaryColor`，在 tweakcn 编辑器中选择最接近的预设或自定义调色
2. **CLI 方式**：找到合适的预制主题 URL，运行 `pnpm dlx shadcn@latest add {theme-url}`
3. **手动方式**：在 https://tweakcn.com/editor/theme 中调整颜色，复制生成的 CSS 变量到 `globals.css`
4. 验证 dark mode 和 light mode 效果

### 推荐预制主题

根据品牌主色选择起点：

| 品牌色调 | 推荐主题 |
|---------|---------|
| 蓝色系 | twitter, ocean |
| 紫色系 | default (shadcn) |
| 绿色系 | emerald |
| 橙色/暖色系 | amber |

如果预制主题都不合适，在编辑器中用品牌色自定义。

## Target File

`src/styles/globals.css` — `:root` 和 `.dark` 块中的 CSS custom properties。

## What NOT to Change

- `--radius` 值
- `--shadow-*` 值（全部 8 级）
- `--font-sans`, `--font-heading`
- Animation keyframes
- `@theme inline` 块结构
- `@import` 语句

## 备用主题文件

项目中有三个备用主题在 `src/styles/themes/`：
- `emerald-dark.css`
- `modern-blue.css`
- `purple-gradient.css`

除非用户特别要求，不要修改这些文件。

## 验证

主题安装/修改后：
1. 运行 `pnpm dev` 查看效果
2. 检查 dark mode（默认）和 light mode 显示是否正常
3. 确认 landing page 各 section 的主题色跟随 `--primary` 自动适配（已在模板代码中使用 CSS 变量）
