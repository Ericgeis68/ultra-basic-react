import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Get the current value, default to 0
  const value = props.value?.[0] ?? 0;

  // Calculate the hue based on the value (0-100)
  // Hue goes from 0 (red) to 120 (green)
  const hue = (value / 100) * 120;

  // Calculate saturation and lightness (adjust as needed for desired look)
  // Keeping saturation high and lightness around 50% for vibrant colors
  const saturation = 100;
  const lightness = 40; // Adjusted lightness slightly for better visibility

  // Construct the HSL color string
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        {/* Apply the dynamically calculated background color */}
        <SliderPrimitive.Range
          className="absolute h-full"
          style={{
            backgroundColor: color, // Use the calculated color
            // The width is controlled by Radix UI based on the value prop
          }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
