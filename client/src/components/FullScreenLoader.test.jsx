import { render } from '@testing-library/react';
import FullScreenLoader from './FullScreenLoader.jsx';

describe('FullScreenLoader', () => {
  it('renders a spinning loader', () => {
    const { container } = render(<FullScreenLoader />);
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('has full screen height', () => {
    const { container } = render(<FullScreenLoader />);
    expect(container.firstChild).toHaveClass('min-h-screen');
  });
});
