// Portable category labels. Catalog snapshots contain identifiers and names only.
const ColorCategoryTransfer = (() => {
  const format = 'yuren-color-categories';
  function manifest(catalog, groups) {
    const entries = [];
    for (const [category, items] of Object.entries(catalog)) {
      for (const item of items) entries.push({
        key: category + ':item:' + item.id, name: item.name,
      });
      for (const [id, name, members] of groups[category] || []) entries.push({
        key: category + ':style:' + id, name, members: [...members],
      });
    }
    return entries;
  }
  function pack(state, catalog, groups) {
    const current = manifest(catalog, groups);
    const currentKeys = new Set(current.map(item => item.key));
    const retained = (state.retainedCatalog || []).filter(item => !currentKeys.has(item.key));
    return {
      format, version: 1, exportedAt: new Date().toISOString(),
      categories: state.categories.map(item => ({ ...item })),
      assignments: { ...state.assignments },
      catalog: [...current, ...retained],
    };
  }
  function inspect(data, catalog, groups) {
    if (!data || data.format !== format || data.version !== 1) {
      throw Error('文件格式或版本不支持，请使用本站导出的颜色分类 JSON。');
    }
    if (!Array.isArray(data.categories) || data.categories.length > 1000 ||
        !data.assignments || typeof data.assignments !== 'object' || Array.isArray(data.assignments) ||
        !Array.isArray(data.catalog) || data.catalog.length > 10000) {
      throw Error('分类文件结构不完整。');
    }
    const categoryIds = new Set();
    const categories = data.categories.map(item => {
      if (!item || typeof item.id !== 'string' || !item.id || categoryIds.has(item.id) ||
          typeof item.name !== 'string' || !item.name.trim() || item.name.length > 100 ||
          typeof item.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(item.color)) {
        throw Error('分类名称、颜色或 ID 无效，请检查文件。');
      }
      categoryIds.add(item.id);
      return { id: item.id, name: item.name.trim(), color: item.color };
    });
    const keyValid = key => typeof key === 'string' &&
      /^[a-z-]+:(item|style):[a-zA-Z0-9_-]+$/.test(key);
    const source = new Map();
    for (const item of data.catalog) {
      if (!item || !keyValid(item.key) || typeof item.name !== 'string' || source.has(item.key) ||
          (item.members !== undefined && (!Array.isArray(item.members) ||
           item.members.some(id => typeof id !== 'string')))) throw Error('目录快照无效。');
      source.set(item.key, item);
    }
    const current = manifest(catalog, groups);
    const currentByKey = new Map(current.map(item => [item.key, item]));
    const assignmentEntries = Object.entries(data.assignments);
    if (assignmentEntries.length > 10000) throw Error('文件中的标记数量过多。');
    const assignments = new Map();
    const missing = [], renamed = [], moved = [], changedStyles = [];
    let applied = 0;
    const migratedKeys = new Set();
    for (const [key, categoryId] of assignmentEntries) {
      if (!keyValid(key) || !categoryIds.has(categoryId)) throw Error('存在无效的分类标记。');
      const previous = source.get(key);
      let target = currentByKey.get(key);
      if (!target) {
        const [, kind, id] = key.split(':');
        // A single stable item ID may move to another wardrobe category.
        const matches = current.filter(item => {
          const [, currentKind, currentId] = item.key.split(':');
          return kind === 'item' && currentKind === kind && currentId === id;
        });
        if (matches.length === 1) target = matches[0];
      }
      if (!target) {
        missing.push(previous?.name || key);
        // Keep unmatched labels so a later matching website can recover them.
        assignments.set(key, categoryId);
        continue;
      }
      if (assignments.has(target.key) && assignments.get(target.key) !== categoryId) {
        throw Error('多个旧标记指向同一项目且分类不同，请先处理冲突。');
      }
      assignments.set(target.key, categoryId);
      applied++;
      if (key !== target.key) {
        migratedKeys.add(target.key);
        moved.push((previous?.name || key) + ' → ' + target.key.split(':')[0]);
      }
      if (previous && previous.name !== target.name) renamed.push(previous.name + ' → ' + target.name);
      if (previous?.members && target.members &&
          JSON.stringify(previous.members) !== JSON.stringify(target.members)) changedStyles.push(target.name);
    }
    const added = current.filter(item => !source.has(item.key) && !migratedKeys.has(item.key));
    // Preserve the old names for unmatched labels in the next export.
    const retained = data.catalog.filter(item => !currentByKey.has(item.key));
    return {
      state: { categories, assignments: Object.fromEntries(assignments), retainedCatalog: retained },
      applied, missing, renamed, moved, changedStyles, added: added.map(item => item.name),
    };
  }
  return { manifest, pack, inspect };
})();
