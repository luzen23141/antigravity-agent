import {useAppGlobalLoader} from "@/modules/use-app-global-loader.ts";

export const AppLoader = () => {
  const loader = useAppGlobalLoader();

  // 只有当loading为true时才显示加载器
  if (!loader.loading) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/35 backdrop-blur-[2px]">
      <div className="flex items-center space-x-2 rounded-full border border-border/70 bg-card/92 px-4 py-2 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.38)] backdrop-blur-xl">
        <svg className="h-4 w-4 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-medium text-foreground/80">{loader.label}</span>
      </div>
    </div>
  );
};
