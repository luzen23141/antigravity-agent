import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import AccountsListToolbar, { type ListToolbarValue } from '@/components/business/AccountsListToolbar.tsx';

const StatefulToolbar: React.FC<{ total: number; initial?: Partial<ListToolbarValue> }> = ({
  total,
  initial,
}) => {
  const [value, setValue] = React.useState<ListToolbarValue>({
    query: '',
    sortKey: 'name',
    tiers: null,
    ...initial,
  });

  return (
    <AccountsListToolbar
      total={total}
      query={value.query}
      sortKey={value.sortKey}
      tiers={value.tiers}
      onChange={setValue}
    />
  );
};

const meta = {
  title: 'Business/ListToolbar',
  component: StatefulToolbar,
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'light-gray',
      values: [
        { name: 'light-gray', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    initial: { control: false },
  },
  args: {
    total: 12,
  },
} satisfies Meta<typeof StatefulToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: {
    initial: {
      query: 'gmail',
      sortKey: 'claude',
    },
  },
};
