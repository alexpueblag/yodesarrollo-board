// Yodesarrollo-Board · Sections
// Cada sección recibe { tile, navigate, onHome } y lee su data de useData().

const fmt   = (n) => "$" + Number(n || 0).toLocaleString("en-US");
const fmtMx = (n) => "$" + Number(n || 0).toLocaleString("en-US") + " MXN";

// --------------------------- Section shell ---------------------------
const Shell = ({ tile, onHome, navigate, related, kicker, children }) => (
  <div className="section" style={{ ["--accent"]: tile.accent }}>
    <header className="sec-head">
      <button className="chip-btn" onClick={onHome}>
        <IconHome size={18} /> <span>Board</span>
      </button>
      <div className="breadcrumb">
        <span className="kicker">{kicker || tile.kicker}</span>
        <span className="dot">·</span>
        <span className="crumb">{tile.label}</span>
      </div>
      <div className="head-right">
        <span className="mono small muted">YODESARROLLO · SAPI</span>
      </div>
    </header>
    <main className="sec-body">{children}</main>
    {related && related.length > 0 && (
      <footer className="related">
        <span className="related-label">Saltar a</span>
        <div className="related-row">
          {related.map((r) => {
            const { data } = window.useData();
            const lookup = window.buildTileLookup(data.tiles);
            const t = lookup[r];
            if (!t) return null;
            return (
              <button key={r} className="related-pill" onClick={() => navigate(r)}>
                {t.label}
                <IconArrow size={14} sw={2} />
              </button>
            );
          })}
        </div>
      </footer>
    )}
  </div>
);

