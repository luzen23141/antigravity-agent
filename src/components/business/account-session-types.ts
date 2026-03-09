import type { UserTier } from '@/modules/use-account-addition-data.ts';

export interface AccountSessionListItem {
  geminiProQuote: number | -1;
  geminiProQuoteRestIn: string;
  geminiFlashQuote: number | -1;
  geminiFlashQuoteRestIn: string;
  geminiImageQuote: number | -1;
  geminiImageQuoteRestIn: string;
  claudeQuote: number | -1;
  claudeQuoteRestIn: string;
  email: string;
  nickName: string;
  userAvatar: string;
  tier: UserTier;
  persisted: boolean;
}

export interface AccountSessionCardViewModel {
  account: AccountSessionListItem;
  displayEmail: string;
  displayName: string;
  isCurrentUser: boolean;
}

export interface AccountSessionDetailAccount {
  email: string;
  nickName: string;
  userAvatar: string;
  apiKey: string;
  accessToken: string;
  refreshToken: string;
  projectId: string;
  expiresIn: number | null;
}

export type AccountSessionAccount = AccountSessionListItem & AccountSessionDetailAccount;
