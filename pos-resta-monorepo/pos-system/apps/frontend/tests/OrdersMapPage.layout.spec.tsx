import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { OrdersMapPage } from '../src/pages/OrdersMapPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('OrdersMapPage Layout', () => {
  test('renders orders panel before map panel in DOM order', () => {
    renderWithProviders(<OrdersMapPage />);
    
    // Check that orders panel comes first
    const ordersPanel = screen.getByTestId('orders-pane');
    const mapPanel = screen.getByTestId('map-pane');
    
    expect(ordersPanel).toBeInTheDocument();
    expect(mapPanel).toBeInTheDocument();
    
    // Verify DOM order - orders panel should be first
    const container = ordersPanel.parentElement;
    const ordersIndex = Array.from(container?.children || []).indexOf(ordersPanel);
    const mapIndex = Array.from(container?.children || []).indexOf(mapPanel);
    
    expect(ordersIndex).toBeLessThan(mapIndex);
    expect(ordersIndex).toBe(0);
    expect(mapIndex).toBe(1);
  });

  test('orders panel has correct semantic HTML structure', () => {
    renderWithProviders(<OrdersMapPage />);
    
    const ordersPanel = screen.getByTestId('orders-pane');
    expect(ordersPanel.tagName).toBe('ASIDE');
    
    const mapPanel = screen.getByTestId('map-pane');
    expect(mapPanel.tagName).toBe('SECTION');
  });

  test('renders correct headings', () => {
    renderWithProviders(<OrdersMapPage />);
    
    expect(screen.getByText('Zamówienia')).toBeInTheDocument();
    expect(screen.getByText('Mapa zamówień')).toBeInTheDocument();
  });

  test('has proper CSS classes for layout', () => {
    renderWithProviders(<OrdersMapPage />);
    
    const ordersPanel = screen.getByTestId('orders-pane');
    const mapPanel = screen.getByTestId('map-pane');
    
    // Check that the components have the expected CSS classes
    expect(ordersPanel).toHaveClass('ordersPanel');
    expect(mapPanel).toHaveClass('mapPanel');
  });
});

