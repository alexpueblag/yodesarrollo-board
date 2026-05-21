// LoteSelector — versión data-driven
// Lotes, etapas y precios comerciales vienen de useData() (Sheets).
// STATUS_META queda local (tokens visuales fijos, no editables).

const fmtMxLot = (n) => "$" + Math.round(n).toLocaleString("en-US");
const LOTES_STORAGE_KEY = "yodes_lote_positions_v2_h";

// Tokens visuales del estado del lote — fijos, no van a Sheets
const STATUS_META = {
  available:  { label: "Disponible",  color: "#a4be90", hex: "rgba(164,190,144,0.35)" },
  reserved:   { label: "Reservado",   color: "#c79a8a", hex: "rgba(199,154,138,0.45)" },
  sold:       { label: "Vendido",     color: "#7a5a45", hex: "rgba(122,90,69,0.55)" },
  commercial: { label: "Comercial",   color: "#7aa6d6", hex: "rgba(122,166,214,0.35)" },
};
window.STATUS_META = STATUS_META;

const LoteSelector = (props) => {
  const { data } = window.useData();
  const tile = (props && props.tile) || {};
  const mir = (data.miramar) || {};
  const heroData = mir.hero || {};

  const LOTES = (tile.lotes && tile.lotes.length) ? tile.lotes : (mir.lotes || []);
  const ETAPAS = ((tile.etapas && tile.etapas.length) ? tile.etapas : (mir.etapas || []))
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const COMERCIAL_PRICE_M2 = tile.pv_lista || heroData.commercial_price_m2 || 5250;
  const COMERCIAL_LABEL    = tile.commercial_label || heroData.commercial_label || "Venta directa · Mayo 2026";
  const masterPlanUrl      = tile.master_plan_url || tile.img_url || heroData.master_plan_url || "assets/miramar_master_plan_h.png";

  // Encuentra la etapa actual (current = true). Fallback: la primera no-done.
  const fundII = ETAPAS.find((e) => e.current) || ETAPAS.find((e) => !e.done) || ETAPAS[0] || {};
  const ventaEtapa = ETAPAS[ETAPAS.length - 1] || {};

  const [selected, setSelected] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [highlight, setHighlight] = React.useState(ventaEtapa.id || "venta");
  const [editMode, setEditMode] = React.useState(false);
  const [showExport, setShowExport] = React.useState(false);

  // Posiciones de los marcadores. Persistidas en localStorage para ajuste fino sin tocar Sheets.
  const [positions, setPositions] = React.useState({});

  React.useEffect(() => {
    if (!LOTES.length) return;
    const defaults = Object.fromEntries(LOTES.map((l) => [l.n, { x: l.x, y: l.y }]));
    try {
      const saved = localStorage.getItem(LOTES_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((k) => { if (defaults[k]) defaults[k] = parsed[k]; });
      }
    } catch (e) {}
    setPositions(defaults);
  }, [LOTES.length]);

  React.useEffect(() => {
    if (Object.keys(positions).length === 0) return;
    try { localStorage.setItem(LOTES_STORAGE_KEY, JSON.stringify(positions)); } catch (e) {}
  }, [positions]);

  const mapRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const exportTextRef = React.useRef(null);

  const filtered = LOTES.filter((l) => {
    if (filter === "all") return true;
    if (filter === "habitacional") return l.uso === "HABITACIONAL";
    if (filter === "comercial") return l.uso === "COMERCIAL";
    if (filter === "available") return l.status === "available";
    if (filter === "reserved") return l.status === "reserved";
    return true;
  });

  const sel = LOTES.find((l) => l.n === selected);
  const isComercial = (l) => l && l.uso === "COMERCIAL";

  // Drag handlers
  const startDrag = (e, n) => {
    if (!editMode) return;
    e.preventDefault(); e.stopPropagation();
    dragRef.current = { n }; setSelected(n);
  };
  const onMapMove = (e) => {
    if (!editMode || !dragRef.current || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    setPositions((p) => ({ ...p, [dragRef.current.n]: { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } }));
  };
  const endDrag = () => { dragRef.current = null; };

  const exportText = LOTES.map((l) => {
    const p = positions[l.n] || { x: l.x, y: l.y };
    return `${String(l.n).padStart(2, " ")}\t${l.m2}\t${l.uso}\t${p.x}\t${p.y}\t${l.status}`;
  }).join("\n");

  const copyToClipboard = async () => {
    try { await navigator.clipboard.writeText(exportText); alert("✓ Coordenadas copiadas — pégalas en la pestaña 'Miramar-Lotes' del Sheet."); }
    catch (e) {
      if (exportTextRef.current) {
        exportTextRef.current.focus(); exportTextRef.current.select();
        try { document.execCommand("copy"); alert("✓ Copiado."); }
        catch (e2) { alert("Selecciona el texto y copia con Cmd/Ctrl+C."); }
      }
    }
  };
  const resetPositions = () => {
    if (confirm("¿Restablecer marcadores a posiciones del Sheet?")) {
      setPositions(Object.fromEntries(LOTES.map((l) => [l.n, { x: l.x, y: l.y }])));
    }
  };

  // Stats
  const stats = {
    available: LOTES.filter((l) => l.status === "available" && l.uso === "HABITACIONAL").length,
    reserved: LOTES.filter((l) => l.status === "reserved").length,
    commercial: LOTES.filter((l) => l.status === "commercial").length,
  };

  return (
    <div className="lotes">
      <div className="lotes-head-compact">
        <div>
          <span className="kicker">Master plan · {LOTES.length} lotes</span>
          <h2 className="block-title" style={{ marginTop: 4 }}>Real Miramar</h2>
        </div>
        <div className="lotes-stats-compact">
          <div className="lsc"><span className="lsc-num mono accent">{stats.available}</span><span className="lsc-lbl mono">Disponibles</span></div>
          <span className="lsc-sep">·</span>
          <div className="lsc"><span className="lsc-num mono">{stats.reserved}</span><span className="lsc-lbl mono">Reservados</span></div>
          <span className="lsc-sep">·</span>
          <div className="lsc"><span className="lsc-num mono">{stats.commercial}</span><span className="lsc-lbl mono">Comerciales</span></div>
        </div>
      </div>

      <div className="filters-compact">
        {[
          { id: "all", t: "Todos" },
          { id: "habitacional", t: "Habitacional" },
          { id: "comercial", t: "Comercial" },
          { id: "available", t: "Disponibles" },
          { id: "reserved", t: "Reservados" },
        ].map((o) => (
          <button key={o.id} className={"chip" + (filter === o.id ? " on" : "")} onClick={() => setFilter(o.id)}>{o.t}</button>
        ))}
      </div>

      <div className="lotes-grid">
        <div className="lotes-map">
          {editMode && (
            <div className="edit-banner">
              <span className="overline mono accent">Modo ajuste</span>
              <span className="small muted">Arrastra marcadores. Guardado local. Para persistir, copia coords al Sheet.</span>
              <button className="chip" onClick={() => setShowExport((v) => !v)}>{showExport ? "Ocultar" : "Ver coords"}</button>
              <button className="chip" onClick={resetPositions}>Restablecer del Sheet</button>
            </div>
          )}
          {editMode && showExport && (
            <div className="export-box">
              <div className="export-head">
                <span className="overline mono">Pegar en pestaña 'Miramar-Lotes' del Sheet</span>
                <button className="chip on" onClick={copyToClipboard}>📋 Copiar</button>
              </div>
              <textarea ref={exportTextRef} readOnly className="export-text"
                value={exportText} onClick={(e) => e.target.select()} spellCheck={false} />
            </div>
          )}

          <div
            className={"map-wrap" + (editMode ? " editing" : "")}
            ref={mapRef}
            onMouseMove={onMapMove}
            onMouseUp={endDrag}
            onMouseLeave={endDrag}
          >
            <img src={masterPlanUrl} alt="Master plan Real Miramar" draggable={false}
                 onError={(e) => { e.target.src = "assets/miramar_master_plan_h.png"; }} />

            {filtered.map((l) => {
              const pos = positions[l.n] || { x: l.x, y: l.y };
              const meta = STATUS_META[l.status] || STATUS_META.available;
              const isSel = l.n === selected;
              return (
                <button
                  key={l.n}
                  className={"lote-dot status-" + l.status + (isSel ? " sel" : "")}
                  style={{ left: pos.x + "%", top: pos.y + "%", ["--dot-color"]: meta.color }}
                  onMouseDown={(e) => startDrag(e, l.n)}
                  onClick={(e) => { e.stopPropagation(); if (!editMode) setSelected(l.n); }}
                  title={`Lote ${l.n} · ${l.m2} m² · ${l.uso}`}
                >
                  <span className="dot-num">{l.n}</span>
                </button>
              );
            })}
          </div>

          <div className="map-legend">
            {Object.entries(STATUS_META).map(([k, v]) => (
              <div key={k} className="legend-item">
                <span className="legend-swatch" style={{ background: v.color }}></span>
                <span className="legend-label">{v.label}</span>
              </div>
            ))}
            <button className={"chip edit-toggle" + (editMode ? " on" : "")}
              onClick={() => setEditMode((v) => !v)}>
              {editMode ? "✕ Cerrar ajuste" : "✎ Ajustar"}
            </button>
          </div>
        </div>

        <aside className="lote-detail">
          {sel ? (
            <LoteDetail
              lote={sel} fundII={fundII} ventaEtapa={ventaEtapa} ETAPAS={ETAPAS}
              highlight={highlight} setHighlight={setHighlight} isComercial={isComercial}
              comercialPriceM2={COMERCIAL_PRICE_M2} comercialLabel={COMERCIAL_LABEL}
            />
          ) : (
            <EmptyState fundII={fundII} />
          )}
        </aside>
      </div>

      <details className="lotes-table-wrap">
        <summary>Tabla completa <span className="muted small">· {filtered.length} de {LOTES.length} lotes</span></summary>
        <div className="lotes-table-scroll">
          <table className="lotes-table">
            <thead>
              <tr>
                <th>Lote</th><th>m²</th><th>Uso</th>
                <th className="num">F.II (hoy)</th>
                <th className="num">Precio Venta</th>
                <th className="num">Rend. Venta</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const fIIPrice = Math.round(l.m2 * (fundII.price_m2 || 0));
                const ventaPrice = isComercial(l)
                  ? Math.round(l.m2 * COMERCIAL_PRICE_M2)
                  : Math.round(l.m2 * (ventaEtapa.price_m2 || 0));
                const gainPct = isComercial(l)
                  ? null
                  : (((ventaEtapa.price_m2 || 0) / (fundII.price_m2 || 1)) - 1) * 100;
                const metaSt = STATUS_META[l.status] || STATUS_META.available;
                return (
                  <tr key={l.n} className={selected === l.n ? "sel" : ""} onClick={() => setSelected(l.n)}>
                    <td className="mono">{String(l.n).padStart(2, "0")}</td>
                    <td className="mono">{Number(l.m2).toLocaleString("en-US", { maximumFractionDigits: 3 })}</td>
                    <td className="muted small">{l.uso}</td>
                    <td className="num mono">{isComercial(l) ? <span className="muted">—</span> : fmtMxLot(fIIPrice)}</td>
                    <td className="num mono accent">{fmtMxLot(ventaPrice)}</td>
                    <td className="num mono">
                      {gainPct !== null ? <span className="gain-pct">+{gainPct.toFixed(1)}%</span> : <span className="muted">—</span>}
                    </td>
                    <td>
                      <span className={"status-pill mini status-" + l.status}>
                        <span className="dot" style={{ background: metaSt.color }}></span>
                        {metaSt.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// LoteDetail — panel de detalle con plusvalía calculada desde F.II
// ═══════════════════════════════════════════════════════════════════
const LoteDetail = ({ lote, fundII, ventaEtapa, ETAPAS, highlight, setHighlight, isComercial, comercialPriceM2, comercialLabel }) => {
  const fIIPrice = lote.m2 * (fundII.price_m2 || 0);
  const meta = STATUS_META[lote.status] || STATUS_META.available;

  if (isComercial(lote)) {
    const total = lote.m2 * comercialPriceM2;
    return (
      <>
        <header className="ld-head">
          <div>
            <span className="overline mono">Lote {String(lote.n).padStart(2, "0")}</span>
            <h3 className="ld-title">{Number(lote.m2).toLocaleString("en-US", { maximumFractionDigits: 3 })} <span className="ld-unit">m²</span></h3>
            <span className="ld-uso">{lote.uso}</span>
          </div>
          <span className={"status-pill status-" + lote.status}>
            <span className="dot" style={{ background: meta.color }}></span>
            {meta.label}
          </span>
        </header>

        <div className="ld-price-block direct">
          <span className="overline mono">{comercialLabel}</span>
          <span className="ld-price mono accent">{fmtMxLot(total)}</span>
          <span className="ld-price-sub mono muted">
            {Number(lote.m2).toLocaleString("en-US", { maximumFractionDigits: 3 })} m² × {fmtMxLot(comercialPriceM2)} /m²
          </span>
        </div>
        <p className="ld-note">
          Los lotes <strong>COMERCIAL</strong> ya no entran en preventa escalonada. <strong className="accent">Precio fijo de venta directa</strong> al público.
        </p>
      </>
    );
  }

  return (
    <>
      <header className="ld-head">
        <div>
          <span className="overline mono">Lote {String(lote.n).padStart(2, "0")}</span>
          <h3 className="ld-title">{Number(lote.m2).toLocaleString()} <span className="ld-unit">m²</span></h3>
          <span className="ld-uso">{lote.uso}</span>
        </div>
        <span className={"status-pill status-" + lote.status}>
          <span className="dot" style={{ background: meta.color }}></span>
          {meta.label}
        </span>
      </header>

      <div className="ld-entry">
        <span className="overline mono">Tu entrada hoy · {fundII.label}</span>
        <span className="ld-entry-price mono accent">{fmtMxLot(fIIPrice)}</span>
        <span className="ld-entry-sub mono muted">{lote.m2} m² × {fmtMxLot(fundII.price_m2)} /m²</span>
      </div>

      <div className="ld-plusvalia">
        <span className="overline mono">Tu rendimiento al cierre de cada etapa</span>
        <ul className="plus-list">
          {ETAPAS.map((e) => {
            if (e.done) return null;
            const stagePrice = lote.m2 * (e.price_m2 || 0);
            const gain = stagePrice - fIIPrice;
            const gainPct = fIIPrice ? (gain / fIIPrice) * 100 : 0;
            const isFII = e.id === fundII.id;
            const isHi = e.id === highlight;
            return (
              <li key={e.id}
                  className={"plus-row" + (isFII ? " fii" : "") + (isHi ? " hi" : "")}
                  onClick={() => setHighlight(e.id)}>
                <div className="pr-left">
                  <span className="pr-name">{e.label}</span>
                  <span className="pr-stage-price mono muted">{fmtMxLot(e.price_m2)}/m²</span>
                </div>
                <div className="pr-right">
                  <span className="pr-total mono">{fmtMxLot(stagePrice)}</span>
                  {isFII ? (
                    <span className="pr-gain pr-entry mono">Tu entrada</span>
                  ) : (
                    <span className={"pr-gain mono " + (gain > 0 ? "up" : "down")}>
                      {gain > 0 ? "+" : ""}{fmtMxLot(gain)} · {gainPct > 0 ? "+" : ""}{gainPct.toFixed(1)}%
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {(() => {
        const highEt = ETAPAS.find((e) => e.id === highlight);
        if (!highEt || highEt.done || highEt.id === fundII.id) return null;
        const stagePrice = lote.m2 * (highEt.price_m2 || 0);
        const gain = stagePrice - fIIPrice;
        const gainPct = fIIPrice ? (gain / fIIPrice) * 100 : 0;
        return (
          <div className="ld-projection">
            <span className="overline mono">Si vendes en {highEt.label}</span>
            <div className="proj-numbers">
              <div className="pn">
                <span className="pn-label">Plusvalía bruta</span>
                <span className="pn-val mono accent">+{fmtMxLot(gain)}</span>
              </div>
              <div className="pn">
                <span className="pn-label">Rendimiento</span>
                <span className="pn-val mono accent">+{gainPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        );
      })()}

      {lote.status === "available" && (
        <div className="ld-payment">
          <span className="overline mono">Esquema de pago {fundII.label}</span>
          <div className="pay-row">
            <span>Anticipo 35%</span>
            <span className="mono">{fmtMxLot(fIIPrice * 0.35)}</span>
          </div>
          <div className="pay-row">
            <span>3 pagos por hito</span>
            <span className="mono">{fmtMxLot(fIIPrice * 0.65 / 3)} c/u</span>
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════════════
// EmptyState
// ═══════════════════════════════════════════════════════════════════
const EmptyState = ({ fundII }) => (
  <div className="ld-empty">
    <span className="overline mono">Sin selección</span>
    <p>Toca cualquier marcador en el plano para ver la superficie, uso, precio y rendimiento estimado del lote.</p>
    <div className="ld-empty-hint">
      <span className="overline mono">Precio {fundII.label} · HOY</span>
      <span className="hint-price mono accent">{fmtMxLot(fundII.price_m2 || 0)} <em>/m²</em></span>
      <span className="muted small">Tu rendimiento se mide desde aquí.</span>
    </div>
  </div>
);

window.LoteSelector = LoteSelector;
