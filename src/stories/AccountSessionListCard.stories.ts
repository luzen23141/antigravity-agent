import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccountSessionListCard } from '@/components/business/AccountSessionListCard.tsx';
import { fn } from 'storybook/test';
import {
  mockSessionCardViewModels,
} from '@/stories/mocks/accountSessions.ts';

// 定义元数据
const meta = {
  title: 'Components/AccountSessionListCard',
  component: AccountSessionListCard,
  parameters: {
    // 让组件在画板居中显示
    layout: 'centered',
    // 背景色微调，方便看清卡片的阴影
    backgrounds: {
      default: 'light-gray',
      values: [
        { name: 'light-gray', value: '#f8fafc' },
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
  tags: ['autodocs'],
  // 配置控件类型
  argTypes: {
    viewModel: {
      control: 'object',
      description: '卡片顯示資料',
    },
  },
  // 模拟回调函数
  args: {
    onSelect: fn(),
    onSwitch: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof AccountSessionListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// 示例 1: 默认状态（其他用户）
export const Default: Story = {
  args: {
    viewModel: mockSessionCardViewModels[0],
  },
};

// 示例 2: 当前用户
// 此时应该显示 "当前" 徽标，且操作按钮被禁用
export const CurrentUser: Story = {
  args: {
    viewModel: {
      ...mockSessionCardViewModels[0],
      isCurrentUser: true,
    },
  },
};

// 示例 3: 配额未知状态 (-1)
// 进度条应该显示灰色或未知样式
export const UnknownUsage: Story = {
  args: {
    viewModel: mockSessionCardViewModels[2],
  },
};

// 示例 4: 额度即将耗尽
export const HighUsage: Story = {
  args: {
    viewModel: {
      ...mockSessionCardViewModels[1],
      account: {
        ...mockSessionCardViewModels[1].account,
        geminiProQuote: 0.98,
        claudeQuote: 1.0,
      },
    },
  },
};

// 示例 5: 未知等级 (Unknown Tier) - 触发兜底逻辑
export const UnknownTier: Story = {
  args: {
    viewModel: {
      ...mockSessionCardViewModels[0],
      account: {
        ...mockSessionCardViewModels[0].account,
        tier: 'future-tier-v2' as any,
      },
    },
  },
};
