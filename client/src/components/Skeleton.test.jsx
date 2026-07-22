import { render } from '@testing-library/react';
import { Skeleton, ChatListSkeleton, MessagesSkeleton } from './Skeleton.jsx';

describe('Skeleton', () => {
  it('renders a skeleton element', () => {
    const { container } = render(<Skeleton className="h-4 w-4" />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});

describe('ChatListSkeleton', () => {
  it('renders 6 skeleton rows', () => {
    const { container } = render(<ChatListSkeleton />);
    const rows = container.querySelectorAll('.flex.items-center.gap-3');
    expect(rows.length).toBe(6);
  });
});

describe('MessagesSkeleton', () => {
  it('renders 8 message skeletons', () => {
    const { container } = render(<MessagesSkeleton />);
    const items = container.querySelectorAll('.space-y-4 > div');
    expect(items.length).toBe(8);
  });
});
