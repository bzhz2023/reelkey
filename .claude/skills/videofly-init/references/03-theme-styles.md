# Step 3: Theme & Style Configuration

Generate a complete theme palette using tweakcn theme editor, apply to `src/styles/globals.css`.

## Approach: tweakcn Theme Editor

**Note**: tweakcn CLI (`pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/...`) is known to be unstable and frequently fails. **Prefer manual approach.**

### Workflow

1. Based on user's `primaryColor`, find the closest preset theme in tweakcn editor
2. **Recommended (manual copy)**:
   - Use WebFetch to fetch tweakcn editor page for preset theme CSS variables
   - Or visit https://tweakcn.com/editor/theme to select preset theme
   - Copy generated oklch CSS variables into `globals.css` `:root` and `.dark` blocks
3. **Fallback (CLI, may fail)**:
   - `pnpm dlx shadcn@latest add https://tweakcn.com/r/themes/{theme}.json`
   - If CLI fails, fall back to manual approach
4. **Last resort (hand-write oklch)**:
   - If above methods are unavailable, manually write oklch CSS variables based on brand color
   - Set `--primary` to brand color, derive other tokens via hue offsets
5. Verify dark mode and light mode appearance

### Recommended Preset Themes

Select starting point based on brand color:

| Color Family | Recommended Theme | Editor URL |
|-------------|------------------|-----------|
| Blue | twitter, ocean | tweakcn.com/editor/theme |
| Purple | default (shadcn) | tweakcn.com/editor/theme |
| Green | emerald | tweakcn.com/editor/theme |
| Orange / Warm | amber | tweakcn.com/editor/theme |

If no preset fits, customize in the editor using brand color.

## Target File

`src/styles/globals.css` — CSS custom properties in `:root` and `.dark` blocks.

## What NOT to Change

- `--radius` values
- `--shadow-*` values (all 8 levels)
- `--font-sans`, `--font-heading`
- Animation keyframes
- `@theme inline` block structure
- `@import` statements

## Alternative Theme Files

Project has three alternative themes in `src/styles/themes/`:
- `emerald-dark.css`
- `modern-blue.css`
- `purple-gradient.css`

Do not modify these unless user specifically requests.

## Verification

After theme install/modification:
1. Run `pnpm dev` to preview
2. Check dark mode (default) and light mode display
3. Confirm landing page sections auto-adapt to `--primary` (template code uses CSS variables)
