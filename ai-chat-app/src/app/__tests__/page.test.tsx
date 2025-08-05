import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock Next.js Image component
jest.mock('next/image', () => {
  interface MockImageProps {
    src: string;
    alt: string;
    width?: string | number;
    height?: string | number;
    [key: string]: unknown;
  }
  
  return function MockImage({ src, alt, width, height, ...props }: MockImageProps) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} width={width} height={height} {...props} />;
  };
});

describe('Home Page', () => {
  it('renders the main heading and instructions', () => {
    render(<Home />);

    // Check for key text content
    expect(screen.getByText(/Get started by editing/)).toBeInTheDocument();
    expect(screen.getByText(/src\/app\/page\.tsx/)).toBeInTheDocument();
    expect(screen.getByText(/Save and see your changes instantly/)).toBeInTheDocument();
  });

  it('renders Next.js logo', () => {
    render(<Home />);

    const nextLogo = screen.getByAltText('Next.js logo');
    expect(nextLogo).toBeInTheDocument();
    expect(nextLogo).toHaveAttribute('src', '/next.svg');
    expect(nextLogo).toHaveAttribute('width', '180');
    expect(nextLogo).toHaveAttribute('height', '38');
  });

  it('renders deploy and docs links', () => {
    render(<Home />);

    const deployButton = screen.getByRole('link', { name: /Deploy now/i });
    expect(deployButton).toBeInTheDocument();
    expect(deployButton).toHaveAttribute('href', expect.stringContaining('vercel.com'));
    expect(deployButton).toHaveAttribute('target', '_blank');

    const docsLink = screen.getByRole('link', { name: /Read our docs/i });
    expect(docsLink).toBeInTheDocument();
    expect(docsLink).toHaveAttribute('href', expect.stringContaining('nextjs.org/docs'));
  });

  it('renders footer links', () => {
    render(<Home />);

    const learnLink = screen.getByRole('link', { name: /Learn/i });
    expect(learnLink).toBeInTheDocument();
    expect(learnLink).toHaveAttribute('href', expect.stringContaining('nextjs.org/learn'));

    const examplesLink = screen.getByRole('link', { name: /Examples/i });
    expect(examplesLink).toBeInTheDocument();
    expect(examplesLink).toHaveAttribute('href', expect.stringContaining('vercel.com/templates'));

    const nextjsLink = screen.getByRole('link', { name: /Go to nextjs\.org/i });
    expect(nextjsLink).toBeInTheDocument();
    expect(nextjsLink).toHaveAttribute('href', expect.stringContaining('nextjs.org'));
  });

  it('renders all required icons', () => {
    render(<Home />);

    expect(screen.getByAltText('Vercel logomark')).toBeInTheDocument();
    expect(screen.getByAltText('File icon')).toBeInTheDocument();
    expect(screen.getByAltText('Window icon')).toBeInTheDocument();
    expect(screen.getByAltText('Globe icon')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<Home />);

    // Check for aria-hidden attributes on decorative icons
    const fileIcon = screen.getByAltText('File icon');
    const windowIcon = screen.getByAltText('Window icon');
    const globeIcon = screen.getByAltText('Globe icon');

    expect(fileIcon).toHaveAttribute('aria-hidden');
    expect(windowIcon).toHaveAttribute('aria-hidden');
    expect(globeIcon).toHaveAttribute('aria-hidden');
  });

  it('has proper responsive classes', () => {
    render(<Home />);

    const mainElement = screen.getByRole('main');
    expect(mainElement).toHaveClass('sm:items-start');

    // Check for responsive text classes
    const codeElement = screen.getByText('src/app/page.tsx');
    expect(codeElement.closest('li')).toHaveClass('text-center', 'sm:text-left');
  });

  it('renders with proper layout structure', () => {
    render(<Home />);

    const container = screen.getByRole('main').parentElement;
    expect(container).toHaveClass('grid', 'grid-rows-[20px_1fr_20px]', 'min-h-screen');

    const footer = screen.getByRole('contentinfo') || screen.getByText(/Learn/).closest('footer');
    expect(footer).toHaveClass('row-start-3');
  });
});