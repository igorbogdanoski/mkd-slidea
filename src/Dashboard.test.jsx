import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from './views/Dashboard';
import { BrowserRouter } from 'react-router-dom';

describe('Dashboard Component', () => {
  it('renders the MKD Slidea logo in the sidebar', () => {
    render(
      <BrowserRouter>
        <Dashboard setView={vi.fn()} />
      </BrowserRouter>
    );
    // Sidebar brand name is always rendered regardless of auth state
    expect(screen.getAllByText(/MKD Slidea/i)[0]).toBeInTheDocument();
  });

  it('contains the analytics navigation item', () => {
    render(
      <BrowserRouter>
        <Dashboard setView={vi.fn()} />
      </BrowserRouter>
    );
    // Multiple elements may match (desktop sidebar + mobile nav) — getAllByText handles that
    const items = screen.getAllByText(/Аналитика/i);
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
