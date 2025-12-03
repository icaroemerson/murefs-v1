// src/components/WallDrawingL.js
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Polygon, Path, Text as SvgText, Defs, Pattern } from 'react-native-svg';

function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

export default function WallDrawingL({
  width = 340, height = 240,
  wallHeight = 300,          // cm
  stemWidth = 24,            // cm
  heelWidth = 120,           // cm (base interna, lado do aterro)
  toeWidth = 0,              // cm (base externa)
  elevation = 50,            // cm
  hasPassiveSoil = true,
  passiveHeight = 60         // cm
}) {
  const M = 14;

  const dims = useMemo(() => {
    const H = Number(wallHeight) || 0;
    const EL = Number(elevation) || 0;
    const TW = Math.max(Number(toeWidth) || 0, 0);
    const HW = Math.max(Number(heelWidth) || 0, 0);
    const ST = Math.max(Number(stemWidth) || 0, 0);
    const HP = clamp(Number(passiveHeight) || 0, 0, H);

    const baseTotal = TW + HW;
    const W = width - 2 * M;
    const Hpix = height - 2 * M;

    const sx = baseTotal > 0 ? W / baseTotal : 1;
    const sy = (H + EL) > 0 ? Hpix / (H + EL) : 1;
    const s = Math.min(sx, sy);

    const toX = (cm) => M + cm * s;
    const toY = (cm) => M + (H + EL - cm) * s;

    return { H, EL, TW, HW, ST, HP, s, toX, toY, baseTotal };
  }, [width, height, wallHeight, stemWidth, heelWidth, toeWidth, elevation, passiveHeight]);

  const { H, EL, TW, HW, ST, HP, s, toX, toY } = dims;

  const yBase = toY(0);
  const yTopo = toY(H + EL);
  const xCortina = toX(0);         // cortina encostada na borda entre solo (esq) e rua (dir)
  const xHeelEnd = toX(-HW);       // base interna para a esquerda
  const xToeEnd  = toX(TW);        // base externa (se houver) para a direita
  const xCortinaDir = toX(ST);     // face direita da cortina

  const passivePolyPoints = useMemo(() => {
    if (!hasPassiveSoil || HP <= 0) return '';
    const y0 = toY(0);
    const y1 = toY(HP);
    const xFace = xCortinaDir;
    const xPeak = xFace + 20; // 20px para fora (visual)
    return `${xFace},${y0} ${xPeak},${y1} ${xFace},${y1}`;
  }, [hasPassiveSoil, HP, xCortinaDir, toY]);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern id="soil" patternUnits="userSpaceOnUse" width="8" height="8">
            <Path d="M0 8 L8 0" stroke="#C6A36B" strokeWidth="1" />
          </Pattern>
        </Defs>

        {/* Solo à esquerda da cortina */}
        <Rect
          x={0}
          y={yTopo}
          width={toX(-Math.max(HW, 80))}
          height={toY(0) - yTopo}
          fill="url(#soil)"
        />

        {/* Base (heel + toe) */}
        <Rect
          x={xHeelEnd}
          y={yBase - 10 * s}
          width={toX(TW) - xHeelEnd}
          height={10 * s}
          fill="#d9d9d9"
          stroke="#333"
          strokeWidth={1}
        />

        {/* Cortina */}
        <Rect
          x={xCortina}
          y={toY(H)}
          width={xCortinaDir - xCortina}
          height={toY(0) - toY(H)}
          fill="#e6e6e6"
          stroke="#333"
          strokeWidth={1}
        />

        {/* Nível de terreno (lado do solo) */}
        <Line
          x1={xHeelEnd - 10}
          y1={toY(H)}
          x2={xCortinaDir}
          y2={toY(H)}
          stroke="#6b6b6b"
          strokeDasharray="4,3"
          strokeWidth={1}
        />

        {/* Elevação acima do terreno */}
        {EL > 0 && (
          <Line
            x1={xCortinaDir}
            y1={toY(H)}
            x2={xCortinaDir}
            y2={toY(H + EL)}
            stroke="#333"
            strokeWidth={1}
          />
        )}

        {/* Empuxo passivo à direita */}
        {hasPassiveSoil && HP > 0 && (
          <Polygon points={passivePolyPoints} fill="#87c0ff" opacity={0.5} />
        )}

        <SvgText x={toX(-HW)} y={yTopo - 6} fontSize="10" fill="#333">
          Perfil L (heel à esquerda)
        </SvgText>
      </Svg>
    </View>
  );
}
