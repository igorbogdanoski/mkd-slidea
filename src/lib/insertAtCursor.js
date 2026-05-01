// Sprint 19 — cursor-aware insertion helper used by MathSymbolPicker.
// Templates may include the marker `{|}` which is removed and replaced by the
// current selection (or an empty range), with the caret left at that position.
export const TOKEN = '{|}';

export function applyInsertion(currentValue, token, inputEl) {
  const value = currentValue ?? '';
  let start = value.length;
  let end = value.length;
  if (inputEl && typeof inputEl.selectionStart === 'number') {
    start = inputEl.selectionStart ?? value.length;
    end = inputEl.selectionEnd ?? value.length;
  }
  const selected = value.slice(start, end);

  let inserted;
  let caret;
  if (token.includes(TOKEN)) {
    const [head, tail] = token.split(TOKEN);
    inserted = `${head}${selected}${tail}`;
    caret = start + head.length + selected.length;
  } else {
    inserted = token;
    caret = start + token.length;
  }

  const next = `${value.slice(0, start)}${inserted}${value.slice(end)}`;
  return { next, caret };
}

export function insertIntoInput(inputEl, currentValue, token, setValue) {
  const { next, caret } = applyInsertion(currentValue, token, inputEl);
  setValue(next);
  if (inputEl) {
    requestAnimationFrame(() => {
      try {
        inputEl.focus();
        inputEl.setSelectionRange(caret, caret);
      } catch { /* ignore */ }
    });
  }
}
