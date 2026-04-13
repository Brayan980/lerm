"use client";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Control } from "react-hook-form";

interface Option {
  value: string;
  label: string;
  score?: number; // Optional score for PAQ forms
}

interface FormQuestionProps {
  control: Control<any>;
  name: string;
  questionText: string | React.ReactNode;
  options: Option[];
  orientation?: "vertical" | "horizontal";
}

export default function FormQuestion({ control, name, questionText, options, orientation = "vertical" }: FormQuestionProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3 p-4 border rounded-md shadow-sm bg-card">
          <FormLabel className="text-base text-foreground">{questionText}</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              defaultValue={field.value}
              className={`flex ${orientation === "vertical" ? "flex-col space-y-2" : "flex-wrap gap-x-4 gap-y-2"}`}
            >
              {options.map((option) => (
                <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                  <FormControl>
                    <RadioGroupItem value={option.value} />
                  </FormControl>
                  <FormLabel className="font-normal text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                    {option.label}
                  </FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
