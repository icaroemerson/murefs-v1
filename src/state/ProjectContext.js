// src/state/ProjectContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  // ======= GEOMETRIA (cm) =======
  const [H, setH] = useState('300');        // altura total do muro
  const [tStem, setTStem] = useState('24'); // espessura da cortina
  const [bs, setBs] = useState('150');      // largura da base
  const [ds, setDs] = useState('24');       // espessura da base (altura da sapata)

  // flags de edição manual (pra não sobrescrever quando mudar H)
  const [tStemManual, setTStemManual] = useState(false);
  const [bsManual, setBsManual] = useState(false);
  const [dsManual, setDsManual] = useState(false);

  // ======= EMPUXO PASSIVO =======
  const [showPassive, setShowPassive] = useState(false);
  const [hp, setHp] = useState('80');   // altura do terreno passivo (cm)
  const [bp, setBp] = useState('120');  // largura visual do terreno passivo (cm)

  // ======= SOLO =======
  const [soilGamma, setSoilGamma] = useState('18'); // kN/m³
  const [soilPhi, setSoilPhi] = useState('30');     // graus
  const [soilQa, setSoilQa] = useState('200');      // kPa (admissível)
  const [soilCohesion, setSoilCohesion] = useState('0');
  const [hasWaterTable, setHasWaterTable] = useState(false);

  // ======= CARGAS EXTRAS =======
  const [surcharge, setSurcharge] = useState('0'); // kN/m²

  // ======= MATERIAIS / DETALHAMENTO =======
  const [cover, setCover] = useState('4');         // cm
  const [concreteClass, setConcreteClass] = useState('C25');
  const [steelClass, setSteelClass] = useState('CA50');

  // ======= AUTOPREENCHIMENTO quando altura muda =======
  useEffect(() => {
    const Hn =
      Number((H ?? '').toString().replace(',', '.')) || 0;

    if (!tStemManual) {
      const v = (0.08 * Hn).toFixed(0);
      setTStem(v);
    }
    if (!dsManual) {
      const v = (0.08 * Hn).toFixed(0);
      setDs(v);
    }
    if (!bsManual) {
      const v = (0.5 * Hn).toFixed(0);
      setBs(v);
    }
  }, [H, tStemManual, dsManual, bsManual]);

  // ======= VALOR EXPOSTO =======
  const value = useMemo(
    () => ({
      // --- geometria atual ---
      H,
      setH,
      tStem,
      setTStem,
      tStemManual,
      setTStemManual,
      bs,
      setBs,
      bsManual,
      setBsManual,
      ds,
      setDs,
      dsManual,
      setDsManual,

      // --- empuxo passivo ---
      showPassive,
      setShowPassive,
      hp,
      setHp,
      bp,
      setBp,

      // --- solo ---
      soilGamma,
      setSoilGamma,
      soilPhi,
      setSoilPhi,
      soilQa,
      setSoilQa,
      soilCohesion,
      setSoilCohesion,
      hasWaterTable,
      setHasWaterTable,

      // --- cargas ---
      surcharge,
      setSurcharge,

      // --- materiais / detalhamento ---
      cover,
      setCover,
      concreteClass,
      setConcreteClass,
      steelClass,
      setSteelClass,

      // --- aliases p/ código antigo ---
      // se alguma tela ainda chamar esses nomes, não quebra
      wallHeight: H,
      setWallHeight: setH,
      baseLength: bs,
      setBaseLength: setBs,
      stemWidth: tStem,
      setStemWidth: setTStem,
      toeWidth: '0',
      heelWidth: '0',
    }),
    [
      H,
      tStem,
      tStemManual,
      bs,
      bsManual,
      ds,
      dsManual,
      showPassive,
      hp,
      bp,
      soilGamma,
      soilPhi,
      soilQa,
      soilCohesion,
      hasWaterTable,
      surcharge,
      cover,
      concreteClass,
      steelClass,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  return useContext(ProjectContext);
}
