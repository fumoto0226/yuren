// User-defined catalog labels are separate from garment paint colors.
(() => {
  const storageKey = 'yuren-color-categories-v1';
  let state = { categories: [], assignments: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Array.isArray(saved.categories) && saved.assignments) {
      state.categories = saved.categories.filter(item =>
        typeof item.id === 'string' && typeof item.name === 'string' && /^#[0-9a-f]{6}$/i.test(item.color));
      state.assignments = saved.assignments;
      state.retainedCatalog = Array.isArray(saved.retainedCatalog) ? saved.retainedCatalog : [];
    }
  } catch {}
  const save = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch { status.textContent = '浏览器无法保存设置，本次修改仍可使用。'; }
  };
  const button = (text, className = '') => {
    const node = document.createElement('button');
    node.type = 'button';
    node.textContent = text;
    node.className = className;
    return node;
  };
  const toolbar = document.createElement('div');
  toolbar.className = 'color-category-toolbar';
  const manage = button('颜色分类');
  manage.setAttribute('aria-label', '颜色分类');
  manage.setAttribute('aria-expanded', 'false');
  const preview = document.createElement('span');
  preview.className = 'color-category-preview';
  manage.append(preview);
  toolbar.append(manage);
  document.querySelector('.catalog-total').append(toolbar);

  const panel = document.createElement('section');
  panel.className = 'color-category-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', '管理颜色分类');
  const heading = document.createElement('div');
  heading.className = 'color-category-heading';
  const title = document.createElement('strong');
  title.textContent = '颜色分类';
  const close = button('×');
  close.setAttribute('aria-label', '关闭颜色分类');
  const transferActions = document.createElement('span');
  transferActions.className = 'color-category-transfer-actions';
  const importButton = button('导入 JSON');
  const exportButton = button('导出 JSON');
  transferActions.append(importButton, exportButton);
  heading.append(title, transferActions, close);
  const rows = document.createElement('div');
  const form = document.createElement('form');
  form.className = 'color-category-form';
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = '#4e9dd9';
  colorInput.setAttribute('aria-label', '新分类颜色');
  const nameInput = document.createElement('input');
  nameInput.placeholder = '分类名称';
  nameInput.required = true;
  nameInput.maxLength = 30;
  nameInput.setAttribute('aria-label', '新分类名称');
  const add = button('添加分类');
  add.type = 'submit';
  form.append(colorInput, nameInput, add);
  const status = document.createElement('p');
  status.className = 'color-category-status';
  status.setAttribute('role', 'status');
  const importPreview = document.createElement('section');
  importPreview.className = 'color-category-import-preview';
  importPreview.hidden = true;
  panel.append(heading, rows, form, importPreview, status);
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.hidden = true;
  panel.append(fileInput);
  const resetImport = () => {
    importPreview.replaceChildren();
    importPreview.hidden = true;
  };
  exportButton.addEventListener('click', () => {
    const data = ColorCategoryTransfer.pack(state, decorationCatalog, decorationStyleGroups);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'yuren-color-categories-' + new Date().toISOString().slice(0, 10) + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = '已导出分类、卡片标记和目录快照。';
  });
  importButton.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    fileInput.value = '';
    resetImport();
    try {
      if (file.size > 2 * 1024 * 1024) throw Error('文件超过 2 MB，请检查是否选对了分类文件。');
      const result = ColorCategoryTransfer.inspect(JSON.parse(await file.text()), decorationCatalog, decorationStyleGroups);
      const summary = document.createElement('p');
      summary.textContent = '导入 ' + result.state.categories.length + ' 个分类，可应用 ' + result.applied + ' 个卡片标记。确认后将替换当前分类及标记。';
      importPreview.append(summary);
      const notes = document.createElement('p');
      notes.textContent = '按内部 ID 匹配，名称、造型或配色更新后使用本站当前版本。当前版本新增项目保持无分类。';
      importPreview.append(notes);
      const detail = (label, values) => {
        if (!values.length) return;
        const section = document.createElement('details');
        const title = document.createElement('summary');
        title.textContent = label + '（' + values.length + '）';
        const list = document.createElement('ul');
        for (const value of values) {
          const item = document.createElement('li');
          item.textContent = value;
          list.append(item);
        }
        section.append(title, list);
        importPreview.append(section);
      };
      detail('本站找不到，暂不显示，标记仍保留以便以后恢复', result.missing);
      detail('本站新增项目，文件中没有记录', result.added);
      detail('名称更新，继续匹配', result.renamed);
      detail('所属分类变更，已自动匹配', result.moved);
      detail('款式包含的配色有变化，款式标记继续保留', result.changedStyles);
      const controls = document.createElement('div');
      controls.className = 'color-category-transfer-actions';
      const confirm = button('确认替换并导入');
      const cancel = button('取消');
      confirm.addEventListener('click', event => {
        event.stopPropagation();
        state = result.state;
        hidePicker();
        save();
        renderManager();
        refreshCards();
        resetImport();
        status.textContent = '已导入，可应用 ' + result.applied + ' 个标记，暂存未匹配标记 ' + result.missing.length + ' 个。';
      });
      cancel.addEventListener('click', event => {
        event.stopPropagation();
        resetImport();
        status.textContent = '已取消导入。';
      });
      controls.append(confirm, cancel);
      importPreview.append(controls);
      importPreview.hidden = false;
      status.textContent = '请检查导入预览，再确认。';
    } catch (error) {
      status.textContent = error instanceof SyntaxError ? 'JSON 文件无法解析，请检查文件内容。' : error.message;
    }
  });
  document.body.append(panel);
  let picker;
  const hidePicker = () => { picker?.remove(); picker = null; };
  const hidePanel = () => {
    panel.hidden = true;
    manage.setAttribute('aria-expanded', 'false');
  };
  manage.addEventListener('click', () => {
    hidePicker();
    panel.hidden = !panel.hidden;
    manage.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) nameInput.focus();
  });
  close.addEventListener('click', hidePanel);

  function renderManager() {
    rows.replaceChildren();
    preview.replaceChildren();
    if (!state.categories.length) {
      const empty = document.createElement('p');
      empty.textContent = '还没有颜色分类';
      rows.append(empty);
    }
    for (const category of state.categories) {
      const dot = document.createElement('i');
      dot.style.background = category.color;
      dot.title = category.name;
      preview.append(dot);
      const row = document.createElement('div');
      row.className = 'color-category-row';
      const color = document.createElement('input');
      color.type = 'color';
      color.value = category.color;
      color.setAttribute('aria-label', category.name + '的颜色');
      const name = document.createElement('input');
      name.value = category.name;
      name.maxLength = 30;
      name.setAttribute('aria-label', category.name + '的名称');
      color.addEventListener('input', () => {
        category.color = color.value;
        save();
        refreshCards();
        dot.style.background = category.color;
      });
      name.addEventListener('change', () => {
        const value = name.value.trim();
        if (!value) { name.value = category.name; return; }
        category.name = value;
        save();
        renderManager();
        refreshCards();
      });
      const remove = button('删除');
      remove.setAttribute('aria-label', '删除' + category.name);
      remove.addEventListener('click', event => {
        event.stopPropagation();
        const actions = document.createElement('span');
        actions.className = 'color-category-delete-confirm';
        const confirm = button('✓');
        confirm.setAttribute('aria-label', '确认删除' + category.name);
        confirm.title = '确认删除分类并清除相关卡片标记';
        const cancel = button('×');
        cancel.setAttribute('aria-label', '取消删除' + category.name);
        cancel.title = '取消删除';
        confirm.addEventListener('click', event => {
          event.stopPropagation();
          state.categories = state.categories.filter(item => item.id !== category.id);
          for (const key of Object.keys(state.assignments)) {
            if (state.assignments[key] === category.id) delete state.assignments[key];
          }
          hidePicker();
          save();
          renderManager();
          refreshCards();
        });
        cancel.addEventListener('click', event => {
          event.stopPropagation();
          actions.replaceWith(remove);
          remove.focus();
        });
        actions.append(confirm, cancel);
        remove.replaceWith(actions);
        confirm.focus();
      });
      row.append(color, name, remove);
      rows.append(row);
    }
    manage.title = state.categories.map(item => item.name + ' ' + item.color).join('\n') || '添加颜色和分类名称';
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    state.categories.push({ id: crypto.randomUUID(), name, color: colorInput.value });
    nameInput.value = '';
    save();
    renderManager();
    refreshCards();
    nameInput.focus();
  });

  function showPicker(anchor, key) {
    hidePicker();
    hidePanel();
    picker = document.createElement('div');
    picker.className = 'color-category-picker';
    picker.addEventListener('pointerdown', event => event.stopPropagation());
    picker.setAttribute('role', 'dialog');
    picker.setAttribute('aria-label', '选择颜色分类');
    const options = [{ id: '', name: '无分类', color: '#ffffff' }, ...state.categories];
    for (const category of options) {
      const choice = button('', 'color-category-choice');
      const dot = document.createElement('i');
      dot.style.background = category.color;
      const name = document.createElement('span');
      name.textContent = category.name;
      choice.append(dot, name);
      choice.setAttribute('aria-pressed', String((state.assignments[key] || '') === category.id));
      choice.addEventListener('click', event => {
        event.stopPropagation();
        if (category.id) state.assignments[key] = category.id;
        else delete state.assignments[key];
        save();
        hidePicker();
        refreshCards();
        anchor.focus();
      });
      picker.append(choice);
    }
    const edit = button('管理颜色分类');
    edit.addEventListener('click', () => { hidePicker(); manage.click(); });
    picker.append(edit);
    document.body.append(picker);
    const rect = anchor.getBoundingClientRect();
    const box = picker.getBoundingClientRect();
    picker.style.left = Math.max(8, Math.min(rect.left, innerWidth - box.width - 8)) + 'px';
    picker.style.top = Math.max(8, Math.min(rect.bottom + 6, innerHeight - box.height - 8)) + 'px';
  }

  function refreshCards() {
    document.querySelectorAll('[data-decoration-options] .decoration-option, .variant-menu-options .decoration-option').forEach(card => {
      const value = card.dataset.baseStyle || card.dataset.variant || card.dataset.option;
      if (!value || value === 'none') return;
      const menu = card.closest('[data-category][data-style]');
      const category = menu?.dataset.category || activeDecorationCategory;
      const kind = card.dataset.baseStyle ? 'style' : 'item';
      const key = category + ':' + kind + ':' + value;
      const host = card.closest('.decoration-style-card') || card;
      const selected = state.categories.find(item => item.id === state.assignments[key]);
      host.classList.toggle('has-color-category', !!selected);
      if (selected) host.style.setProperty('--category-color', selected.color);
      else host.style.removeProperty('--category-color');
      let swatch = card.querySelector('.card-category-swatch');
      if (!swatch) {
        // Stop the swatch action before the catalog handles a wear selection.
        swatch = document.createElement('span');
        swatch.className = 'card-category-swatch';
        swatch.setAttribute('role', 'button');
        swatch.tabIndex = 0;
        card.append(swatch);
        const open = event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          showPicker(swatch, swatch.dataset.key);
        };
        swatch.addEventListener('click', open);
        swatch.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') open(event);
        });
      }
      swatch.dataset.key = key;
      swatch.style.background = selected?.color || '#ffffff';
      swatch.title = selected ? '颜色分类：' + selected.name : '选择颜色分类';
      swatch.setAttribute('aria-label', swatch.title);
    });
  }
  document.addEventListener('click', event => {
    if (picker && !picker.contains(event.target) && !event.target.closest('.card-category-swatch')) hidePicker();
    if (!panel.hidden && !panel.contains(event.target) && !toolbar.contains(event.target)) hidePanel();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { hidePicker(); hidePanel(); }
  });
  new MutationObserver(() => {
    if (picker && !document.contains(document.querySelector('.card-category-swatch:focus'))) hidePicker();
    refreshCards();
  }).observe(document.querySelector('[data-decoration-options]'), { childList: true });
  new MutationObserver(records => {
    if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && node.matches('.decoration-variant-menu')))) refreshCards();
  }).observe(document.body, { childList: true });
  renderManager();
  refreshCards();
})();
