import { screen } from '@testing-library/react';
import renderWithProviders from '../test/renderWithProviders.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

describe('ProtectedRoute', () => {
  it('redirects to /login when not authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      { preloadedState: { auth: { user: null } } },
    );
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    renderWithProviders(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>,
      { preloadedState: { auth: { user: { _id: '1', username: 'test' } } } },
    );
    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});
