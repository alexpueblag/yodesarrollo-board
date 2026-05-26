// Yodesarrollo Board · app.jsx
// 3 vistas: Cover (carátula) → Dashboard (jerárquico) → Section
// Modo presentación oculta TweaksPanel + badge + chuleta del header.

const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

const ICON_BY_ID = {
  "diagnostico":  IconDiagnostico,
  "comparativo":  IconComparativo,
  "casa-alysa":   IconCasaAlysa,
  "real-miramar": IconRealMiramar,
  "calculadora":  IconCalculadora,
  "estrategia":   IconEstrategia,
  "garantias":    IconGarantias,
  "cronograma":   IconCronograma,
  "decision":     IconDecision,
  "contacto":     IconContacto,
  "ppp":                IconPPP,
  "quienes-somos":      IconQuienesSomos,
  "arquitectura-autor": IconAutor,
  "acuerdo-pago":       IconAcuerdo,
};

const SECTION_BY_ID = {
  "diagnostico":  SecDiagnostico,
  "comparativo":  SecComparativo,
  "casa-alysa":   SecCasaAlysa,
  "real-miramar": SecRealMiramar,
  "calculadora":  SecCalculadora,
  "estrategia":   SecEstrategia,
  "garantias":    SecGarantias,
  "cronograma":   SecCronograma,
  "decision":     SecDecision,
  "contacto":     SecContacto,
  "acuerdo-pago": window.SecAcuerdoPagos || (() => null),
};

// Cuáles tiles son del nivel jerárquico — define el layout del dashboard
const TIER_LARGE  = ["casa-alysa", "real-miramar"];
const TIER_MEDIUM = ["diagnostico", "comparativo", "calculadora", "estrategia"];
const TIER_CHIPS  = ["garantias", "cronograma", "decision", "contacto", "acuerdo-pago"];

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "aesthetic": "carplay",
  "theme": "oscuro",
  "showClock": true,
  "client": "",
  "presentation": false
}/*EDITMODE-END*/;

window.buildTileLookup = (tilesData, proyectosData) => {
  const lookup = {};
  (tilesData || []).forEach((row) => {
    if (row.enabled === false) return;
    lookup[row.id] = {
      ...row,
      Icon:    ICON_BY_ID[row.id]    || (() => null),
      Section: SECTION_BY_ID[row.id] || (() => null),
    };
  });
  // Proyectos dinámicos del tab `Proyectos` → ruteados a la sección genérica SecProyecto
  (proyectosData || []).forEach((p) => {
    if (!p.id) return;
    if (p.activo === false) return;
    lookup[p.id] = {
      ...p,
      label:   p.nombre || p.id,
      kicker:  p.kicker || "",
      color:   p.color  || "#2a2a2a",
      accent:  p.accent || "#d4be8a",
      Icon:    ICON_BY_ID[p.id] || IconRealMiramar,
      Section: window.SecProyecto || (() => null),
    };
  });
  return lookup;
};

const useClock = () => {
  const [t, setT] = React.useState(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setT(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return t;
};

const fmtTime = (d) => d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
const fmtDate = (d) => d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
const fmtDateLong = (d) => d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });

