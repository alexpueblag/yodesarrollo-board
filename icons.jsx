// Lucide-style stroke icons. All accept size + className. 1.5px stroke at 24px viewBox.
const I = ({ d, size = 56, sw = 1.5, children, fill = "none" }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor"
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const IconDiagnostico = (p) => (
  <I {...p}>
    <path d="M9 3v6a4 4 0 0 0 8 0V3" />
    <path d="M7 3h2M15 3h2" />
    <path d="M13 13v3.5a4.5 4.5 0 0 1-9 0V13" />
    <circle cx="19" cy="14" r="2.5" />
    <path d="M19 16.5V19a3 3 0 0 1-3 3h-1" />
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

const IconCasaAlysa = (p) => (
  <I {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10.5V20h14v-9.5" />
    <path d="M10 20v-5h4v5" />
    <path d="M3 20h18" />
  </I>
);

const IconRealMiramar = (p) => (
  <I {...p}>
    <path d="M3 7l6-2 6 2 6-2v14l-6 2-6-2-6 2Z" />
    <path d="M9 5v14" />
    <path d="M15 7v14" />
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

const IconEstrategia = (p) => (
  <I {...p}>
    <path d="M4 8c0-2.5 2-4 4.5-4S13 5.5 13 8s-2 4-4.5 4S4 13.5 4 16s2 4 4.5 4S13 18.5 13 16" />
    <path d="M20 16c0-2.5-2-4-4.5-4S11 13.5 11 16" opacity="0.55" />
    <path d="M11 8c0 2.5 2 4 4.5 4S20 10.5 20 8s-2-4-4.5-4S11 5.5 11 8" opacity="0.55" />
  </I>
);

const IconGarantias = (p) => (
  <I {...p}>
    <path d="M12 3 4.5 6v6c0 4.5 3 8.5 7.5 10 4.5-1.5 7.5-5.5 7.5-10V6Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </I>
);

const IconCronograma = (p) => (
  <I {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v4M16 3v4" />
    <circle cx="8" cy="14" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="12" cy="14" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="16" cy="14" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="8" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="12" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
  </I>
);

const IconDecision = (p) => (
  <I {...p}>
    <path d="M12 3v9" />
    <path d="m6.5 8 5.5-5 5.5 5" />
    <path d="M4 13v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
    <path d="M9 17h6" />
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
