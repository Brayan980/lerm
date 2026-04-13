import { z } from "zod";
import {
  EXPRESS_DEFINITIONS
} from "@/lib/types";

export const expressSchema = z.object(
  Object.fromEntries(
    Object.values(EXPRESS_DEFINITIONS).flat().map(({ id }) => [
      id,
      z.object({
        m1: z.number().nullable().optional(),
        m2: z.number().nullable().optional(),
        m3: z.number().nullable().optional(),
        result: z.number().nullable().optional(),
      }),
    ])
  )
);

export type ExpressFormValues = z.infer<typeof expressSchema>;
