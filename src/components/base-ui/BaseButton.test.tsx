import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Plus } from 'lucide-react';
import { BaseButton } from '@/components/base-ui/BaseButton.tsx';

let container: HTMLDivElement | null = null;
let root: Root | null = null;

afterEach(() => {
  act(() => {
    root?.unmount();
  });
  container?.remove();
  root = null;
  container = null;
});

function render(element: React.ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root?.render(element);
  });

  return container;
}

describe('BaseButton', () => {
  it('renders children and icons in non-loading state', () => {
    const view = render(
      <BaseButton leftIcon={<Plus data-testid="left-icon" />} rightIcon={<Plus data-testid="right-icon" />}>
        Create
      </BaseButton>
    );

    const button = view.querySelector('button');
    expect(button?.textContent).toContain('Create');
    expect(button?.disabled).toBe(false);
    expect(view.querySelector('[data-testid="left-icon"]')).not.toBeNull();
    expect(view.querySelector('[data-testid="right-icon"]')).not.toBeNull();
  });

  it('disables button and shows loading text when isLoading is true', () => {
    const view = render(
      <BaseButton isLoading loadingText="Processing...">
        Create
      </BaseButton>
    );

    const button = view.querySelector('button');
    expect(button?.disabled).toBe(true);
    expect(button?.textContent).toContain('Processing...');
    expect(button?.textContent).not.toContain('Create');
  });

  it('calls onClick when enabled', () => {
    const onClick = vi.fn();
    const view = render(<BaseButton onClick={onClick}>Submit</BaseButton>);

    act(() => {
      view.querySelector('button')?.click();
    });

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled by loading state', () => {
    const onClick = vi.fn();
    const view = render(
      <BaseButton onClick={onClick} isLoading loadingText="Saving...">
        Submit
      </BaseButton>
    );

    act(() => {
      view.querySelector('button')?.click();
    });

    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies full width class when requested', () => {
    const view = render(<BaseButton fullWidth>Wide</BaseButton>);
    const button = view.querySelector('button');

    expect(button?.className).toContain('w-full');
  });
});
