// src/components/WallDrawingL.js
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

const toNum = (v, d = 0) => {
  const n = typeof v === 'string' ? Number(String(v).replace(',', '.')) : Number(v);
  return Number.isFinite(n) ? n : d;
};

/**
 * Perfil L:
 * - Cortina à esquerda (espessura tStem), apoiada sobre a base.
 * - Base única e contínua sob a cortina, estendendo-se para a direita (largura total B).
 * - Solo ativo à direita sobre a base.
 * - Solo passivo (opcional) à esquerda, colado na cortina e apoiado na base.
 * - Tudo centralizado no canvas, escala uniforme.
 */
export default function WallDrawingL({
  H,        // altura total (cm)
  tStem,    // espessura da cortina (cm)
  bs,       // largura total da base (cm)  === B
  ds,       // espessura da base (cm)

  showPassive = false,
  hp = 0,   // altura do terreno passivo (cm)
  bp = 0,   // largura do terreno passivo (cm)

  width = 340,
  height = 220,
}) {
  const p = useMemo(() => {
    const Hn = Math.max(0, toNum(H));
    const t  = Math.max(1, toNum(tStem));
    const B  = Math.max(t + 10, toNum(bs)); // base total >= t + folga
    const dS = Math.max(1, toNum(ds));

    const HP = Math.max(0, toNum(hp));
    const BP = Math.max(0, toNum(bp));

    // Decompõe base total em: porção sob a cortina (t) + porção à direita (B - t)
    const rightWidth = Math.max(0, B - t);
    const leftWidth  = showPassive ? BP : 0;

    // Mundo (sem margens)
    const worldW = leftWidth + B;   // agora a base ocupa B completo no centro
    const worldH = Hn + dS;

    const pad = 16;

    // Escala uniforme
    const scale = Math.max(
      1e-6,
      Math.min(
        (width  - 2 * pad) / Math.max(worldW, 1),
        (height - 2 * pad) / Math.max(worldH, 1),
      ),
    );

    // Centralização
    const totalPxW = worldW * scale;
    const totalPxH = worldH * scale;
    const leftPx   = (width  - totalPxW) / 2;
    const topPx    = (height - totalPxH) / 2;

    // Origem no alinhamento da quina interna (face direita da cortina)
    const originX  = leftPx + leftWidth * scale + t * scale; // move para a face direita da cortina
    const stemTopY = topPx;
    const baseTopY = topPx + Hn * scale;
    const baseBotY = baseTopY + dS * scale;

    return {
      Hn, t, B, dS,
      HP, BP,
      rightWidth, leftWidth,
      scale,
      originX, stemTopY, baseTopY, baseBotY,
      leftPx, topPx, totalPxW, totalPxH,
    };
  }, [H, tStem, bs, ds, showPassive, hp, bp, width, height]);

  const {
    Hn, t, B, dS,
    HP, BP,
    rightWidth, leftWidth,
    scale,
    originX, stemTopY, baseTopY, baseBotY,
  } = p;

  // Coordenadas principais
  const stemRightX = originX;                 // face interna da cortina
  const stemLeftX  = stemRightX - t * scale;  // face externa da cortina

  // A **base agora é contínua**: começa na face externa da cortina e tem largura total B
  const baseLeftX  = stemLeftX;
  const baseRightX = baseLeftX + B * scale;

  // === SOLO ATIVO (direita), apoiado na base ===
  const soilActX = stemRightX;
  const soilActY = stemTopY;
  const soilActW = rightWidth * scale;
  const soilActH = Hn * scale;

  // === SOLO PASSIVO (esquerda), colado na cortina e apoiado na base ===
  const soilPasW_px = Math.max(0, BP * scale);
  const soilPasH_px = Math.max(0, Math.min(HP, Hn) * scale);
  const soilPasX    = stemLeftX - soilPasW_px;
  const soilPasY    = baseTopY - soilPasH_px;

  return (
    <View style={{ width, height, backgroundColor: '#fff' }}>
      <Svg width={width} height={height}>
        {/* --- SOLOS primeiro (atrás) --- */}

        {/* Solo ativo (direita) */}
        <Rect
          x={soilActX}
          y={soilActY}
          width={soilActW}
          height={soilActH}
          fill="#e7e2d0"
          stroke="#8a7f6a"
          strokeWidth={1}
        />
        {Array.from({ length: 7 }).map((_, i) => (
          <Line
            key={`act-${i}`}
            x1={soilActX + (i + 0.25) * (soilActW / 7)}
            y1={soilActY + 2}
            x2={soilActX + (i + 0.25) * (soilActW / 7) + 10}
            y2={soilActY + 18}
            stroke="#b8ae99"
            strokeWidth={1}
          />
        ))}

        {/* Solo passivo (esquerda) */}
        {showPassive && BP > 0 && (
          <>
            <Rect
              x={soilPasX}
              y={soilPasY}
              width={soilPasW_px}
              height={soilPasH_px}
              fill="#e7e2d0"
              stroke="#8a7f6a"
              strokeWidth={1}
            />
            {Array.from({ length: 6 }).map((_, i) => (
              <Line
                key={`pas-${i}`}
                x1={soilPasX + (i + 0.2) * (soilPasW_px / 6)}
                y1={soilPasY + 2}
                x2={soilPasX + (i + 0.2) * (soilPasW_px / 6) + 10}
                y2={soilPasY + 18}
                stroke="#b8ae99"
                strokeWidth={1}
              />
            ))}
          </>
        )}

        {/* --- MURO (na frente) --- */}

        {/* Base contínua sob a cortina: INÍCIO na face externa da cortina, largura TOTAL = B */}
        <Rect
          x={baseLeftX}
          y={baseTopY}
          width={B * scale}
          height={dS * scale}
          fill="#bfc3c8"
          stroke="#333"
          strokeWidth={1}
        />

        {/* Cortina (encostada na base, sem vão) */}
        <Rect
          x={stemLeftX}
          y={stemTopY}
          width={t * scale}
          height={Hn * scale}
          fill="#bfc3c8"
          stroke="#333"
          strokeWidth={1}
        />

        {/* Cota de H (à direita) */}
        <Line
          x1={baseRightX + 18}
          y1={stemTopY}
          x2={baseRightX + 18}
          y2={baseTopY}
          stroke="#444"
          strokeWidth={1}
        />
        <Line x1={baseRightX + 14} y1={stemTopY} x2={baseRightX + 22} y2={stemTopY} stroke="#444" strokeWidth={1}/>
        <Line x1={baseRightX + 14} y1={baseTopY} x2={baseRightX + 22} y2={baseTopY} stroke="#444" strokeWidth={1}/>
        <SvgText
          x={baseRightX + 24}
          y={(stemTopY + baseTopY) / 2}
          fill="#222"
          fontSize="10"
        >
          H
        </SvgText>
      </Svg>
    </View>
  );
}
