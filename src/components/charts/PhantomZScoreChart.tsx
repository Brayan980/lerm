
"use client";

import type { ZScoreData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PhantomZScoreTableProps {
  zScoreProfile: ZScoreData[] | undefined;
}

const Z_VISUAL_MIN = -3.5;
const Z_VISUAL_MAX = 3.5;
const Z_RANGE = Z_VISUAL_MAX - Z_VISUAL_MIN;

// Calculates the horizontal position (0% to 100%) within the Z-score cell's visual track
const calculatePositionPercent = (zScore: number | null): string => {
  if (zScore === null || Z_RANGE === 0) return '50%';
  const clampedZ = Math.max(Z_VISUAL_MIN, Math.min(zScore, Z_VISUAL_MAX));
  const percent = ((clampedZ - Z_VISUAL_MIN) / Z_RANGE) * 100;
  return `${percent.toFixed(2)}%`;
};

const zeroLinePercent = (-Z_VISUAL_MIN / Z_RANGE) * 100;

export default function PhantomZScoreTable({ zScoreProfile }: PhantomZScoreTableProps) {
  if (!zScoreProfile || zScoreProfile.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No hay datos de Z-Score disponibles para mostrar en la tabla.</p>;
  }

  const zScoreTicks = [
    Z_VISUAL_MIN,
    Z_VISUAL_MIN / 2,
    0,
    Z_VISUAL_MAX / 2,
    Z_VISUAL_MAX,
  ];

  return (
    <div className="w-full overflow-x-auto bg-card p-1 rounded-lg shadow">
      <table className="min-w-full border-collapse">
        <thead className="bg-muted/30">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground border-b border-border w-[35%] sm:w-[30%] sticky left-0 bg-muted/30 z-10">Medida</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground border-b border-border w-[12%] sm:w-[10%]">Dato</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground border-b border-border w-[10%] sm:w-[8%]">Unidad</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground border-b border-border w-[43%] sm:w-[52%]">
              Valor Z del Phantom
              <div className="grid grid-cols-5 text-[10px] h-4 items-center mt-1 pt-1">
                {zScoreTicks.map((tick, index) => (
                  <div
                    key={tick}
                    className={cn(
                      "relative",
                      index === 0 && "text-left",
                      index === zScoreTicks.length - 1 && "text-right",
                      index > 0 && index < zScoreTicks.length -1 && "text-center",
                    )}
                  >
                    <span className={cn(tick === 0 && "font-bold")}>{tick.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-background">
          {zScoreProfile.map((item, idx) => {
            let barLeft = '0%';
            let barWidth = '0%';
            let textLeft = '50%';
            let textAlignIsLeft = true;
            const barHeight = 'h-2.5'; // Approx 10px
            const barColor = 'bg-green-400'; // Light green color for the bar

            if (item.zScore !== null) {
              const currentZPosPercent = parseFloat(calculatePositionPercent(item.zScore));
              
              if (item.zScore >= 0) {
                barLeft = `${zeroLinePercent}%`;
                barWidth = `${Math.max(0, Math.min(currentZPosPercent, 100) - zeroLinePercent)}%`;
                textLeft = `${Math.min(currentZPosPercent, 100)}%`;
                textAlignIsLeft = true;
              } else {
                // For negative Z-scores, bar starts at zScore position and width goes up to zeroLine
                barLeft = `${Math.max(0, currentZPosPercent)}%`;
                barWidth = `${Math.max(0, zeroLinePercent - Math.max(0, currentZPosPercent))}%`;
                textLeft = `${Math.max(0, currentZPosPercent)}%`;
                textAlignIsLeft = false;
              }
            }

            return (
              <tr key={item.id || idx} className="border-t border-border hover:bg-muted/20 group">
                <td className="px-3 py-1.5 whitespace-normal text-xs text-foreground border-r border-border sticky left-0 bg-background group-hover:bg-muted/20 z-10">{item.label}</td>
                <td className="px-3 py-1.5 text-xs text-muted-foreground text-right border-r border-border">
                  {item.originalValue !== null ? item.originalValue.toFixed(item.unit === "mm" ? 1 : 2) : "N/A"}
                </td>
                <td className="px-3 py-1.5 text-xs text-muted-foreground border-r border-border">{item.unit}</td>
                <td className="px-1 py-1.5 relative h-[24px] align-middle">
                  <div className="w-full h-full relative">
                    {/* Grid lines for Z-score ticks */}
                    {zScoreTicks.map(tick => (
                       <div key={`line-${tick}`}
                         className={cn(
                           "absolute top-0 bottom-0 w-px -translate-x-1/2",
                           tick === 0 ? "bg-foreground/50" : "bg-border/70"
                         )}
                         style={{ left: calculatePositionPercent(tick) }}
                       ></div>
                    ))}

                    {item.zScore !== null ? (
                      <>
                        <div
                          className={cn("absolute top-1/2 -translate-y-1/2 rounded-sm", barHeight, barColor)}
                          style={{
                            left: barLeft,
                            width: barWidth,
                          }}
                          title={`Z-Score: ${item.zScore.toFixed(2)}`}
                        />
                        <span
                          className="absolute top-1/2 -translate-y-1/2 text-[10px] font-semibold whitespace-nowrap text-gray-700 dark:text-gray-300"
                          style={{
                            left: textAlignIsLeft ? `calc(${textLeft} + 4px)` : `calc(${textLeft} - 4px)`,
                            transform: textAlignIsLeft ? 'translateY(-50%)' : 'translate(-100%, -50%)',
                          }}
                        >
                          {item.zScore.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-muted-foreground">N/A</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}