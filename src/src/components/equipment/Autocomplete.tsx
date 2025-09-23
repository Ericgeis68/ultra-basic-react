import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AutocompleteProps extends React.ComponentPropsWithoutRef<typeof Input> {
  suggestions: string[];
  onValueChange: (value: string) => void;
  emptyMessage?: string;
}

export function Autocomplete({
  value,
  onValueChange,
  suggestions,
  placeholder,
  emptyMessage = "Aucune suggestion.",
  ...props
}: AutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuggestions = React.useMemo(() => {
    if (!value || typeof value !== 'string') return [];
    return suggestions.filter(
      (s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase()
    );
  }, [suggestions, value]);

  return (
    <Popover open={open && filteredSuggestions.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor>
        <Input
          {...props}
          ref={inputRef}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)} // Delay to allow click on suggestion
          placeholder={placeholder}
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-auto max-h-52">
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem
                    key={suggestion}
                    value={suggestion}
                    onSelect={() => {
                      onValueChange(suggestion);
                      inputRef.current?.focus();
                      setOpen(false);
                    }}
                  >
                    {suggestion}
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
