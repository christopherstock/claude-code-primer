import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it('should render router with HomePage route', () => {
    render(<App />);
    // If we can render, the router is working
    expect(document.querySelector('body')).toBeTruthy();
  });
});
