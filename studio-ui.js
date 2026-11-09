// Studio controls and grouped input edits; rendering stays in script.js.
(() => {
  document.querySelectorAll('[data-reset-control]').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      const input = document.querySelector(`[data-control="${button.dataset.resetControl}"]`);
      editCharacter(() => {
        input.value = 100;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  });
  document.querySelector('[data-action="reset-body"]').addEventListener('click', resetControls);
  document.querySelector('[data-action="randomize-body"]').addEventListener('click', randomizeControls);

  // One slider drag is one edit, regardless of how many input events it emits.
  Object.values(controls).forEach(input => {
    let before;
    const begin = () => { before ??= captureEditorState(); };
    input.addEventListener('pointerdown', begin);
    input.addEventListener('keydown', begin);
    input.addEventListener('change', () => {
      if (before) recordEditorChange(before);
      before = undefined;
    });
    input.addEventListener('blur', () => { before = undefined; });
  });

  const pngButton = document.querySelector('[data-action="export-png"]');
  const svgButton = document.querySelector('[data-action="export"]');
  const status = document.querySelector('.export-status');
  const syncReady = () => { pngButton.disabled = svgButton.disabled; };
  new MutationObserver(syncReady).observe(svgButton, { attributes: true, attributeFilter: ['disabled'] });
  syncReady();
  pngButton.addEventListener('click', async () => {
    const source = document.querySelector('#character svg');
    if (!source) return;
    pngButton.disabled = true;
    status.textContent = '正在生成 PNG…';
    let sourceUrl;
    try {
      const clone = source.cloneNode(true);
      clone.querySelector('#drag-layer')?.remove();
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      // Include artwork outside the original viewBox, including large hats and capes.
      const bounds = source.getBBox();
      const padding = 12;
      const width = bounds.width + padding * 2;
      const height = bounds.height + padding * 2;
      clone.setAttribute('viewBox', `${bounds.x-padding} ${bounds.y-padding} ${width} ${height}`);
      clone.setAttribute('width', Math.ceil(width * 3));
      clone.setAttribute('height', Math.ceil(height * 3));
      sourceUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
      const picture = new Image();
      picture.src = sourceUrl;
      await picture.decode();
      const canvas = document.createElement('canvas');
      canvas.width = picture.naturalWidth;
      canvas.height = picture.naturalHeight;
      canvas.getContext('2d').drawImage(picture, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG encoding failed');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'yuren.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = 'PNG 已导出';
    } catch (error) {
      console.error('PNG export failed', error);
      status.textContent = 'PNG 导出失败，请重试';
    } finally {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      syncReady();
    }
  });
})();
