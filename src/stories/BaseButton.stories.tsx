import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { BaseButton } from '@/components/base-ui/BaseButton.tsx';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';

const meta = {
  title: 'Base UI/BaseButton',
  component: BaseButton,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive', 'link'],
      description: '按钮视觉变体',
    },
    size: {
      control: 'select',
      options: ['sm', 'default', 'lg', 'icon'],
      description: '按钮尺寸',
    },
    isLoading: { control: 'boolean', description: '加载状态' },
    loadingText: { control: 'text', description: '加载时文本' },
    fullWidth: { control: 'boolean', description: '是否占满父容器宽度' },
    leftIcon: { control: false },
    rightIcon: { control: false },
    onClick: { control: false },
  },
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    onClick: fn(),
  },
} satisfies Meta<typeof BaseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <BaseButton variant="default">Default</BaseButton>
      <BaseButton variant="secondary">Secondary</BaseButton>
      <BaseButton variant="outline">Outline</BaseButton>
      <BaseButton variant="ghost">Ghost</BaseButton>
      <BaseButton variant="destructive">Destructive</BaseButton>
      <BaseButton variant="link">Link</BaseButton>
    </div>
  ),
  parameters: { controls: { disable: true } },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-3">
      <BaseButton size="sm">Small</BaseButton>
      <BaseButton size="default">Default</BaseButton>
      <BaseButton size="lg">Large</BaseButton>
      <BaseButton size="icon" aria-label="Add">
        <Plus />
      </BaseButton>
    </div>
  ),
  parameters: { controls: { disable: true } },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <BaseButton leftIcon={<Plus />}>New</BaseButton>
      <BaseButton rightIcon={<ArrowRight />}>Continue</BaseButton>
      <BaseButton variant="destructive" leftIcon={<Trash2 />}>
        Delete
      </BaseButton>
    </div>
  ),
  parameters: { controls: { disable: true } },
};

export const Loading: Story = {
  args: {
    isLoading: true,
    loadingText: 'Processing...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const FullWidth: Story = {
  render: () => (
    <div className="w-[320px] space-y-3">
      <BaseButton fullWidth>Full width</BaseButton>
      <BaseButton fullWidth variant="outline">
        Full width outline
      </BaseButton>
    </div>
  ),
  parameters: { layout: 'padded', controls: { disable: true } },
};

