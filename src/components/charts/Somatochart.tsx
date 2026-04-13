
"use client";

import { useEffect, useRef, useState } from 'react';
import type { CalculatedSomatotype } from "@/lib/types";

interface SomatochartProps {
  calculatedSomatotype: CalculatedSomatotype | null | undefined;
}

interface Point {
  x: number;
  y: number;
  color: string;
  endo?: number;
  meso?: number;
  ecto?: number;
}

export default function Somatochart({ calculatedSomatotype }: SomatochartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);

  // Colores para los puntos (igual que en el HTML)
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];

  // Configuración del sistema de coordenadas (exacta al HTML)
  const config = {
    centerX: 320,
    centerY: 265,
    scaleX: 35.5,
    scaleY: 16.5,
    minX: -8,
    maxX: 8,
    minY: -10,
    maxY: 16
  };

  const drawSomatotipoChart = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 640, 530);

    // Dibujar grid de fondo
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.8;

    // Líneas verticales
    for (let x = config.minX; x <= config.maxX; x++) {
      const pixelX = config.centerX + x * config.scaleX;
      ctx.beginPath();
      ctx.moveTo(pixelX, 30);
      ctx.lineTo(pixelX, 530 - 30);
      ctx.stroke();
    }

    // Líneas horizontales
    for (let y = config.minY; y <= config.maxY; y++) {
      const pixelY = config.centerY - y * config.scaleY;
      if (pixelY >= 30 && pixelY <= 530 - 30) {
        ctx.beginPath();
        ctx.moveTo(50, pixelY);
        ctx.lineTo(640 - 50, pixelY);
        ctx.stroke();
      }
    }

    // Dibujar ejes principales
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // Eje X
    ctx.beginPath();
    ctx.moveTo(50, config.centerY);
    ctx.lineTo(640 - 50, config.centerY);
    ctx.stroke();

    // Eje Y
    ctx.beginPath();
    ctx.moveTo(config.centerX, 30);
    ctx.lineTo(config.centerX, 530 - 30);
    ctx.stroke();

    // Dibujar el triángulo curveado del somatotipo
    drawSomatotipoTriangle(ctx);

    // Números en los ejes
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';

    // Números eje X
    for (let x = config.minX; x <= config.maxX; x++) {
      if (x !== 0) {
        const pixelX = config.centerX + x * config.scaleX;
        ctx.fillText(x.toString(), pixelX, config.centerY + 20);
      }
    }

    // Números eje Y
    ctx.textAlign = 'right';
    for (let y = config.minY; y <= config.maxY; y++) {
      if (y !== 0) {
        const pixelY = config.centerY - y * config.scaleY;
        if (pixelY >= 40 && pixelY <= 530 - 40) {
          ctx.fillText(y.toString(), config.centerX - 15, pixelY + 4);
        }
      }
    }

    // Origen (0,0)
    ctx.fillText('0', config.centerX - 15, config.centerY + 20);
  };

  const drawSomatotipoTriangle = (ctx: CanvasRenderingContext2D) => {
    // Convertir coordenadas a píxeles
    function toPixels(x: number, y: number) {
      return {
        x: config.centerX + x * config.scaleX,
        y: config.centerY - y * config.scaleY
      };
    }

    // Puntos del triángulo (exactos al HTML)
    const topPoint = toPixels(0, 12);           // MESOMORFISMO - arriba
    const bottomLeft = toPixels(-6, -6);        // ENDOMORFISMO - abajo izquierda  
    const bottomRight = toPixels(6, -6);        // ECTOMORFISMO - abajo derecha

    // Dibujar las líneas curvas del triángulo con curvas MUY pronunciadas
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2.5;

    // Línea curva izquierda (Endomorfismo a Mesomorfismo) - CURVATURA EXTREMA
    ctx.beginPath();
    ctx.moveTo(bottomLeft.x, bottomLeft.y);
    ctx.bezierCurveTo(
      bottomLeft.x + 30, bottomLeft.y - 120,  // primer punto de control
      topPoint.x - 150, topPoint.y + 40,      // segundo punto de control
      topPoint.x, topPoint.y
    );
    ctx.stroke();

    // Línea curva derecha (Mesomorfismo a Ectomorfismo) - CURVATURA EXTREMA
    ctx.beginPath();
    ctx.moveTo(topPoint.x, topPoint.y);
    ctx.bezierCurveTo(
      topPoint.x + 150, topPoint.y + 40,      // primer punto de control
      bottomRight.x - 30, bottomRight.y - 120, // segundo punto de control
      bottomRight.x, bottomRight.y
    );
    ctx.stroke();

    // Línea base (Endomorfismo a Ectomorfismo) - CURVATURA EXTREMA HACIA ABAJO
    ctx.beginPath();
    ctx.moveTo(bottomLeft.x, bottomLeft.y);
    ctx.bezierCurveTo(
      bottomLeft.x + 50, bottomLeft.y + 100,  // primer punto de control
      bottomRight.x - 50, bottomRight.y + 100, // segundo punto de control
      bottomRight.x, bottomRight.y
    );
    ctx.stroke();

    // Etiquetas de los tipos de cuerpo
    ctx.fillStyle = '#333';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';

    // MESOMORFISMO (arriba)
    ctx.fillText('MESOMORFISMO', topPoint.x, topPoint.y - 15);

    // ENDOMORFISMO (abajo izquierda)
    ctx.save();
    ctx.translate(bottomLeft.x - 30, bottomLeft.y + 25);
    ctx.rotate(-Math.PI / 6);
    ctx.fillText('ENDOMORFISMO', 0, 0);
    ctx.restore();

    // ECTOMORFISMO (abajo derecha)
    ctx.save();
    ctx.translate(bottomRight.x + 30, bottomRight.y + 25);
    ctx.rotate(Math.PI / 6);
    ctx.fillText('ECTOMORFISMO', 0, 0);
    ctx.restore();

    // Líneas de referencia que atraviesan todo el gráfico
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Línea vertical (mesomorfismo) - de arriba hacia abajo
    ctx.beginPath();
    ctx.moveTo(config.centerX, 30);
    ctx.lineTo(config.centerX, 530 - 30);
    ctx.stroke();

    // Línea diagonal izquierda (endomorfismo)
    const slopeLeft = (bottomLeft.y - config.centerY) / (bottomLeft.x - config.centerX);
    const interceptLeft = config.centerY - slopeLeft * config.centerX;

    const leftStartX = 50;
    const leftStartY = slopeLeft * leftStartX + interceptLeft;
    const leftEndX = 640 - 50;
    const leftEndY = slopeLeft * leftEndX + interceptLeft;

    ctx.beginPath();
    ctx.moveTo(leftStartX, leftStartY);
    ctx.lineTo(leftEndX, leftEndY);
    ctx.stroke();

    // Línea diagonal derecha (ectomorfismo)
    const slopeRight = (bottomRight.y - config.centerY) / (bottomRight.x - config.centerX);
    const interceptRight = config.centerY - slopeRight * config.centerX;

    const rightStartX = 50;
    const rightStartY = slopeRight * rightStartX + interceptRight;
    const rightEndX = 640 - 50;
    const rightEndY = slopeRight * rightEndX + interceptRight;

    ctx.beginPath();
    ctx.moveTo(rightStartX, rightStartY);
    ctx.lineTo(rightEndX, rightEndY);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const plotPoint = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    const pixelX = config.centerX + x * config.scaleX;
    const pixelY = config.centerY - y * config.scaleY;

    // Verificar si el punto está dentro del área visible
    if (pixelX < 50 || pixelX > 640 - 50 || pixelY < 30 || pixelY > 530 - 30) {
      return false;
    }

    // Dibujar punto
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, 8, 0, 2 * Math.PI);
    ctx.fill();

    // Dibujar borde del punto
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Etiqueta del punto
    ctx.fillStyle = '#333';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';

    // Fondo para la etiqueta
    const label = `(${x}, ${y})`;
    const metrics = ctx.measureText(label);
    const labelX = pixelX;
    const labelY = pixelY - 20;

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillRect(labelX - metrics.width / 2 - 4, labelY - 12, metrics.width + 8, 16);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(labelX - metrics.width / 2 - 4, labelY - 12, metrics.width + 8, 16);

    // Texto de la etiqueta
    ctx.fillStyle = color;
    ctx.fillText(label, labelX, labelY);

    return true;
  };

  const redrawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    drawSomatotipoChart(ctx);
    points.forEach((point) => {
      plotPoint(ctx, point.x, point.y, point.color);
    });
  };

  // Effect para dibujar el punto del somatotipo cuando cambian los datos
  useEffect(() => {
    if (calculatedSomatotype &&
      calculatedSomatotype.endomorfia !== null &&
      calculatedSomatotype.mesomorfia !== null &&
      calculatedSomatotype.ectomorfia !== null) {

      const { endomorfia, mesomorfia, ectomorfia } = calculatedSomatotype;

      // Cálculo de coordenadas para la somatocarta
      const x = parseFloat((ectomorfia - endomorfia).toFixed(1));
      const y = parseFloat((2 * mesomorfia - (endomorfia + ectomorfia)).toFixed(1));

      const newPoint: Point = {
        x,
        y,
        color: colors[0], // Usar el primer color para el somatotipo
        endo: endomorfia,
        meso: mesomorfia,
        ecto: ectomorfia
      };

      setPoints([newPoint]);
    } else {
      setPoints([]);
    }
  }, [calculatedSomatotype]);

  // Effect para redibujar cuando cambien los puntos
  useEffect(() => {
    redrawChart();
  }, [points]);

  // Validación con mensaje descriptivo (igual al original)
  if (
    !calculatedSomatotype ||
    calculatedSomatotype.endomorfia === null ||
    calculatedSomatotype.mesomorfia === null ||
    calculatedSomatotype.ectomorfia === null ||
    calculatedSomatotype.endomorfia === undefined ||
    calculatedSomatotype.mesomorfia === undefined ||
    calculatedSomatotype.ectomorfia === undefined
  ) {
    return (
      <div className="flex items-center justify-center h-[530px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center px-4">
          <p className="text-gray-600 text-sm mb-2">📊 Carta Somatotípica</p>
          <p className="text-gray-500 text-xs">
            Datos insuficientes para generar la representación gráfica
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">

      <div className="flex justify-center w-full overflow-x-auto">
        <div className="inline-block max-w-full">
          <canvas
            ref={canvasRef}
            width={640}
            height={530}
            className="border border-gray-300 rounded-xl bg-white shadow-md"
            style={{
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      </div>


    </div>
  );
}