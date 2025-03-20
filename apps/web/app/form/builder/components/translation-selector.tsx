"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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
import { useVirtualizer } from "@tanstack/react-virtual";

interface TranslationSelectorProps {
  dictionary: Dictionary;
  onSelectTranslation: (key: string) => void;
  placeholder?: string;
}

export function TranslationSelector({
  dictionary,
  onSelectTranslation,
  placeholder = "Search translations...",
}: TranslationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isKeyboardNavActive, setIsKeyboardNavActive] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);

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

  // Setup virtualizer
  const virtualizer = useVirtualizer({
    count: filteredTranslations.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Reduce height to 60px for 2 lines of text
    overscan: 10, // Number of items to render outside of the visible area
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Memoize handlers to prevent recreating functions on each render
  const handleOpenChange = useCallback((open: boolean) => {
    setOpen(open);
    if (!open) {
      setSearch("");
      setFocusedIndex(-1);
    }
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

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filteredTranslations.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setIsKeyboardNavActive(true);
          setFocusedIndex((prev) => {
            const newIndex = Math.min(prev === -1 ? 0 : prev + 1, filteredTranslations.length - 1);
            virtualizer.scrollToIndex(newIndex, { align: "center" });
            return newIndex;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setIsKeyboardNavActive(true);
          setFocusedIndex((prev) => {
            const newIndex = Math.max(prev === -1 ? filteredTranslations.length - 1 : prev - 1, 0);
            virtualizer.scrollToIndex(newIndex, { align: "center" });
            return newIndex;
          });
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && filteredTranslations[focusedIndex]) {
            handleSelect(filteredTranslations[focusedIndex].key);
          }
          break;
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [filteredTranslations, focusedIndex, handleSelect, virtualizer],
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
        <Command
          className="rounded-lg border shadow-md"
          shouldFilter={false}
          onKeyDown={handleKeyDown}
        >
          <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
          <CommandList
            ref={parentRef}
            className="h-[80vh] max-h-[600px] overflow-auto"
            onMouseDown={() => setIsKeyboardNavActive(false)}
            onMouseMove={() => setIsKeyboardNavActive(false)}
          >
            <CommandEmpty>No translations found.</CommandEmpty>
            {filteredTranslations.length > 0 && (
              <CommandGroup heading="Translations">
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualItems.map((virtualItem) => {
                    const item = filteredTranslations[virtualItem.index];
                    if (!item) return null;

                    return (
                      <CommandItem
                        key={item.key}
                        value={`${item.key} ${item.value}`}
                        onSelect={() => handleSelect(item.key)}
                        className="absolute left-0 top-0 w-full cursor-pointer py-0!"
                        style={{
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                        onMouseEnter={() =>
                          !isKeyboardNavActive && setFocusedIndex(virtualItem.index)
                        }
                        onMouseLeave={() => !isKeyboardNavActive && setFocusedIndex(-1)}
                        data-highlighted={focusedIndex === virtualItem.index}
                      >
                        <div className="flex flex-col text-sm w-full">
                          <span className="font-medium line-clamp-2">{item.value}</span>
                          <span className="text-muted-foreground text-xs">{item.key}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
