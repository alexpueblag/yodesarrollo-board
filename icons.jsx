// Lucide-style stroke icons. All accept size + className. 1.5px stroke at 24px viewBox.
const I = ({ d, size = 56, sw = 1.5, children, fill = "none" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

// Diagnóstico: clipboard con líneas y checkmark sutil — no estetoscopio.
// Esto es patrimonio, no medicina.
const IconDiagnostico = (p) => (
  <I {...p}>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M9 3.5v2h6v-2" />
    <path d="M8.5 10.5h7" />
    <path d="M8.5 13.5h5" />
    <path d="M8.5 16.5h4" />
  </I>
);

const IconComparativo = (p) => (
  <I {...p}>
    <path d="M12 3v18" />
    <path d="M4 7h16" />
    <path d="M7 7l-3 7h6Z" />
    <path d="M17 7l-3 7h6Z" />
    <path d="M8 21h8" />
  </I>
);

// Casa Alysa: silueta arquitectónica con dos volúmenes y ventana grande
const IconCasaAlysa = (p) => (
  <I {...p}>
    <path d="M3 11 12 4l5.5 4.5" />
    <path d="M17.5 8.5 21 11" />
    <path d="M5 10v10h14V11" />
    <path d="M5 20h14" />
    <rect x="8" y="13" width="4" height="7" />
    <path d="M14.5 13.5h3v3h-3z" />
  </I>
);

// Real Miramar: grid de lotes con vialidad central — master plan
const IconRealMiramar = (p) => (
  <I {...p}>
    <rect x="3" y="3.5" width="18" height="17" rx="1" />
    <path d="M3 12h18" />
    <path d="M9 3.5v17" />
    <path d="M15 3.5v17" />
    <path d="M3 7.5h6M15 7.5h6" />
    <path d="M3 16.5h6M15 16.5h6" />
    <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
  </I>
);

const IconCalculadora = (p) => (
  <I {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <rect x="7" y="6" width="10" height="3.5" rx="0.8" />
    <circle cx="8.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="13" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="13" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
  </I>
);

// Estrategia: dos flujos que se cruzan en un nodo — yield + plusvalía
const IconEstrategia = (p) => (
  <I {...p}>
    <path d="M3 6c4 0 6 3 9 3s5-3 9-3" />
    <path d="M3 18c4 0 6-3 9-3s5 3 9 3" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </I>
);

const IconGarantias = (p) => (
  <I {...p}>
    <path d="M12 3 4.5 6v6c0 4.5 3 8.5 7.5 10 4.5-1.5 7.5-5.5 7.5-10V6Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </I>
);

// Cronograma: línea horizontal con tres hitos — no calendario, sino progresión
const IconCronograma = (p) => (
  <I {...p}>
    <path d="M3 12h18" />
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.8" />
    <path d="M5 9.5V7M12 9.5V5M19 9.5V8" opacity="0.5" />
  </I>
);

// Decisión: bifurcación — un punto que se separa en dos caminos
const IconDecision = (p) => (
  <I {...p}>
    <path d="M12 4v6" />
    <path d="M12 10c0 3-3 4-6 5" />
    <path d="M12 10c0 3 3 4 6 5" />
    <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />
    <circle cx="6" cy="16" r="1.5" />
    <circle cx="18" cy="16" r="1.5" />
    <path d="M6 17.5v2.5M18 17.5v2.5" />
  </I>
);

const IconContacto = (p) => (
  <I {...p}>
    <path d="M5 4.5h3.5l1.5 4-2.2 1.3a13 13 0 0 0 6.4 6.4L15.5 14l4 1.5V19a1.5 1.5 0 0 1-1.7 1.5C10.5 19.7 4.3 13.5 3.5 6.2A1.5 1.5 0 0 1 5 4.5Z" />
  </I>
);

const IconBack = (p) => (
  <I {...p}>
    <path d="M15 6l-6 6 6 6" />
  </I>
);

const IconHome = (p) => (
  <I {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
  </I>
);

const IconArrow = (p) => (
  <I {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </I>
);

Object.assign(window, {
  IconDiagnostico, IconComparativo, IconCasaAlysa, IconRealMiramar,
  IconCalculadora, IconEstrategia, IconGarantias, IconCronograma,
  IconDecision, IconContacto, IconBack, IconHome, IconArrow
});
