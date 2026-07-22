import { render, screen } from '@testing-library/react';
import Avatar from './Avatar.jsx';

describe('Avatar', () => {
  it('renders initial letter when no avatar URL', () => {
    render(<Avatar user={{ username: 'John' }} />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders ? when no user', () => {
    render(<Avatar user={null} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('renders image when avatar URL exists', () => {
    render(<Avatar user={{ username: 'John', avatar: { url: 'http://img.test/j.jpg' } }} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://img.test/j.jpg');
  });

  it('applies custom size', () => {
    const { container } = render(<Avatar user={{ username: 'John' }} size={60} />);
    expect(container.firstChild).toHaveStyle({ width: '60px', height: '60px' });
  });

  it('shows presence indicator when showPresence is true', () => {
    const { container } = render(
      <Avatar user={{ username: 'John', presence: 'online' }} showPresence />,
    );
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
  });

  it('does not show presence indicator by default', () => {
    const { container } = render(<Avatar user={{ username: 'John', presence: 'online' }} />);
    expect(container.querySelector('.bg-green-500')).not.toBeInTheDocument();
  });
});
