"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const localeLabels: Record<Locale, { flag: string; label: string }> = {
  id: { flag: "🇮🇩", label: "Indonesia" },
  en: { flag: "🇬🇧", label: "English" },
};

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("language");

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="icon" variant="ghost">
            <Globe className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">{t("select")}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {(Object.keys(localeLabels) as Locale[]).map((loc) => (
          <DropdownMenuItem
            className={locale === loc ? "bg-accent" : ""}
            key={loc}
            onClick={() => handleLocaleChange(loc)}
          >
            <span className="mr-2">{localeLabels[loc].flag}</span>
            {localeLabels[loc].label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
