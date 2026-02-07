# Migration Guide: Upgrading from 0.1.x to 0.2.0‑preview

Version **0.2.0‑preview** introduces a more coherent public API surface, a unified configuration model, and a cleaner initialization pipeline. Because these improvements required structural changes, several breaking changes were introduced. This guide walks you through everything you need to update when migrating from **0.1.x**.

---

## Table of Contents

1. [Overview](#overview)
2. [Breaking Changes](#breaking-changes)
   - [1. New `MonacoOptions` model](#1-new-monacooptions-model)
   - [2. Lifecycle callback renames](#2-lifecycle-callback-renames)
   - [3. CSS IntelliSense parameter rename](#3-css-intellisense-parameter-rename)
   - [4. JavaScript API changes](#4-javascript-api-changes)
   - [5. Initialization pipeline changes](#5-initialization-pipeline-changes)
3. [Before/After Examples](#beforeafter-examples)
4. [Summary](#summary)

---

## Overview

The **0.2.0‑preview** release focuses on:

- A unified, Blazor‑first configuration model (`MonacoOptions`)
- Clearer lifecycle semantics
- Improved naming consistency
- A more predictable initialization flow
- Cleaner CSS IntelliSense inputs
- Minimal but meaningful JavaScript enhancements

These changes improve long‑term maintainability and developer experience.

---

## Breaking Changes

### 1. New `MonacoOptions` model

Monaco configuration is now provided through a strongly‑typed options object.

**Before:**

```razor
<MonacoMarkdownEditor Minimap="false" WordWrap="true" />
```

**After:**

```razor
<MonacoMarkdownEditor Options="new MonacoOptions {
    Minimap = false,
    WordWrap = true
}" />
```

All Monaco‑related parameters must now be supplied through `Options`.

---

### 2. Lifecycle callback renames

Two lifecycle hooks were renamed for clarity and consistency.

| Old Name                | New Name          |
|-------------------------|-------------------|
| `OnBeforeMonacoCreated` | `BeforeCreated`   |
| `OnMonacoInitialized`   | `AfterInitialized`|

**Before:**

```razor
<MonacoMarkdownEditor OnMonacoInitialized="HandleInit" />
```

**After:**

```razor
<MonacoMarkdownEditor AfterInitialized="HandleInit" />
```

---

### 3. CSS IntelliSense parameter rename

The `Css` parameter (used for IntelliSense input) has been renamed to:

```csharp
AdditionalCss
```

This avoids confusion with the CSS editor component and clarifies its purpose.

**Before:**

```razor
<MonacoMarkdownEditor Css="@projectCss" />
```

**After:**

```razor
<MonacoMarkdownEditor AdditionalCss="@projectCss" />
```

---

### 4. JavaScript API changes

Two new JS functions were added:

- `monacoMarkdownEditor.enableFrontMatter`
- `monacoMarkdownEditor.setOption`

These support the new `MonacoOptions` model and front‑matter toggle.

If you override or wrap the JS module, ensure these functions exist.

---

### 5. Initialization pipeline changes

The editor now applies Monaco options **before** calling `monacoMarkdownEditor.init`.

This ensures:

- Predictable lifecycle ordering  
- Consistent editor configuration  
- Cleaner separation between configuration and initialization  

If you relied on the previous ordering, adjust your initialization logic accordingly.

---

## Before/After Examples

### Example: Basic Editor Setup

**Before (0.1.x):**

```razor
<MonacoMarkdownEditor
    Css="@css"
    OnMonacoInitialized="HandleInit"
    OnBeforeMonacoCreated="HandleBefore"
/>
```

**After (0.2.0‑preview):**

```razor
<MonacoMarkdownEditor
    AdditionalCss="@css"
    AfterInitialized="HandleInit"
    BeforeCreated="HandleBefore"
    Options="new MonacoOptions { WordWrap = true }"
/>
```

---

### Example: Applying Monaco Configuration

**Before:**

```razor
<MonacoMarkdownEditor Minimap="false" />
```

**After:**

```razor
<MonacoMarkdownEditor Options="new MonacoOptions { Minimap = false }" />
```

---

### Example: Front‑Matter Support

**New in 0.2.0‑preview:**

```razor
<MonacoMarkdownEditor Options="new MonacoOptions {
    EnableFrontMatter = true
}" />
```

---

## Summary

Upgrading to **0.2.0‑preview** requires:

- Switching to the new `MonacoOptions` model  
- Updating lifecycle callback names  
- Renaming `Css` → `AdditionalCss`  
- Ensuring the updated JS module is in place  
- Adjusting any logic that depended on the old initialization order  

These changes provide a cleaner, more consistent, and more maintainable foundation for future releases.

---