// =============================================================================
// 1. DIAGNÓSTICO
// =============================================================================
const SecDiagnostico = (props) => {
  const { data, save } = window.useData();
  const formDef = (data.diagnostico && data.diagnostico.form) || [];
  const [answers, setAnswers] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState(null);

  const set = (k) => (e) => setAnswers((d) => ({ ...d, [k]: e.target.value }));
  const setChip = (k, v) => setAnswers((d) => ({ ...d, [k]: v }));

  // Agrupa preguntas por card_num
  const cards = React.useMemo(() => {
    const map = new Map();
    formDef
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach((f) => {
        const n = f.card_num;
        if (!map.has(n)) {
          map.set(n, { num: n, legend: f.card_legend, time: f.card_time, fields: [] });
        }
        map.get(n).fields.push(f);
      });
    return Array.from(map.values());
  }, [formDef]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const cliente = answers.nombre || "(sin nombre)";
      await save("save_diagnostico", { ...answers, cliente });
      setSavedAt(new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" }));
    } catch (e) {
      alert("No se pudo guardar: " + e.message + "\nLa respuesta queda en pantalla.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell {...props} related={["comparativo", "casa-alysa", "real-miramar"]}>
      <div className="diag">
        <div className="diag-intro">
          <h1 className="display">Antes de hablar de dónde invertir,<br/>hablemos de qué quieres construir.</h1>
          <p className="lead">Esta hoja la llenamos juntos. No hay respuestas correctas o incorrectas — solo respuestas honestas. Define la propuesta que tendrá sentido para ti.</p>
        </div>

        <div className="diag-grid">
          {cards.map((card) => (
            <fieldset key={card.num} className="card">
              <legend>{card.num} · {card.legend} <span className="time">{card.time}</span></legend>
              {card.fields.map((f) => {
                if (f.field_type === "text") {
                  return (
                    <label key={f.field_key}>{f.field_label}
                      <input
                        value={answers[f.field_key] || ""}
                        onChange={set(f.field_key)}
                        placeholder="—"
                      />
                    </label>
                  );
                }
                if (f.field_type === "textarea") {
                  return (
                    <label key={f.field_key}>{f.field_label}
                      <textarea
                        value={answers[f.field_key] || ""}
                        onChange={set(f.field_key)}
                        placeholder="—"
                        rows={f.rows || 2}
                      />
                    </label>
                  );
                }
                if (f.field_type === "chips") {
                  const opts = String(f.field_options || "").split("|").filter(Boolean);
                  return (
                    <label key={f.field_key}>{f.field_label}
                      <div className="chips">
                        {opts.map((c) => (
                          <button key={c} type="button"
                            className={"chip" + (answers[f.field_key] === c ? " on" : "")}
                            onClick={() => setChip(f.field_key, c)}>{c}</button>
                        ))}
                      </div>
                    </label>
                  );
                }
                return null;
              })}
            </fieldset>
          ))}
        </div>

        <div className="diag-save">
          <button className="foot-cta" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando…" : "Guardar respuestas"}
            <IconArrow size={14} sw={2} />
          </button>
          {savedAt && <span className="diag-saved-note mono">✓ Guardado a las {savedAt}</span>}
        </div>
      </div>
    </Shell>
  );
};

// =============================================================================
// 2. COMPARATIVO
// =============================================================================
const SecComparativo = (props) => {
  const { data } = window.useData();
  const rows = (data.comparativo || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Shell {...props} related={["diagnostico", "calculadora", "casa-alysa", "real-miramar"]}>
      <div className="comp">
        <div className="sec-title-row">
          <span className="kicker">Acto II · Análisis Comparado</span>
          <h1 className="display">Lo que tu dinero<br/>te rinde realmente.</h1>
          <p className="lead">Después de inflación e impuestos. Todo en una sola tabla, sin maquillaje.</p>
        </div>

        <table className="comp-table">
          <thead>
            <tr>
              <th>Instrumento</th>
              <th className="num">Bruto</th>
              <th className="num">− Inflación</th>
              <th className="num">− ISR</th>
              <th className="num">Real neto</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.instrumento} className={r.star ? "star" : ""}
                  onClick={r.link ? () => props.navigate(r.link) : undefined}>
                <td>{r.star && <span className="star-mark">★</span>}{r.instrumento}</td>
                <td className="num mono">{r.bruto}</td>
                <td className="num mono muted">{r.inflacion}</td>
                <td className="num mono muted">{r.isr}</td>
                <td className="num mono accent">{r.neto}</td>
                <td className="muted small">{r.nota}{r.link && <span className="row-arrow"> →</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pull-quote">
          <span className="quote-mark">"</span>
          Si tu dinero hoy te rinde 2–4% real, ¿cuánto puedes esperar para construir patrimonio?
        </div>
      </div>
    </Shell>
  );
};

// =============================================================================
// 3. CASA ALYSA
// =============================================================================
const SecCasaAlysa = (props) => {
  const { data } = window.useData();
  const hero    = (data.alysa && data.alysa.hero) || {};
  const tiers   = (data.alysa && data.alysa.tiers) || [];
  const porQue  = (data.alysa && data.alysa.por_que) || [];
  const como    = (data.alysa && data.alysa.como) || [];

  return (
    <Shell {...props} related={["calculadora", "garantias", "estrategia", "cronograma"]}>
      <div className="proj">
        <div className="proj-hero alysa-hero">
          <div className="hero-text">
            <span className="kicker">{hero.kicker}</span>
            <h1 className="display">{hero.display}</h1>
            <p className="lead">{hero.lead}</p>
            <div className="stat-row">
              <div className="stat"><span className="big mono">{hero.stat_1_value}</span><span className="mini">{hero.stat_1_label}</span></div>
              <div className="stat"><span className="big mono">{hero.stat_2_value}</span><span className="mini">{hero.stat_2_label}</span></div>
              <div className="stat"><span className="big mono">{hero.stat_3_value}</span><span className="mini">{hero.stat_3_label}</span></div>
              <div className="stat"><span className="big mono">{hero.stat_4_value}</span><span className="mini">{hero.stat_4_label}</span></div>
            </div>
          </div>
          <div className="hero-img">
            {hero.img_url ? (
              <img src={hero.img_url} alt={hero.img_caption || "Render Casa Alysa"} className="hero-img-real" />
            ) : (
              <div className="img-placeholder">
                <span className="ph-label">{hero.img_caption || "Render Casa Alysa"}</span>
                <span className="ph-sub">— {hero.ubicacion || "Altozano · Hermosillo"} —</span>
              </div>
            )}
          </div>
        </div>

        <section className="block">
          <h2 className="block-title">Estructura escalonada · más capital, mejor tasa</h2>
          <table className="comp-table">
            <thead>
              <tr>
                <th>Capital</th><th className="num">Tasa anual</th><th className="num">Retorno 6m</th><th className="num">Retorno 8m</th><th className="num">Total 8m</th>
              </tr>
            </thead>
            <tbody>
              {tiers.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((t) => (
                <tr key={t.capital} className={t.star ? "star" : ""}>
                  <td className="mono">{t.star && <span className="star-mark">★</span>}{fmt(t.capital)}</td>
                  <td className="num mono">{Number(t.rate).toFixed(2)}%</td>
                  <td className="num mono muted">{fmt(t.retorno6)}</td>
                  <td className="num mono muted">{fmt(t.retorno8)}</td>
                  <td className="num mono accent">{fmt(t.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted">Cálculo: Capital × Tasa anualizada × Meses ÷ 12. Ejemplo: $200K × 20% × 8/12 = $26,667.</p>
        </section>

        <section className="block two-col">
          <div>
            <h2 className="block-title">Por qué se coloca rápido</h2>
            <ul className="bullets">
              {porQue.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((b) => (
                <li key={b.order}><strong>{b.strong}</strong> — {b.text}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="block-title">Cómo entras</h2>
            <ul className="bullets">
              {como.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((b) => (
                <li key={b.order} dangerouslySetInnerHTML={{ __html: b.html }} />
              ))}
            </ul>
          </div>
        </section>
      </div>
    </Shell>
  );
};

// =============================================================================
// 4. REAL MIRAMAR
// =============================================================================
const SecRealMiramar = (props) => {
  const { data } = window.useData();
  const hero       = (data.miramar && data.miramar.hero) || {};
  const urbanismo  = (data.miramar && data.miramar.urbanismo) || [];
  const loteEj     = (data.miramar && data.miramar.lote_ejemplo) || [];

  return (
    <Shell {...props} related={["calculadora", "garantias", "estrategia", "cronograma"]}>
      <div className="proj">
        <div className="rm-hero compact">
          <div className="rm-hero-text">
            <span className="kicker">{hero.kicker}</span>
            <h1 className="display rm-display">{hero.display}</h1>
          </div>
          <div className="rm-hero-stats">
            <div className="rm-stat"><span className="rm-stat-val mono">{hero.stat_1_value}</span><span className="rm-stat-lbl mono">{hero.stat_1_label}</span></div>
            <div className="rm-stat"><span className="rm-stat-val mono accent">{hero.stat_2_value}</span><span className="rm-stat-lbl mono">{hero.stat_2_label}</span></div>
            <div className="rm-stat"><span className="rm-stat-val mono">{hero.stat_3_value}</span><span className="rm-stat-lbl mono">{hero.stat_3_label}</span></div>
            <div className="rm-stat"><span className="rm-stat-val mono">{hero.stat_4_value}</span><span className="rm-stat-lbl mono">{hero.stat_4_label}</span></div>
          </div>
        </div>

        <LoteSelector />

        <details className="rm-extras">
          <summary>Urbanismo integral · Caso fundador</summary>
          <div className="rm-extras-grid">
            <div>
              <h3 className="block-title">Urbanismo</h3>
              <ul className="bullets">
                {urbanismo.slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((u) => (
                  <li key={u.order}>{u.text}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="block-title">{(loteEj.find((r) => r.key === "titulo") || {}).label || "Lote 180 m² Fundador II"}</h3>
              <table className="kv">
                <tbody>
                  {loteEj.filter((r) => r.key !== "titulo").map((r) => (
                    <tr key={r.key} className={r.highlight ? "hi" : ""}>
                      <td>{r.label}</td>
                      <td className={"num mono" + (r.highlight ? " accent" : "")}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </div>
    </Shell>
  );
};

// =============================================================================
// 5. CALCULADORA
// =============================================================================
const SecCalculadora = (props) => {
  const { data } = window.useData();
  const brackets   = ((data.calculadora && data.calculadora.alysa_brackets) || []).slice().sort((a, b) => a.min_capital - b.min_capital);
  const mirConfig  = (data.calculadora && data.calculadora.miramar_config) || {};

  const minCap  = mirConfig.min_capital || 200000;
  const maxCap  = mirConfig.max_capital || 3000000;
  const step    = mirConfig.step || 50000;
  const plusvalia24m = (mirConfig.plusvalia_24m_pct || 53) / 100;
  const anualizado   = mirConfig.anualizado_pct || 26;

  const [proj, setProj] = React.useState("alysa");
  const [capital, setCapital] = React.useState(1000000);

  // Alysa tasa escalonada — busca el bracket más alto que cumpla c >= min_capital
  const alysaRate = (c) => {
    let rate = brackets.length ? brackets[0].rate : 20;
    for (const b of brackets) {
      if (c >= b.min_capital) rate = b.rate;
    }
    return rate;
  };

  let result;
  if (proj === "alysa") {
    const r = alysaRate(capital);
    const r8 = capital * (r / 100) * (8 / 12);
    result = {
      rate: r + "% anual",
      months: "8 meses",
      gain: r8,
      total: capital + r8,
      pct: (r8 / capital) * 100,
    };
  } else if (proj === "miramar") {
    const gain = capital * plusvalia24m;
    result = {
      rate: anualizado + "% anualizado",
      months: "24 meses",
      gain,
      total: capital + gain,
      pct: plusvalia24m * 100,
    };
  } else {
    const r = alysaRate(capital);
    const r8 = capital * (r / 100) * (8 / 12);
    const after8 = capital + r8;
    const miramarGain = after8 * (plusvalia24m * 16 / 24);
    const total = after8 + miramarGain;
    result = {
      rate: Math.round(((total / capital - 1) * 100)) + "% acumulado",
      months: "24 meses",
      gain: total - capital,
      total,
      pct: ((total - capital) / capital) * 100,
    };
  }

  const quickPicks = [200000, 500000, 1000000, 2000000].filter((v) => v >= minCap && v <= maxCap);

  return (
    <Shell {...props} related={["casa-alysa", "real-miramar", "estrategia"]}>
      <div className="calc">
        <div className="sec-title-row">
          <span className="kicker">Simulador interactivo</span>
          <h1 className="display">Calculadora de inversión</h1>
          <p className="lead">Mueve el capital, escoge vehículo, ve el resultado al instante.</p>
        </div>

        <div className="calc-grid">
          <div className="calc-controls card">
            <div className="control">
              <label>Vehículo</label>
              <div className="seg">
                {[
                  { id: "alysa", t: "Casa Alysa · 8m" },
                  { id: "miramar", t: "Real Miramar · 24m" },
                  { id: "combo", t: "Combinado · 24m" },
                ].map((o) => (
                  <button key={o.id} className={proj === o.id ? "on" : ""} onClick={() => setProj(o.id)}>{o.t}</button>
                ))}
              </div>
            </div>

            <div className="control">
              <label>Capital a invertir <span className="cap-value mono">{fmt(capital)}</span></label>
              <input type="range" min={minCap} max={maxCap} step={step} value={capital}
                onChange={(e) => setCapital(+e.target.value)} />
              <div className="ticks">
                <span>{fmt(minCap)}</span>
                <span>$1M</span>
                <span>$2M</span>
                <span>{fmt(maxCap)}</span>
              </div>
            </div>

            <div className="control quick">
              {quickPicks.map((v) => (
                <button key={v} className={capital === v ? "on" : ""} onClick={() => setCapital(v)}>{fmt(v)}</button>
              ))}
            </div>
          </div>

          <div className="calc-result card">
            <div className="result-row">
              <span className="r-label">Tasa / rendimiento</span>
              <span className="r-value mono accent">{result.rate}</span>
            </div>
            <div className="result-row">
              <span className="r-label">Plazo</span>
              <span className="r-value mono">{result.months}</span>
            </div>
            <div className="result-row">
              <span className="r-label">Ganancia bruta</span>
              <span className="r-value mono">{fmt(Math.round(result.gain))}</span>
            </div>
            <div className="result-row big">
              <span className="r-label">Total al cierre</span>
              <span className="r-value mono accent">{fmt(Math.round(result.total))}</span>
            </div>
            <div className="result-bar">
              <div className="bar-track">
                <div className="bar-fill" style={{ width: Math.min(100, result.pct) + "%" }}></div>
              </div>
              <span className="bar-pct mono">+{result.pct.toFixed(1)}%</span>
            </div>
            <p className="small muted">Proyección sobre tasa preferente / plusvalía bruta. Antes de inflación e ISR. Sujeto a contrato escriturado.</p>
          </div>
        </div>
      </div>
    </Shell>
  );
};

// =============================================================================
// 6. ESTRATEGIA COMBINADA
// =============================================================================
const SecEstrategia = (props) => {
  const { data } = window.useData();
  const hero  = (data.estrategia && data.estrategia.hero) || {};
  const steps = ((data.estrategia && data.estrategia.steps) || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Shell {...props} related={["calculadora", "casa-alysa", "real-miramar", "garantias"]}>
      <div className="strat">
        <div className="sec-title-row">
          <span className="kicker">{hero.kicker}</span>
          <h1 className="display">{hero.display_line1}<br/>{hero.display_line2}</h1>
          <p className="lead">{hero.lead}</p>
          <div className="stat-row">
            <div className="stat"><span className="big mono">{hero.stat_1_value}</span><span className="mini">{hero.stat_1_label}</span></div>
            <div className="stat"><span className="big mono">{hero.stat_2_value}</span><span className="mini">{hero.stat_2_label}</span></div>
            <div className="stat"><span className="big mono">{hero.stat_3_value}</span><span className="mini">{hero.stat_3_label}</span></div>
            <div className="stat"><span className="big mono accent">{hero.stat_4_value}</span><span className="mini">{hero.stat_4_label}</span></div>
          </div>
        </div>

        <section className="block">
          <h2 className="block-title">Línea de tiempo de la estrategia</h2>
          <div className="timeline">
            {steps.map((s, i) => (
              <div key={i} className="tl-step">
                <div className="tl-marker">
                  <span className="tl-num mono">{i + 1}</span>
                </div>
                <div className="tl-body">
                  <span className="tl-mes mono accent">{s.mes}</span>
                  <span className="tl-title">{s.titulo}</span>
                  <span className="tl-note muted small">{s.note}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
};

// =============================================================================
// 7. GARANTÍAS
// =============================================================================
const SecGarantias = (props) => {
  const { data } = window.useData();
  const hero  = (data.garantias && data.garantias.hero) || {};
  const cards = ((data.garantias && data.garantias.cards) || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Shell {...props} related={["casa-alysa", "real-miramar", "decision"]}>
      <div className="gar">
        <div className="sec-title-row">
          <span className="kicker">{hero.kicker}</span>
          <h1 className="display">{hero.display_line1}<br/>{hero.display_line2}</h1>
          <p className="lead">{hero.lead}</p>
        </div>

        <div className="gar-grid">
          {cards.map((g) => (
            <article key={g.numero} className="gar-card">
              <span className="gar-num mono">{g.numero}</span>
              <h3>{g.titulo}</h3>
              <p>{g.cuerpo}</p>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
};

// =============================================================================
// 8. CRONOGRAMA
// =============================================================================
const SecCronograma = (props) => {
  const { data } = window.useData();
  const cr = data.cronograma || {};
  const hero          = cr.hero || {};
  const meses         = (cr.meses || []).slice().sort((a, b) => a.mes - b.mes);
  const alysaHitos    = (cr.alysa_hitos || []).slice().sort((a, b) => a.mes - b.mes);
  const miramarHitos  = (cr.miramar_hitos || []).slice().sort((a, b) => a.mes - b.mes);
  const bulletsAlysa  = ((cr.bullets_alysa) || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const bulletsMir    = ((cr.bullets_miramar) || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const quote         = (cr.quote && cr.quote.quote) || "";

  const TOTAL = hero.total_meses || 24;
  const pct = (m) => (m / TOTAL) * 100;

  return (
    <Shell {...props} related={["casa-alysa", "real-miramar", "estrategia", "decision"]}>
      <div className="crono">
        <div className="sec-title-row">
          <span className="kicker">{hero.kicker}</span>
          <h1 className="display">{hero.display}</h1>
          <p className="lead">{hero.lead}</p>
          <div className="stat-row">
            <div className="stat"><span className="big mono">{hero.stat_1_value}</span><span className="mini">{hero.stat_1_label}</span></div>
            <div className="stat"><span className="big mono">{hero.stat_2_value}</span><span className="mini">{hero.stat_2_label}</span></div>
            <div className="stat"><span className="big mono accent">{hero.stat_3_value}</span><span className="mini">{hero.stat_3_label}</span></div>
            <div className="stat"><span className="big mono accent">{hero.stat_4_value}</span><span className="mini">{hero.stat_4_label}</span></div>
          </div>
        </div>

        <section className="block">
          <h2 className="block-title">Cronograma maestro</h2>
          <div className="cron-chart">
            <div className="cron-grid">
              {meses.map((tick) => (
                <div key={tick.mes} className="cron-grid-line" style={{ left: pct(tick.mes) + "%" }}>
                  <span className="cron-grid-month mono">{tick.label}</span>
                </div>
              ))}
              <div className="cron-year-marker" style={{ left: pct(12) + "%" }}>
                <span className="ymk-tag mono">Año 1</span>
              </div>
              <div className="cron-year-marker" style={{ left: pct(24) + "%" }}>
                <span className="ymk-tag mono">Año 2</span>
              </div>
            </div>

            <div className="cron-row">
              <div className="cron-row-label">
                <span className="crl-name">Casa Alysa</span>
                <span className="crl-sub mono">Yield · 8m</span>
              </div>
              <div className="cron-row-track">
                <div className="cron-bar alysa" style={{ left: pct(0) + "%", width: (pct(10) - pct(0)) + "%" }}></div>
                {alysaHitos.map((h) => (
                  <div key={h.mes} className={"cron-hito alysa-hito" + (h.mes === 0 ? " hi" : "")}
                       style={{ left: pct(h.mes) + "%" }}>
                    <span className="ht-dot"></span>
                    <span className="ht-label">
                      <span className="ht-title">{h.label}</span>
                      {h.note && <span className="ht-note mono">{h.note}</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="cron-row">
              <div className="cron-row-label">
                <span className="crl-name">Real Miramar</span>
                <span className="crl-sub mono">Plusvalía · 24m+</span>
              </div>
              <div className="cron-row-track">
                <div className="cron-bar miramar" style={{ left: pct(0) + "%", width: (pct(24) - pct(0)) + "%" }}></div>
                <div className="cron-plus-seg" style={{ left: pct(12) + "%", width: (pct(24) - pct(12)) + "%" }}>
                  <span className="cps-tag">+10% / año</span>
                </div>
                {miramarHitos.map((h) => (
                  <div key={h.mes} className={"cron-hito miramar-hito" + (h.hi ? " hi" : "") + (h.bigDot ? " big" : "")}
                       style={{ left: pct(h.mes) + "%" }}>
                    <span className="ht-dot"></span>
                    <span className="ht-label">
                      <span className="ht-title">{h.label}</span>
                      <span className="ht-price mono">{h.price}</span>
                      <span className={"ht-gain mono" + (h.hi ? " hi" : "")}>{h.gain}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="block two-col">
          <div>
            <h2 className="block-title">Hitos Casa Alysa</h2>
            <ul className="bullets">
              {bulletsAlysa.map((b) => (
                <li key={b.order}><strong>{b.mes_label}</strong> · {b.titulo}, {b.descripcion}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="block-title">Hitos Real Miramar</h2>
            <ul className="bullets">
              {bulletsMir.map((b) => (
                <li key={b.order}>
                  <strong>{b.mes_label}</strong> · {b.titulo} · <span className="accent">{b.precio}</span>{" "}
                  {b.extra && <span className="muted small">{b.extra}</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {quote && (
          <div className="pull-quote">
            <span className="quote-mark">"</span>
            {quote}
          </div>
        )}
      </div>
    </Shell>
  );
};

// =============================================================================
// 9. DECISIÓN
// =============================================================================
const SecDecision = (props) => {
  const { data } = window.useData();
  const hero  = (data.decision && data.decision.hero) || {};
  const paths = (data.decision && data.decision.paths) || [];

  return (
    <Shell {...props} related={["contacto", "garantias", "casa-alysa", "real-miramar"]}>
      <div className="dec">
        <div className="sec-title-row">
          <span className="kicker">{hero.kicker}</span>
          <h1 className="display">{hero.display_line1}<br/>{hero.display_line2}</h1>
          <p className="lead">{hero.lead}</p>
        </div>

        <div className="path-grid">
          {paths.map((p) => (
            <article key={p.letra} className={"path-card" + (p.strong ? " strong" : "")}>
              <span className="path-letter mono">{p.letra}</span>
              <h3>{p.titulo}</h3>
              <span className="path-sub muted">{p.sub}</span>
              <p>{p.descripcion}</p>
              <button className="path-cta">{p.cta} <IconArrow size={14} sw={2} /></button>
            </article>
          ))}
        </div>
      </div>
    </Shell>
  );
};

// =============================================================================
// 10. CONTACTO
// =============================================================================
const SecContacto = (props) => {
  const { data } = window.useData();
  const hero    = (data.contacto && data.contacto.hero) || {};
  const asesor  = (data.contacto && data.contacto.asesor) || {};
  const docs    = ((data.contacto && data.contacto.docs) || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const cta     = (data.contacto && data.contacto.cta) || {};

  return (
    <Shell {...props} related={["decision", "diagnostico"]}>
      <div className="contact">
        <div className="sec-title-row">
          <span className="kicker">{hero.kicker}</span>
          <h1 className="display">{hero.display_line1}<br/>{hero.display_line2}</h1>
          <p className="lead">{hero.lead}</p>
        </div>

        <div className="contact-grid">
          <article className="contact-card">
            <span className="kicker">{asesor.kicker}</span>
            <h3>{asesor.nombre}</h3>
            <span className="role muted">{asesor.rol}</span>
            <ul className="contact-list">
              <li><span className="muted">WhatsApp</span><span className="mono">{asesor.whatsapp}</span></li>
              <li><span className="muted">Correo</span><span className="mono">{asesor.correo}</span></li>
              <li><span className="muted">Web</span><span className="mono">{asesor.web}</span></li>
              <li><span className="muted">Oficina</span><span>{asesor.oficina}</span></li>
            </ul>
          </article>

          <article className="contact-card">
            <span className="kicker">Material para llevar</span>
            <h3>Documentos disponibles</h3>
            <ul className="doc-list">
              {docs.map((d) => (
                <li key={d.order}>
                  {d.url
                    ? <a href={d.url} target="_blank" rel="noreferrer"><span>{d.titulo}</span><span className="muted small">{d.meta}</span></a>
                    : (<><span>{d.titulo}</span><span className="muted small">{d.meta}</span></>)
                  }
                </li>
              ))}
            </ul>
          </article>

          <article className="contact-card cta-card">
            <h3>{cta.titulo}</h3>
            <p>{cta.cuerpo}</p>
            {cta.url
              ? <a href={cta.url} target="_blank" rel="noreferrer" className="path-cta">{cta.cta} <IconArrow size={14} sw={2} /></a>
              : <button className="path-cta">{cta.cta} <IconArrow size={14} sw={2} /></button>
            }
          </article>
        </div>
      </div>
    </Shell>
  );
};

Object.assign(window, {
  SecDiagnostico, SecComparativo, SecCasaAlysa, SecRealMiramar,
  SecCalculadora, SecEstrategia, SecGarantias, SecCronograma,
  SecDecision, SecContacto,
});