// ============================================================================
// COVER SCREEN — carátula previa al dashboard
// ============================================================================
const CoverScreen = ({ onStart, t }) => {
  const { data } = window.useData();
  const cfg = data.config || {};
  const clock = useClock();

  const clientLine = t.client
    ? <>Reunión con <em>{t.client}</em></>
    : "Edición fundadora · 2026";

  return (
    <div className={"cover cover--" + t.aesthetic}>
      <header className="cover-head">
        <a
          className="cover-brand brand-logo-link"
          href={cfg.brand_url || "https://yodesarrollo.mx"}
          target="_blank"
          rel="noopener noreferrer"
          title="Ir a yodesarrollo.mx"
        >
          {cfg.logo_url
            ? <img src={cfg.logo_url} alt="Yodesarrollo" className="cover-logo" />
            : <img src="assets/logo_white.png" alt="Yodesarrollo" className="cover-logo" />
          }
        </a>
        <div className="cover-folio mono">{cfg.folio || "YDR-2026-001"}</div>
      </header>

      <div className="cover-body">
        <span className="cover-kicker mono">Carpeta de inversión · documento confidencial</span>
        <h1 className="cover-title">
          Patrimonio que se<br/>
          construye, no que<br/>
          se confía.
        </h1>
        <p className="cover-meta">
          <span className="cover-client">{clientLine}</span>
          <span className="cover-sep">·</span>
          <span className="cover-date">{fmtDateLong(clock)}</span>
        </p>
      </div>

      <footer className="cover-foot">
        <button className="cover-cta" onClick={onStart}>
          <span>Empezar la conversación</span>
          <IconArrow size={14} sw={2} />
        </button>
        <div className="cover-foot-right">
          <span className="cover-brand-name mono small muted">
            {cfg.brand_name || "YODESARROLLO · INVERSIÓN PATRIMONIAL"}
          </span>
          <a
            className="cover-back-link"
            href={cfg.brand_url || "https://yodesarrollo.mx"}
            target="_blank"
            rel="noopener noreferrer"
          >
            ← yodesarrollo.mx
          </a>
        </div>
      </footer>
    </div>
  );
};

