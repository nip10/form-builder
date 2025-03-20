"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/ui/command";
import { Languages } from "lucide-react";
import { Dictionary } from "@repo/internationalization";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";

interface TranslationSelectorProps {
  dictionary: Dictionary;
  onSelectTranslation: (key: string) => void;
  placeholder?: string;
  inputValue?: string;
}

export function TranslationSelector({
  dictionary,
  onSelectTranslation,
  placeholder = "Search translations...",
  inputValue = "",
}: TranslationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Memoize translations array to prevent recalculation on each render
  const translations = useMemo(
    () =>
      Object.entries(dictionary).map(([key, value]) => ({
        key,
        value: typeof value === "string" ? value : JSON.stringify(value),
      })),
    [dictionary],
  );

  // Memoize filtered translations based on search
  const filteredTranslations = useMemo(() => {
    if (!search.trim()) return translations;

    const lowerSearch = search.toLowerCase();
    return translations.filter(
      (item) =>
        item.key.toLowerCase().includes(lowerSearch) ||
        item.value.toLowerCase().includes(lowerSearch),
    );
  }, [translations, search]);

  // Memoize handlers to prevent recreating functions on each render
  const handleOpenChange = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) setSearch("");
  }, []);

  const handleSelect = useCallback(
    (key: string) => {
      onSelectTranslation(key);
      setOpen(false);
      setSearch("");
    },
    [onSelectTranslation],
  );

  const handleOpen = useCallback(() => setOpen(true), []);

  // Memoize slice of translations to show
  const translationsToShow = useMemo(
    () => filteredTranslations.slice(0, 100),
    [filteredTranslations],
  );

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleOpen}
            >
              <Languages className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select from available translations</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command className="rounded-lg border shadow-md" shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
          <CommandList className="h-[80vh] max-h-[600px] overflow-auto">
            <CommandEmpty>No translations found.</CommandEmpty>
            {filteredTranslations.length > 0 && (
              <CommandGroup heading="Translations">
                {translationsToShow.map((item) => (
                  <CommandItem
                    key={item.key}
                    value={`${item.key} ${item.value}`}
                    onSelect={() => handleSelect(item.key)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{item.value}</span>
                      <span className="text-muted-foreground text-xs">{item.key}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {filteredTranslations.length > 100 && filteredTranslations.length > 0 && (
              <div className="py-2 px-2 text-xs text-muted-foreground text-center">
                Showing 100 of {filteredTranslations.length} results. Please refine your search.
              </div>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
