import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useFocusTrap } from '../hooks/useFocusTrap';

// Every modal in the app calls useFocusTrap(isOpen, { onEscape: onClose }) —
// a fresh object literal, usually with an inline arrow inside it. The effect
// used to depend on that identity, so it re-ran on every render and moved
// focus back to the first focusable element: the ✕ button. Typing one
// character re-rendered the dialog and the caret vanished mid-word.
function Dialog({ open }) {
  const [text, setText] = useState('');
  // Deliberately a new object and a new function on every render — this is
  // exactly what the real call sites do.
  const trapRef = useFocusTrap(open, { onEscape: () => {} });
  if (!open) return null;
  return (
    <div ref={trapRef} role="dialog">
      <button type="button">Затвори</button>
      <input aria-label="Прашање" value={text} onChange={(e) => setText(e.target.value)} />
    </div>
  );
}

describe('focus survives typing', () => {
  it('does not steal focus back to the close button on re-render', () => {
    render(<Dialog open />);
    const input = screen.getByLabelText('Прашање');

    input.focus();
    expect(document.activeElement).toBe(input);

    // Each keystroke re-renders the dialog with a new onEscape identity.
    for (const ch of 'Здраво') {
      fireEvent.change(input, { target: { value: input.value + ch } });
      expect(document.activeElement, `focus lost after "${ch}"`).toBe(input);
    }

    expect(input.value).toBe('Здраво');
  });

  it('still puts initial focus inside the dialog when it opens', () => {
    render(<Dialog open />);
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });
});