// ============================================================================
// DASHBOARD — jerárquico en 3 filas
// ============================================================================
const Dashboard = ({ onOpen, t }) => {
  const clock = useClock();
  const { data } = window.useData();
  const cfg = data.config || {};
  const lookup = window.buildTileLookup(data.tiles, data.proyectos);
  const presentation = !!t.presentation;

  const logoSrc = cfg.logo_url || "assets/logo_white.png";
  const alysa = lookup["casa-alysa"];
  const mira  = lookup["real-miramar"];
  const alysaHero  = Object.assign({}, (data.alysa   && data.alysa.hero)   || {}, alysa || {});
  const miraHero   = Object.assign({}, (data.miramar && data.miramar.hero) || {}, mira  || {});
  const TILES_GRANDES = ["casa-alysa", "real-miramar"];
  const proyectosDin = (data.proyectos || []).filter((p) => p.activo !== false && TILES_GRANDES.indexOf(p.id) === -1 && (!p.nivel || p.nivel === "large"));
  const proyectosEco = (data.proyectos || []).filter((p) => p.activo !== false && p.nivel === "ecosistema");

  return (
    <div className={"board board--" + t.aesthetic} data-mode={presentation ? "presentation" : "edit"}>
      <header className="board-head board-head--clean">
        <div className="brand">
          <a
            className="brand-logo-link"
            href={cfg.brand_url || "https://yodesarrollo.mx"}
            target="_blank"
            rel="noopener noreferrer"
            title="Ir a yodesarrollo.mx"
          >
            <img src={logoSrc} alt="Yodesarrollo" className="brand-logo" />
          </a>
          <div className="brand-meta">
            <span className="brand-name mono">{cfg.brand_name || "YODESARROLLO"}</span>
            <span className="brand-sub">
              {t.client
                ? <>Reunión con <em>{t.client}</em></>
                : (cfg.brand_sub_default || "Edición fundadora · 2026")}
            </span>
          </div>
        </div>
        {(cfg.header_stat_1_value || cfg.header_stat_2_value || cfg.header_stat_3_value) && (
          <div className="board-head-stats">
            {[1, 2, 3].map((i) => (
              cfg["header_stat_" + i + "_value"] ? (
                <div className="bhs" key={i}>
                  <span className="bhs-val mono">{cfg["header_stat_" + i + "_value"]}</span>
                  <span className="bhs-lbl mono">{cfg["header_stat_" + i + "_label"]}</span>
                </div>
              ) : null
            ))}
          </div>
        )}
        <div className="board-head-tail">
          {t.showClock && (
            <div className="board-status">
              <span className="status-time mono">{fmtTime(clock)}</span>
              <span className="status-date">{fmtDate(clock)}</span>
            </div>
          )}
          <button
            className="theme-toggle"
            onClick={() => setTweak("theme", t.theme === "claro" ? "oscuro" : "claro")}
            title="Cambiar tema claro / oscuro"
            aria-label="Cambiar tema">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {t.theme === "claro"
                ? <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                : <g><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></g>}
            </svg>
            <span className="tt-label mono">{t.theme === "claro" ? "Oscuro" : "Claro"}</span>
          </button>
        </div>
      </header>

      {/* ━━━━━━━━━ FILA 1: Productos (tiles grandes con foto) ━━━━━━━━━ */}
      <div className="tier-large">
        {alysa && (
          <button
            className="tile-large tile-large--alysa"
            style={{ ["--c"]: alysa.color, ["--a"]: alysa.accent }}
            onClick={() => onOpen("casa-alysa")}
          >
            {(alysaHero.img_tile_url || alysaHero.img_url) && (
              <img className="tile-large-bg" src={alysaHero.img_tile_url || alysaHero.img_url} alt=""
                   onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span className="tile-large-fade" aria-hidden></span>
            <div className="tile-large-icon"><alysa.Icon size={36} sw={1.5} /></div>
            <div className="tile-large-content">
              <span className="tile-large-kicker mono">{alysa.kicker}</span>
              <span className="tile-large-label">Casa Alysa</span>
              <div className="tile-large-stats">
                <span><strong>{alysaHero.stat_1_value}</strong> {alysaHero.stat_1_label}</span>
                <span className="dot">·</span>
                <span><strong>{alysaHero.stat_2_value}</strong> {alysaHero.stat_2_label}</span>
                <span className="dot">·</span>
                <span><strong>{alysaHero.stat_3_value}</strong> {alysaHero.stat_3_label}</span>
              </div>
            </div>
            <span className="tile-large-cta mono">
              Explorar <IconArrow size={12} sw={2} />
            </span>
          </button>
        )}

        {mira && (
          <button
            className="tile-large tile-large--miramar"
            style={{ ["--c"]: mira.color, ["--a"]: mira.accent }}
            onClick={() => onOpen("real-miramar")}
          >
            {(miraHero.img_tile_url || miraHero.master_plan_url || miraHero.img_url) && (
              <img className="tile-large-bg" src={miraHero.img_tile_url || miraHero.master_plan_url || miraHero.img_url} alt=""
                   onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span className="tile-large-fade" aria-hidden></span>
            <div className="tile-large-icon"><mira.Icon size={36} sw={1.5} /></div>
            <div className="tile-large-content">
              <span className="tile-large-kicker mono">{mira.kicker}</span>
              <span className="tile-large-label">Real Miramar</span>
              <div className="tile-large-stats">
                <span><strong>{miraHero.stat_1_value}</strong> {miraHero.stat_1_label}</span>
                <span className="dot">·</span>
                <span><strong>{miraHero.stat_2_value}</strong> {miraHero.stat_2_label}</span>
                <span className="dot">·</span>
                <span><strong>{miraHero.stat_3_value}</strong> {miraHero.stat_3_label}</span>
              </div>
            </div>
            <span className="tile-large-cta mono">
              Explorar <IconArrow size={12} sw={2} />
            </span>
          </button>
        )}

        {/* Proyectos dinámicos (tab Proyectos del Sheet) */}
        {proyectosDin.map((p) => {
          const tile = lookup[p.id];
          if (!tile) return null;
          return (
            <button
              key={p.id}
              className="tile-large tile-large--dyn"
              style={{ ["--c"]: tile.color, ["--a"]: tile.accent }}
              onClick={() => onOpen(p.id)}
            >
              {(p.img_tile_url || p.img_url) && (
                <img className="tile-large-bg" src={p.img_tile_url || p.img_url} alt=""
                     onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <span className="tile-large-fade" aria-hidden></span>
              <div className="tile-large-icon"><tile.Icon size={36} sw={1.5} /></div>
              <div className="tile-large-content">
                <span className="tile-large-kicker mono">{p.kicker}</span>
                <span className="tile-large-label">{p.nombre}</span>
                <div className="tile-large-stats">
                  {p.stat_1_value && <span><strong>{p.stat_1_value}</strong> {p.stat_1_label}</span>}
                  {p.stat_2_value && <><span className="dot">·</span><span><strong>{p.stat_2_value}</strong> {p.stat_2_label}</span></>}
                  {p.stat_3_value && <><span className="dot">·</span><span><strong>{p.stat_3_value}</strong> {p.stat_3_label}</span></>}
                </div>
              </div>
              <span className="tile-large-cta mono">
                Explorar <IconArrow size={12} sw={2} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ━━━━━━━━━ FILA 2: Herramientas (tiles medianos) ━━━━━━━━━ */}
      <div className="tier-medium">
        {TIER_MEDIUM.map((id, i) => {
          const tile = lookup[id];
          if (!tile) return null;
          return (
            <button
              key={id}
              className="tile-med"
              style={{ ["--c"]: tile.color, ["--a"]: tile.accent }}
              onClick={() => onOpen(id)}
            >
              <span className="tile-med-halo" aria-hidden></span>
              <div className="tile-med-icon"><tile.Icon size={40} sw={1.5} /></div>
              <div className="tile-med-meta">
                <span className="tile-med-label">{tile.label}</span>
                <span className="tile-med-kicker mono">{tile.kicker}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ━━━━━━━━━ FILA 3: Soporte (chips horizontales) ━━━━━━━━━ */}
      <div className="tier-chips">
        <span className="tier-chips-label mono">Bajo demanda</span>
        <div className="tier-chips-row">
          {TIER_CHIPS.map((id) => {
            const tile = lookup[id];
            if (!tile) return null;
            return (
              <button
                key={id}
                className="tile-chip"
                style={{ ["--c"]: tile.color, ["--a"]: tile.accent }}
                onClick={() => onOpen(id)}
              >
                <span className="tile-chip-label">{tile.label}</span>
                <span className="tile-chip-kicker mono">{tile.kicker}</span>
                <IconArrow size={12} sw={2} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ━━━━━━━━━ FRANJA: Ecosistema Yodesarrollo (proyectos nivel=ecosistema) ━━━━━━━━━ */}
      {proyectosEco.length > 0 && (
        <div className="tier-eco">
          <span className="tier-eco-label mono">Ecosistema Yodesarrollo</span>
          <div className="tier-eco-row">
            {proyectosEco.map((p) => {
              const tile = lookup[p.id];
              if (!tile) return null;
              return (
                <button
                  key={p.id}
                  className="tile-eco"
                  style={{ ["--c"]: tile.color, ["--a"]: tile.accent }}
                  onClick={() => onOpen(p.id)}
                >
                  <span className="tile-eco-halo" aria-hidden></span>
                  <div className="tile-eco-icon"><tile.Icon size={30} sw={1.5} /></div>
                  <div className="tile-eco-meta">
                    <span className="tile-eco-label">{p.nombre}</span>
                    <span className="tile-eco-kicker mono">{p.kicker}</span>
                  </div>
                  <IconArrow size={13} sw={2} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <footer className="board-foot">
        <div className="foot-left">
          <a
            className="board-back-link"
            href={cfg.brand_url || "https://yodesarrollo.mx"}
            target="_blank"
            rel="noopener noreferrer"
          >
            ← yodesarrollo.mx
          </a>
          {cfg.foot_left && <span className="mono small muted">{cfg.foot_left}</span>}
        </div>
        <button className="foot-cta" onClick={() => onOpen("diagnostico")}>
          {cfg.foot_cta || "Empezar por el diagnóstico"} <IconArrow size={14} sw={2} />
        </button>
      </footer>
    </div>
  );
};

// ============================================================================
// SECTION VIEW (sin cambios estructurales)
// ============================================================================
const SectionView = ({ id, onHome, onNavigate }) => {
  const { data } = window.useData();
  const tilesById = window.buildTileLookup(data.tiles, data.proyectos);
  const tile = tilesById[id];
  if (!tile) return null;
  const C = tile.Section;
  return (
    <div className="section-wrap" key={id}>
      <C tile={tile} onHome={onHome} navigate={onNavigate} />
    </div>
  );
};

// ============================================================================
// APP SHELL — orquesta Cover → Dashboard → Section
// ============================================================================
const QRCompartible = ({ client }) => {
  const base = location.origin + location.pathname;
  const url = base + (client ? "?cliente=" + encodeURIComponent(client) : "");
  const qr = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=" + encodeURIComponent(url);
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    try { navigator.clipboard && navigator.clipboard.writeText(url); } catch (e) {}
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="qr-share">
      <img src={qr} alt="Código QR del board" className="qr-img" />
      <p className="qr-hint">El cliente lo escanea y abre el board{client ? " a su nombre" : ""} en su teléfono.</p>
      <button className="qr-copy" onClick={copy}>{copied ? "¡Link copiado!" : "Copiar link"}</button>
    </div>
  );
};

const AppShell = () => {
  const { data, status, refresh } = window.useData();

  const readHash = () => (location.hash || "").replace(/^#/, "") || null;
  const [view, setView] = React.useState(readHash());
  const [showCover, setShowCover] = React.useState(() => !readHash());
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const onHash = () => {
      const h = readHash();
      setView(h);
      if (h) setShowCover(false);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  React.useEffect(() => {
    document.body.dataset.aesthetic = t.aesthetic;
    document.body.dataset.theme = t.theme;
    document.body.dataset.mode = t.presentation ? "presentation" : "edit";
  }, [t.aesthetic, t.theme, t.presentation]);

  React.useEffect(() => {
    if (!data || !data.config) return;
    if (data.config.default_aesthetic && t.aesthetic === TWEAK_DEFAULTS.aesthetic) {
      setTweak("aesthetic", data.config.default_aesthetic);
    }
    if (data.config.default_client && !t.client) {
      setTweak("client", data.config.default_client);
    }
  }, [data]);

  // Estado compartible por URL: ?cliente=Juan&proyecto=dunas-kino&monto=500000
  const urlApplied = React.useRef(false);
  React.useEffect(() => {
    if (urlApplied.current) return;
    const params = new URLSearchParams(location.search || "");
    const cliente  = params.get("cliente");
    const proyecto = params.get("proyecto");
    const monto    = params.get("monto");
    if (cliente) setTweak("client", cliente);
    if (monto && !isNaN(+monto)) window.YDR_INITIAL_CAPITAL = +monto;
    if (proyecto) { location.hash = proyecto; setView(proyecto); setShowCover(false); }
    if (cliente || proyecto || monto) urlApplied.current = true;
  }, []);

  const open = (id) => { location.hash = id; setView(id); setShowCover(false); };
  const home = () => { location.hash = ""; setView(null); };
  const startFromCover = () => { setShowCover(false); };
  const backToCover = () => { setShowCover(true); home(); };

  if (status === "loading" && !data) return <DataLoadingView />;
  if (status === "error" && !data)   return <DataErrorView onRetry={refresh} />;

  return (
    <div className="app" data-mode={t.presentation ? "presentation" : "edit"}>
      {showCover && !view ? (
        <CoverScreen onStart={startFromCover} t={t} />
      ) : view ? (
        <SectionView id={view} onHome={home} onNavigate={open} />
      ) : (
        <Dashboard onOpen={open} t={t} />
      )}

      <DataSourceBadge />

      <TweaksPanel>
        <TweakSection label="Modo de uso" />
        <TweakToggle
          label="Modo presentación (oculta panel y stats)"
          value={t.presentation}
          onChange={(v) => setTweak("presentation", v)}
        />
        <button className="tweak-btn" onClick={backToCover}>
          Volver a la portada
        </button>

        <TweakSection label="Estética del board" />
        <TweakRadio
          label="Estilo"
          value={t.aesthetic}
          options={["carplay", "editorial", "mono"]}
          onChange={(v) => setTweak("aesthetic", v)}
        />
        <TweakRadio
          label="Tema"
          value={t.theme}
          options={["oscuro", "claro"]}
          onChange={(v) => setTweak("theme", v)}
        />

        <TweakSection label="Cabecera" />
        <TweakToggle label="Mostrar reloj" value={t.showClock} onChange={(v) => setTweak("showClock", v)} />
        <TweakText label="Nombre del cliente" value={t.client} placeholder="Ej. Sr. Hernández"
          onChange={(v) => setTweak("client", v)} />

        <TweakSection label="Compartir con el cliente" />
        <QRCompartible client={t.client} />

        <TweakSection label="Datos" />
        <button className="tweak-btn" onClick={refresh}>
          Recargar desde Sheets ⟳
        </button>
      </TweaksPanel>
    </div>
  );
};

const App = () => (
  <DataProvider>
    <AppShell />
  </DataProvider>
);

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
