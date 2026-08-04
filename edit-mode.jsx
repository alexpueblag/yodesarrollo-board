// Yodesarrollo Board · Modo Edición v1 (solo frontend)
//
// Herramienta de Dirección/Comercial: clic en cualquier dato del board →
// ver a qué celda/campo del Sheet está anclado → editarlo. Las ediciones
// viven en localStorage (ydr_overrides_v1, ver data-loader.jsx) y se aplican
// encima de la data en cada render. La escritura real al Sheet es v2 (GAS,
// action "editarCampo").
//
// CERO impacto para quien no tiene rol: si sessionStorage pyod_rol no es
// "direccion" ni "comercial", este componente devuelve null y no pinta nada.

(() => {

// ── Ancla del cronograma: fecha de arranque guardada localmente ─────────────
// Permite corregir el eje de tiempo sin depender del Sheet (útil mientras la
// cuenta de Google está fuera). Si el Sheet trae hero.fecha_inicio, ese manda.
const ANCLA_LSK = "ydr_ancla_crono_v1";
window.YDR_ANCLA_CRONO = {
  get() { try { return localStorage.getItem(ANCLA_LSK) || ""; } catch (e) { return ""; } },
  set(v) {
    try { v ? localStorage.setItem(ANCLA_LSK, v) : localStorage.removeItem(ANCLA_LSK); } catch (e) {}
    window.dispatchEvent(new CustomEvent("ydr-ancla-crono"));
  },
};

const ROLES_EDICION = ["direccion", "comercial"];
const rolSesion = () => {
  try { return (sessionStorage.getItem("pyod_rol") || "").toLowerCase(); } catch (e) { return ""; }
};

// ── Búsqueda de anclas en el árbol data ─────────────────────────────────────
const norm = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();

// Recorre data en profundidad y devuelve [{path, value}] cuyos valores (como
// string normalizado) igualan `text`. Con partial=true busca contención.
const findAnchors = (data, text, partial = false) => {
  const target = norm(text);
  if (!target) return [];
  const out = [];
  const walk = (node, path) => {
    if (out.length >= 12) return;
    if (node == null) return;
    if (typeof node === "object") {
      if (Array.isArray(node)) node.forEach((v, i) => walk(v, path ? path + "." + i : String(i)));
      else Object.keys(node).forEach((k) => walk(node[k], path ? path + "." + k : k));
      return;
    }
    const v = norm(node);
    if (!v) return;
    const hit = partial ? (v.indexOf(target) !== -1 || target.indexOf(v) !== -1) : v === target;
    if (hit) out.push({ path, value: node });
  };
  walk(data, "");
  return out;
};

// Traduce "cronograma.hero.stat_1_value" → "hoja cronograma → hero → stat_1_value"
// e índices → "fila N" (1-based, como se lee en un Sheet).
const anclaLegible = (path) => {
  const parts = String(path).split(".");
  return parts
    .map((p, i) => {
      if (/^\d+$/.test(p)) return "fila " + (parseInt(p, 10) + 1);
      return i === 0 ? "hoja " + p : p;
    })
    .join(" → ");
};

const fechaCorta = (ts) => {
  try {
    return new Date(ts).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return ""; }
};

// ── Texto del nodo clickeado ────────────────────────────────────────────────
// Sube desde el target hasta un elemento con texto propio razonable (< 140
// chars); evita agarrar contenedores enormes.
const textoClic = (el) => {
  let node = el;
  for (let i = 0; i < 4 && node && node !== document.body; i++) {
    const t = (node.innerText || "").replace(/\s+/g, " ").trim();
    if (t && t.length <= 140) return { el: node, text: t };
    node = node.parentElement;
  }
  const t = (el.innerText || "").replace(/\s+/g, " ").trim();
  return { el, text: t.slice(0, 140) };
};

// ── Componente principal ────────────────────────────────────────────────────
const EditModeLayer = () => {
  const rol = rolSesion();
  const puedeEditar = ROLES_EDICION.indexOf(rol) !== -1;

  const { data } = window.useData() || {};
  const [activo, setActivo] = React.useState(false);
  const [panelAbierto, setPanelAbierto] = React.useState(false);
  const [pop, setPop] = React.useState(null); // {rect, text, matches, sel, val, partial, copied}
  const [ovTick, setOvTick] = React.useState(0);
  const dataRef = React.useRef(data);
  dataRef.current = data;

  React.useEffect(() => window.YDR_OVERRIDES.subscribe(() => setOvTick((t) => t + 1)), []);

  // Clase global para el outline de hover
  React.useEffect(() => {
    document.documentElement.classList.toggle("ydr-edit-mode", activo);
    if (!activo) setPop(null);
    return () => document.documentElement.classList.remove("ydr-edit-mode");
  }, [activo]);

  // Interceptor de clics (capture) en modo edición
  React.useEffect(() => {
    if (!activo) return;
    const onClick = (e) => {
      if (e.target.closest(".em-pop, .em-panel, .em-fab, .twk-root, .tweaks-panel")) return;
      e.preventDefault();
      e.stopPropagation();
      const { el, text } = textoClic(e.target);
      if (!text) { setPop(null); return; }
      const matches = findAnchors(dataRef.current, text, false);
      const rect = el.getBoundingClientRect();
      setPop({
        rect: { top: rect.bottom, left: Math.min(rect.left, window.innerWidth - 340) },
        text, matches, sel: matches.length === 1 ? 0 : -1,
        val: matches.length === 1 ? String(matches[0].value) : text,
        partial: false,
      });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [activo]);

  // Marca sutil en pantalla de los valores ya editados
  React.useEffect(() => {
    if (!puedeEditar) return;
    const t = setTimeout(() => {
      document.querySelectorAll(".em-edited").forEach((n) => n.classList.remove("em-edited"));
      const list = window.YDR_OVERRIDES.list();
      if (!list.length) return;
      const vals = list.map((o) => norm(o.val));
      document.querySelectorAll("#root span, #root p, #root h1, #root h2, #root h3, #root h4, #root td, #root em, #root strong, #root li, #root dd").forEach((n) => {
        if (n.children.length) return;
        if (vals.indexOf(norm(n.textContent || "")) !== -1) n.classList.add("em-edited");
      });
    }, 120);
    return () => clearTimeout(t);
  }, [puedeEditar, data, ovTick, activo]);

  // Fecha de arranque del cronograma (ajuste local, sin Sheet)
  const [ancla, setAncla] = React.useState(() => window.YDR_ANCLA_CRONO.get());
  const guardarAncla = (v) => { setAncla(v); window.YDR_ANCLA_CRONO.set(v); };

  if (!puedeEditar) return null;

  const overrides = window.YDR_OVERRIDES.list();

  const buscarParcial = () => {
    const matches = findAnchors(dataRef.current, pop.text, true);
    setPop({ ...pop, matches, sel: matches.length === 1 ? 0 : -1, partial: true,
      val: matches.length === 1 ? String(matches[0].value) : pop.val });
  };

  const guardar = () => {
    const m = pop.matches[pop.sel];
    if (!m) return;
    window.YDR_OVERRIDES.add({ path: m.path, old: String(m.value), val: pop.val });
    setPop(null);
  };

  const copiarCambios = () => {
    const json = JSON.stringify(window.YDR_OVERRIDES.list(), null, 2);
    const done = () => { setPop(null); setPanelAbierto(true); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(json).then(done, done);
    else done();
  };

  return (
    <React.Fragment>
      {/* Botón flotante ✎ Editar (junto al badge CACHÉ LOCAL) */}
      <div className="em-fab">
        {overrides.length > 0 && (
          <button className="em-fab-btn em-fab-count mono" onClick={() => setPanelAbierto(!panelAbierto)}
            title="Cambios pendientes de aplicar al Sheet">
            <span className="em-dot" /> {overrides.length} pendiente{overrides.length !== 1 ? "s" : ""}
          </button>
        )}
        <button className={"em-fab-btn mono" + (activo ? " em-on" : "")} onClick={() => setActivo(!activo)}
          title="Modo edición: clic en cualquier dato para ver su ancla y editarlo">
          ✎ {activo ? "Editando…" : "Editar"}
        </button>
      </div>

      {/* Popover de ancla + edición */}
      {activo && pop && (
        <div className="em-pop" style={{ top: pop.rect.top + 8, left: Math.max(12, pop.rect.left) }}>
          <div className="em-pop-head mono">DATO SELECCIONADO</div>
          <div className="em-pop-value">{pop.text}</div>

          {pop.matches.length === 0 ? (
            <React.Fragment>
              <div className="em-pop-none">
                No encontré este texto tal cual en la data del Sheet — puede ser un
                valor compuesto o con formato (p. ej. dinero formateado en pantalla).
              </div>
              {!pop.partial ? (
                <button className="em-btn" onClick={buscarParcial}>Buscar coincidencia parcial</button>
              ) : (
                <div className="em-pop-none">Tampoco hubo coincidencia parcial. Ese dato se calcula o formatea en el board; edítalo desde su campo fuente.</div>
              )}
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="em-pop-head mono">{pop.matches.length === 1 ? "ANCLA EN EL SHEET" : "VARIAS ANCLAS — ELIGE UNA"}</div>
              {pop.matches.map((m, i) => (
                <button key={m.path}
                  className={"em-anchor mono" + (pop.sel === i ? " em-anchor-sel" : "")}
                  onClick={() => setPop({ ...pop, sel: i, val: String(m.value) })}>
                  {anclaLegible(m.path)}
                </button>
              ))}
              {pop.sel >= 0 && (
                <React.Fragment>
                  <input className="em-input" value={pop.val} autoFocus
                    onChange={(e) => setPop({ ...pop, val: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") guardar(); if (e.key === "Escape") setPop(null); }} />
                  <div className="em-pop-actions">
                    <button className="em-btn em-btn-gold" onClick={guardar}>Guardar</button>
                    <button className="em-btn" onClick={() => setPop(null)}>Cancelar</button>
                  </div>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </div>
      )}

      {/* Panel de cambios pendientes */}
      {panelAbierto && (
        <div className="em-panel">
          <div className="em-panel-head">
            <span className="em-panel-title">Cambios pendientes</span>
            <button className="em-btn" onClick={() => setPanelAbierto(false)}>✕</button>
          </div>
          <div className="em-panel-note mono">Pendiente de aplicar al Sheet — v2 lo hará automático.</div>

          <div className="em-ancla">
            <label className="em-ancla-lbl" htmlFor="emAncla">Arranque del cronograma</label>
            <input id="emAncla" className="em-ancla-input" type="date" value={ancla}
              onChange={(e) => guardarAncla(e.target.value)} />
            <p className="em-ancla-help">
              Con esto el eje de tiempo y la línea de HOY se calculan solos y dejan de
              envejecer. Se guarda en este dispositivo; cuando el Sheet vuelva, lo que
              diga el Sheet manda.
              {ancla && <button className="em-ancla-clear" onClick={() => guardarAncla("")}>Quitar</button>}
            </p>
          </div>
          {overrides.length === 0 ? (
            <div className="em-pop-none">Sin cambios pendientes.</div>
          ) : (
            <React.Fragment>
              <div className="em-panel-list">
                {overrides.map((o) => (
                  <div key={o.path} className="em-item">
                    <div className="em-item-anchor mono">{anclaLegible(o.path)}</div>
                    <div className="em-item-diff">
                      <span className="em-old">{String(o.old)}</span>
                      <span className="em-arrow">→</span>
                      <span className="em-new">{String(o.val)}</span>
                    </div>
                    <div className="em-item-foot">
                      <span className="em-item-ts mono">{fechaCorta(o.ts)}</span>
                      <button className="em-btn em-btn-sm" onClick={() => window.YDR_OVERRIDES.remove(o.path)}>Quitar</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="em-pop-actions">
                <button className="em-btn em-btn-gold" onClick={copiarCambios}>Copiar cambios</button>
                <button className="em-btn" onClick={() => window.YDR_OVERRIDES.clear()}>Restaurar todo</button>
              </div>
            </React.Fragment>
          )}
        </div>
      )}
    </React.Fragment>
  );
};

window.EditModeLayer = EditModeLayer;

})();
