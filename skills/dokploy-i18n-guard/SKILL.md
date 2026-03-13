---
name: dokploy-i18n-guard
description: Standardize Dokploy UI i18n. Use this skill whenever a user asks to add or change pages/components in apps/dokploy, or any UI copy (labels, buttons, empty states, toasts, dialogs, placeholders, headings). Enforce useTranslation+t() and update locale JSONs (en + zh-Hans). Trigger even if the user does not mention i18n or localization.
---

# Dokploy i18n Guard

This skill enforces the Dokploy i18n workflow for UI changes. It is designed to prevent hardcoded strings and ensure new UI copy is translated into the required locales.

## Scope

Apply this skill to any UI work inside `apps/dokploy`, including new pages, components, layouts, and refactors that change user-facing copy.

## Required i18n flow

1. Import and use `useTranslation` from `apps/dokploy/hooks/translation-provider.tsx`.
2. Replace any user-facing string with `t("namespace.key")`.
3. Add new keys to:
   - `apps/dokploy/public/locales/en/common.json`
   - `apps/dokploy/public/locales/zh-Hans/common.json`
4. Use `settings.json` instead of `common.json` only for settings pages.
5. For dynamic values, use `{param}` placeholders in JSON and pass params to `t(key, { param })`.

## Key naming

- Use dot-separated keys: `feature.section.element`.
- Prefer existing namespaces: `dashboard.*`, `menu.*`, `button.*`, `form.*`, `error.*`, `empty.*`.
- Avoid duplicates: check for an existing key before creating a new one.

## Output format (always include)

Use this exact Markdown section in your response:

```
## i18n Report
- Files updated: <list file paths>
- New keys: <comma-separated key list>
- en additions: <key=translation pairs>
- zh-Hans additions: <key=translation pairs>
- Notes: <edge cases, TODOs, or follow-ups>
```

## Example

**Component usage:**

```tsx
import { useTranslation } from "@/hooks/translation-provider";

const { t } = useTranslation();

return <h1>{t("projects.list.title")}</h1>;
```

**Locale additions:**

```json
{
  "projects.list.title": "Projects"
}
```

```json
{
  "projects.list.title": "项目"
}
```
