import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fr } from 'date-fns/locale'; // Import French locale

interface MultiDatePickerProps {
  onSelect?: (dates: Date[] | undefined) => void;
  selected?: Date[];
  placeholder?: string;
  disabled?: boolean;
}

export function MultiDatePicker({ onSelect, selected, placeholder = "Sélectionner des dates", disabled }: MultiDatePickerProps) {
  const selectedDates = selected || [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            selectedDates.length === 0 && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDates.length > 0 ? (
            selectedDates.length === 1
              ? format(selectedDates[0], "PPP", { locale: fr })
              : `${selectedDates.length} dates sélectionnées`
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="multiple"
          selected={selectedDates}
          onSelect={onSelect}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
          locale={fr} // Use French locale for the calendar
        />
      </PopoverContent>
    </Popover>
  );
}
