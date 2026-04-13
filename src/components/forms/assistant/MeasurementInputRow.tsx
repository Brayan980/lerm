
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import type { Control, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MeasurementInputRowProps {
  control: Control<any>;
  namePrefix: string; // e.g., "masaCorporal"
  label: string;
  unit: string;
  threshold: number; // Porcentaje de diferencia permitida (1 o 5) que respresenta el umbral 1% y 5% para habilitar M3 
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
}

export default function MeasurementInputRow({
  control,
  namePrefix,
  label,
  unit,
  threshold,
  watch,
  setValue,
}: MeasurementInputRowProps) {
  const m1FieldName = `${namePrefix}.m1`;
  const m2FieldName = `${namePrefix}.m2`;
  const m3FieldName = `${namePrefix}.m3`;
  const resultFieldName = `${namePrefix}.result`;

  const m1Value = watch(m1FieldName) as number | undefined | null;
  const m2Value = watch(m2FieldName) as number | undefined | null;
  const m3Value = watch(m3FieldName) as number | undefined | null;

  const [isM3Enabled, setIsM3Enabled] = useState(false);

  const calculateResult = useCallback(() => {
    const numM1 = typeof m1Value === 'number' ? m1Value : null;
    const numM2 = typeof m2Value === 'number' ? m2Value : null;
    const numM3 = typeof m3Value === 'number' ? m3Value : null;

    if (numM1 === null || numM2 === null) {
      setValue(resultFieldName, null, { shouldValidate: true });
      return;
    }

    let finalResult: number | null = null;

    if (!isM3Enabled || numM3 === null) { // M3 not used or not filled
      finalResult = (numM1 + numM2) / 2;
    } else { // M3 is enabled and filled
      // Tres mediciones: calcular MEDIANA
      const values = [numM1, numM2, numM3].sort((a, b) => a - b);
      finalResult = values[1]; // El valor del medio es la mediana

      // const d12 = Math.abs(numM1 - numM2);
      // const d13 = Math.abs(numM1 - numM3);
      // const d23 = Math.abs(numM2 - numM3);

      // const minDiff = Math.min(d12, d13, d23);

      // if (minDiff === d12) {
      //   finalResult = (numM1 + numM2) / 2;
      // } else if (minDiff === d13) {
      //   finalResult = (numM1 + numM3) / 2;
      // } else { // minDiff === d23
      //   finalResult = (numM2 + numM3) / 2;
      // }

      // caso base: tomar la pareja con menor diferencia
      // if (minDiff === d12 && !(d23 === d12)) {
      //   finalResult = (numM1 + numM2) / 2;
      // } else if (minDiff === d13) {
      //   finalResult = (numM1 + numM3) / 2;
      // } else {
      //   // incluye el caso d23 === d12 (empate), se prioriza (m2, m3)
      //   finalResult = (numM2 + numM3) / 2;
      // }

    }

    setValue(resultFieldName, finalResult !== null ? parseFloat(finalResult.toFixed(2)) : null, { shouldValidate: true, shouldDirty: true });
  }, [m1Value, m2Value, m3Value, isM3Enabled, setValue, resultFieldName]);


  useEffect(() => {
    const numM1 = typeof m1Value === 'number' ? m1Value : null;
    const numM2 = typeof m2Value === 'number' ? m2Value : null;

    if (numM1 !== null && numM2 !== null) {

      // Calcular porcentaje de diferencia según la fórmula:
      // (diferencia entre medidas / media de ambas medidas) × 100

      const diff = Math.abs(numM1 - numM2);
      const mean = (numM1 + numM2) / 2;
      const percentDiff = (diff / mean) * 100;

      // Habilitar M3 si el porcentaje de diferencia excede el threshold
      const shouldEnableM3 = percentDiff > threshold;

      // const diff = Math.abs(numM1 - numM2);
      // const shouldEnableM3 = diff > threshold;
      setIsM3Enabled(shouldEnableM3);
      if (!shouldEnableM3) {
        setValue(m3FieldName, null, { shouldValidate: true }); // Clear M3 if not needed
      }
    } else {
      setIsM3Enabled(false);
      setValue(m3FieldName, null, { shouldValidate: true });
    }
    calculateResult();
  }, [m1Value, m2Value, threshold, setValue, m3FieldName, calculateResult]);

  useEffect(() => {
    calculateResult();
  }, [m3Value, calculateResult]);


  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-x-4 gap-y-2 items-end py-3 border-b last:border-b-0">
      <div className="sm:col-span-1">
        <Label htmlFor={m1FieldName} className="text-sm font-medium text-muted-foreground">
          {label} <span className="text-xs">({unit})</span>
        </Label>
      </div>

      {[
        { fieldName: m1FieldName, placeholder: "Medida 1", fieldNum: 1 },
        { fieldName: m2FieldName, placeholder: "Medida 2", fieldNum: 2 },
        { fieldName: m3FieldName, placeholder: "Medida 3", fieldNum: 3, disabled: !isM3Enabled },
      ].map(({ fieldName, placeholder, disabled, fieldNum }) => (
        <FormField
          key={fieldName}
          control={control}
          name={fieldName}
          render={({ field }) => (
            <FormItem className={cn("sm:col-span-1", disabled && "opacity-50")}>
              {fieldNum === 1 && <Label htmlFor={fieldName} className="text-xs sm:hidden">{placeholder}</Label>}
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={placeholder}
                  {...field}
                  value={field.value === null || field.value === undefined ? "" : String(field.value)}
                  onChange={(e) => field.onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
                  disabled={disabled}
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      ))}

      <FormField
        control={control}
        name={resultFieldName}
        render={({ field }) => (
          <FormItem className="sm:col-span-1">
            <FormControl>
              <Input
                type="text"
                placeholder="Resultado"
                value={field.value === null || field.value === undefined ? "" : String(field.value)}
                readOnly
                className="h-9 text-sm font-semibold bg-muted/50 border-muted/30"
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </div>
  );
}
