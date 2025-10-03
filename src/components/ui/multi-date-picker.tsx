import * as React from "react";
import { format, startOfToday } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fr } from 'date-fns/locale'; // Import French locale
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MultiDatePickerProps {
  onSelect?: (dates: Date[] | undefined) => void;
  selected?: Date[];
  placeholder?: string;
  disabled?: boolean;
}

export function MultiDatePicker({ onSelect, selected, placeholder = "Sélectionner des dates", disabled }: MultiDatePickerProps) {
  const selectedDates = selected || [];
  const [internalDates, setInternalDates] = React.useState<Date[]>(selectedDates);

  // Sync from props when popover opens or prop changes
  React.useEffect(() => {
    setInternalDates(selectedDates.map(d => new Date(d)));
  }, [selectedDates.length]);

  const setTimeForIndex = (index: number, hours?: number, minutes?: number) => {
    setInternalDates(prev => {
      const copy = prev.map(d => new Date(d));
      const target = copy[index] ? new Date(copy[index]) : undefined;
      if (!target) return copy;
      const h = typeof hours === 'number' ? hours : target.getHours();
      const m = typeof minutes === 'number' ? minutes : target.getMinutes();
      target.setHours(h, m, 0, 0);
      copy[index] = target;
      onSelect?.(copy);
      return copy;
    });
  };

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
      <PopoverContent className="w-[320px] sm:w-[420px] p-3 space-y-3" align="start">
        <Calendar
          mode="multiple"
          selected={internalDates}
          disabled={(date) => date < startOfToday()}
          onSelect={(dates) => {
            const arr = Array.isArray(dates) ? dates : [];
            // Preserve time for existing dates with same YYYY-MM-DD
            const merged = arr
              .filter(d => d >= startOfToday())
              .map(d => {
              const key = format(d, 'yyyy-MM-dd');
              const existing = internalDates.find(x => format(x, 'yyyy-MM-dd') === key);
              const clone = new Date(d);
              if (existing) clone.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
              return clone;
            });
            setInternalDates(merged);
            onSelect?.(merged);
          }}
          initialFocus
          className={cn("pointer-events-auto")}
          locale={fr}
        />

        {internalDates.length > 0 && (
          <div className="space-y-2">
            {internalDates.map((d, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-2 items-end">
                <div className="text-sm">
                  {format(d, 'PPP', { locale: fr })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Heures</Label>
                    <Select
                      value={d.getHours().toString()}
                      onValueChange={(val) => setTimeForIndex(idx, parseInt(val), undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {Array.from({ length: 24 }).map((_, h) => (
                          <SelectItem key={h} value={h.toString()}>{String(h).padStart(2, '0')} h</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Minutes</Label>
                    <Select
                      value={d.getMinutes().toString()}
                      onValueChange={(val) => setTimeForIndex(idx, undefined, parseInt(val))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-56">
                        {[0,5,10,15,20,30,40,45,50,55].map(m => (
                          <SelectItem key={m} value={m.toString()}>{String(m).padStart(2, '0')} min</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
