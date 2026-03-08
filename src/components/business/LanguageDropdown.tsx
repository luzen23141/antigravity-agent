import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, type MenuProps } from 'antd';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { languages, type SupportedLanguage } from '@/i18n/config.ts';
import { logger } from '@/lib/logger.ts';
import toast from 'react-hot-toast';
import { useAppSettings } from "@/modules/use-app-settings.ts";

interface LanguageSwitcherProps {
  className?: string;
  showNativeName?: boolean;
}

export const LanguageDropdown: React.FC<LanguageSwitcherProps> = ({
  className,
  showNativeName = true,
}) => {
  const { t, i18n } = useTranslation();
  // Loading state not strictly needed for Dropdown but keeping logic same
  const [loading, setLoading] = React.useState(false);
  const setLanguage = useAppSettings(state => state.setLanguage)

  const currentLanguage = i18n.language as SupportedLanguage;

  const handleLanguageChange = async (newLanguage: SupportedLanguage) => {
    if (newLanguage === currentLanguage) return;

    setLoading(true);
    try {
      // Change language in i18next
      await setLanguage(newLanguage);



      // Use i18n.t to ensure we get the translation for the NEW language
      // The 't' from useTranslation is bound to the render cycle's language (old language)
      toast.success(i18n.t('settings:language.changeSuccess'));

      logger.info('Language changed', {
        module: 'LanguageDropdown',
        from: currentLanguage,
        to: newLanguage,
      });
    } catch (error) {
      toast.error(i18n.t('settings:language.changeError'));
      logger.error('Failed to change language', {
        module: 'LanguageDropdown',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const menuItems: MenuProps['items'] = languages.map((lang) => ({
    key: lang.code,
    label: (
      <div className="flex items-center gap-2">
        <span>{lang.flag}</span>
        <span>{showNativeName ? lang.nativeName : lang.name}</span>
      </div>
    ),
    onClick: () => handleLanguageChange(lang.code),
  }));

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
      <button
        type="button"
        className={cn(
          "app-toolbar-pill h-10 w-10 justify-center rounded-xl p-0 transition-colors duration-200 ease-in-out cursor-pointer",
          "text-muted-foreground hover:text-foreground hover:bg-accent/70",
          className
        )}
        title={t('settings:language.change')}
        disabled={loading}
      >
        <Languages className="w-5 h-5" />
      </button>
    </Dropdown>
  );
};
