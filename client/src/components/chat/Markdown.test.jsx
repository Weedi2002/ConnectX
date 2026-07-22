import { render, screen } from '@testing-library/react';
import Markdown from './Markdown.jsx';

describe('Markdown', () => {
  it('renders plain text', () => {
    render(<Markdown>Hello world</Markdown>);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders links with target _blank', () => {
    render(<Markdown>[click](https://example.com)</Markdown>);
    const link = screen.getByRole('link', { name: 'click' });
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders inline code', () => {
    render(<Markdown>Use `console.log()`</Markdown>);
    expect(screen.getByText('console.log()')).toBeInTheDocument();
  });

  it('renders lists', () => {
    render(<Markdown>{'- item 1\n- item 2'}</Markdown>);
    expect(screen.getByText('item 1')).toBeInTheDocument();
    expect(screen.getByText('item 2')).toBeInTheDocument();
  });

  it('renders empty string safely', () => {
    const { container } = render(<Markdown>{''}</Markdown>);
    expect(container.firstChild).toBeInTheDocument();
  });
});
