
"use client";

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { Frequency, DailyActivityFrequency } from "@/lib/types";
import { Input } from "@/components/ui/input";

interface ActivityItem {
  id: string;
  label: string;
  isOther?: boolean;
}

interface ActivityOption {
  value: Frequency | DailyActivityFrequency;
  label: string;
  score: number;
}

interface ActivityTableInputProps {
  control: Control<any>;
  activities: ActivityItem[];
  options: ActivityOption[];
  namePrefix: string;
  otherFieldName?: string;
  watch?: UseFormWatch<any>;
  setValue?: UseFormSetValue<any>;
}

export default function ActivityTableInput({ control, activities, options, namePrefix, otherFieldName, watch, setValue }: ActivityTableInputProps) {
  return (
    <Table className="bg-card rounded-md shadow-sm">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[200px] sm:w-[300px] text-foreground">Actividad</TableHead>
          <TableHead className="text-foreground">Frecuencia</TableHead>
          {otherFieldName && <TableHead className="text-foreground min-w-[150px]">Especificar Otros</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity) => {
          const fieldName = `${namePrefix}.${activity.id}`;
          const currentRadioValueForOther = watch && activity.isOther && otherFieldName ? watch(fieldName) : undefined;
          const otherTriggerOptionValue = options.length > 0 ? options[options.length - 1].value : undefined;
          const isOtherInputDisabled = !(activity.isOther && otherFieldName && currentRadioValueForOther === otherTriggerOptionValue);

          return (
            <TableRow key={activity.id}>
              <TableCell className="font-medium text-muted-foreground align-top">{activity.label}</TableCell>
              <TableCell className="align-top">
                <FormField
                  control={control}
                  name={fieldName}
                  render={({ field }) => (
                    <RadioGroup
                      onValueChange={(newValue) => {
                        field.onChange(newValue);
                        if (activity.isOther && otherFieldName && setValue) {
                          if (newValue !== otherTriggerOptionValue) {
                            setValue(otherFieldName, "", { shouldValidate: true }); // Clear and validate
                          }
                        }
                      }}
                      value={field.value || ""}
                      className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2 pt-1" // Adjusted for alignment
                    >
                      {options.map(option => (
                        <FormItem key={option.value} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={option.value} id={`${fieldName}-${option.value}`} />
                          </FormControl>
                          <FormLabel htmlFor={`${fieldName}-${option.value}`} className="font-normal text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                            {option.label}
                          </FormLabel>
                        </FormItem>
                      ))}
                       <FormMessage />
                    </RadioGroup>

                  )}
                />
              </TableCell>
              {otherFieldName && (
                <TableCell className="align-top">
                  {activity.isOther && setValue && watch ? ( // Ensure setValue and watch are available
                    <FormField
                      control={control}
                      name={otherFieldName}
                      render={({ field: textInputField }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...textInputField}
                              placeholder="Cuál?"
                              className="text-sm h-9" // Adjusted height
                              disabled={isOtherInputDisabled}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
