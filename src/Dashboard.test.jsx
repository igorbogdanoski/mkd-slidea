import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from './views/Dashboard';
import { BrowserRouter } from 'react-router-dom';

describe('Dashboard Component', () => {
  it('renders correctly and shows welcome message', () => {
    render(
      <BrowserRouter>
        <Dashboard setView={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Добредојде, Игор Богданоски/i)).toBeInTheDocument();
  });

  it('contains the analytics menu item', () => {
    render(
      <BrowserRouter>
        <Dashboard setView={vi.fn()} />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Аналитика/i)).toBeInTheDocument();
  });
});
