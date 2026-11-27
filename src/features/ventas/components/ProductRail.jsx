import { useEffect, useId, useLayoutEffect, useRef, useState, useCallback } from 'react';
import './ProductRail.css';

const PERSPECTIVE = 900;
const LIFT_Z = 40;
const LIFT_SCALE = 0.06;
const SWING_K = 26;
const SWING_DAMP = 2.4;
const SWING_LIMIT = 12;
const RAD = Math.PI / 180;

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
const restAngle = (i) => -9 - ((i * 5 + 3) % 7);

export default function ProductRail({
  items = [],
  eyebrow = 'COLECCIÓN DESTACADA · RAÍZ URBANA',
  autoplay = true,
  interval = 2800,
  onSelectProduct,
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const count = items.length;
  const stageRef = useRef(null);
  const slotsRef = useRef([]);
  const hangsRef = useRef([]);
  const turnsRef = useRef([]);
  const shadesRef = useRef([]);
  const tagsRef = useRef([]);

  const [stageWidth, setStageWidth] = useState(0);
  const [active, setActive] = useState(null);
  const [playing, setPlaying] = useState(autoplay);

  const sim = useRef({
    x: [],
    vx: [],
    tx: [],
    turn: [],
    vturn: [],
    tturn: [],
    swing: [],
    vswing: [],
    tag: [],
    vtag: [],
    drag: -1,
    grab: 0,
    last: 0,
    raf: 0,
  });

  const live = useRef({ active: null, count: 0, width: 0 });
  live.current = { active, count, width: stageWidth };

  const cardH = stageWidth < 640 ? 230 : 290;
  const cardW = Math.round(cardH * 0.66);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStageWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const computeTargets = useCallback(
    (width, frontIdx) => {
      if (!width || count === 0) return [];
      const pad = 36;
      const usable = Math.max(200, width - pad * 2);
      const extraFront = cardW * 0.32;
      const baseGap = clamp(
        (usable - count * cardW - (frontIdx !== null ? extraFront : 0)) / Math.max(1, count - 1),
        -cardW * 0.25,
        28
      );

      const widths = items.map((_, i) => cardW + (i === frontIdx ? extraFront : 0));
      const totalW = widths.reduce((a, b) => a + b, 0) + baseGap * Math.max(0, count - 1);
      let cursor = (width - totalW) / 2;

      return widths.map((w) => {
        const center = cursor + w / 2;
        cursor += w + baseGap;
        return center;
      });
    },
    [count, cardW, items]
  );

  const paint = useCallback(
    (i) => {
      const s = sim.current;
      const slot = slotsRef.current[i];
      if (!slot) return;

      const angle = s.turn[i] ?? restAngle(i);
      const e = clamp(1 - angle / restAngle(i), 0, 1.1);
      const theta = s.swing[i] ?? 0;

      slot.style.transform = `translate3d(${((s.x[i] ?? 0) - cardW / 2).toFixed(2)}px, 0, 0)`;

      const hang = hangsRef.current[i];
      if (hang) hang.style.transform = `rotate(${theta.toFixed(2)}deg)`;

      const turn = turnsRef.current[i];
      if (turn) {
        turn.style.transform = `perspective(${PERSPECTIVE}px) rotateY(${angle.toFixed(2)}deg) translateZ(${(
          LIFT_Z * e
        ).toFixed(2)}px) scale(${(1 + LIFT_SCALE * e).toFixed(4)})`;
      }

      const shade = shadesRef.current[i];
      if (shade) shade.style.opacity = (1 - Math.min(1, e)).toFixed(3);

      const tag = tagsRef.current[i];
      if (tag) tag.style.transform = `rotate(${(-8 + (s.tag[i] ?? 0)).toFixed(2)}deg)`;
    },
    [cardW]
  );

  const step = useCallback(
    (now) => {
      const s = sim.current;
      const n = live.current.count;
      const dt = s.last ? Math.min(0.08, (now - s.last) / 1000) : 1 / 60;
      s.last = now;

      let busy = s.drag >= 0;

      for (let i = 0; i < n; i++) {
        if (i !== s.drag) {
          const ax = -130 * ((s.x[i] ?? 0) - (s.tx[i] ?? 0)) - 19 * (s.vx[i] ?? 0);
          s.vx[i] = (s.vx[i] ?? 0) + ax * dt;
          s.x[i] = (s.x[i] ?? 0) + (s.vx[i] ?? 0) * dt;
        }

        const ta = -150 * ((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) - 19 * (s.vturn[i] ?? 0);
        s.vturn[i] = (s.vturn[i] ?? 0) + ta * dt;
        s.turn[i] = (s.turn[i] ?? 0) + (s.vturn[i] ?? 0) * dt;

        const sa = -SWING_K * (s.swing[i] ?? 0) - SWING_DAMP * (s.vswing[i] ?? 0);
        s.vswing[i] = (s.vswing[i] ?? 0) + sa * dt;
        s.swing[i] = clamp((s.swing[i] ?? 0) + (s.vswing[i] ?? 0) * dt, -SWING_LIMIT, SWING_LIMIT);

        const tagA = -46 * ((s.tag[i] ?? 0) - (s.swing[i] ?? 0) * 0.65) - 3.5 * (s.vtag[i] ?? 0);
        s.vtag[i] = (s.vtag[i] ?? 0) + tagA * dt;
        s.tag[i] = clamp((s.tag[i] ?? 0) + (s.vtag[i] ?? 0) * dt, -28, 28);

        paint(i);

        if (
          Math.abs(s.vx[i] ?? 0) > 0.4 ||
          Math.abs((s.x[i] ?? 0) - (s.tx[i] ?? 0)) > 0.3 ||
          Math.abs((s.turn[i] ?? 0) - (s.tturn[i] ?? 0)) > 0.1 ||
          Math.abs(s.swing[i] ?? 0) > 0.05 ||
          Math.abs(s.vswing[i] ?? 0) > 0.08
        ) {
          busy = true;
        }
      }

      if (busy) {
        s.raf = requestAnimationFrame(step);
      } else {
        s.raf = 0;
        s.last = 0;
      }
    },
    [paint]
  );

  const kick = useCallback(() => {
    const s = sim.current;
    if (!s.raf) {
      s.last = 0;
      s.raf = requestAnimationFrame(step);
    }
  }, [step]);

  const impulse = useCallback(
    (i, amount) => {
      const s = sim.current;
      if (i < 0 || i >= live.current.count) return;
      s.vswing[i] = (s.vswing[i] ?? 0) + amount;
      kick();
    },
    [kick]
  );

  useLayoutEffect(() => {
    if (!stageWidth || count === 0) return;
    const s = sim.current;
    const xs = computeTargets(stageWidth, active);
    const fresh = s.x.length !== count;

    for (let i = 0; i < count; i++) {
      s.tx[i] = xs[i] ?? 0;
      s.tturn[i] = i === active ? 0 : restAngle(i);
      if (fresh) {
        s.x[i] = s.tx[i];
        s.vx[i] = 0;
        s.turn[i] = s.tturn[i];
        s.vturn[i] = 0;
        s.swing[i] = 0;
        s.vswing[i] = 0;
        s.tag[i] = 0;
        s.vtag[i] = 0;
      }
    }
    if (fresh) {
      s.x.length = count;
      for (let i = 0; i < count; i++) paint(i);
    }
    kick();
  }, [stageWidth, active, count, computeTargets, paint, kick]);

  // Efecto ola inicial al cargar
  const brushed = useRef(false);
  useEffect(() => {
    if (!stageWidth || brushed.current || count === 0) return;
    brushed.current = true;
    const timers = items.map((_, i) =>
      window.setTimeout(() => impulse(i, 36 - i * 3), 100 + i * 70)
    );
    return () => timers.forEach(clearTimeout);
  }, [stageWidth, count, items, impulse]);

  // Avance automático
  useEffect(() => {
    if (!playing || count === 0 || !stageWidth) return;
    const timer = window.setInterval(() => {
      setActive((prev) => {
        const next = prev === null ? 0 : (prev + 1) % count;
        impulse(next - 1, -22);
        impulse(next + 1, 22);
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [playing, count, interval, stageWidth, impulse]);

  useEffect(() => () => cancelAnimationFrame(sim.current.raf), []);

  const current = active !== null ? items[active] : null;

  return (
    <section className="product-rail-section" aria-label="Riel de productos destacados">
      <div className="product-rail-header">
        <span className="product-rail-eyebrow">
          <i />
          {eyebrow}
        </span>
      </div>

      <div
        ref={stageRef}
        className="product-rail-stage"
        style={{ height: cardH + 74 }}
        onMouseLeave={() => {
          setActive(null);
          setPlaying(autoplay);
        }}
      >
        {/* Barra metálica superior y soportes */}
        <div className="product-rail-bar" aria-hidden="true">
          <span className="product-rail-bracket left" />
          <span className="product-rail-bracket right" />
        </div>

        {items.map((item, i) => {
          const isFront = active === i;
          return (
            <button
              key={item.id}
              ref={(el) => (slotsRef.current[i] = el)}
              type="button"
              className={`product-rail-slot ${isFront ? 'is-front' : ''}`}
              style={{
                width: cardW,
                height: cardH,
                zIndex: isFront ? 30 : 10 + i,
              }}
              onMouseEnter={() => {
                setPlaying(false);
                if (active !== i) {
                  setActive(i);
                  impulse(i, (i % 2 === 0 ? 1 : -1) * 28);
                  impulse(i - 1, -18);
                  impulse(i + 1, 18);
                }
              }}
              onClick={() => onSelectProduct?.(item)}
              aria-label={item.nombre}
            >
              <span ref={(el) => (hangsRef.current[i] = el)} className="product-rail-hang">
                {/* Gancho metálico SVG */}
                <svg
                  className="product-rail-hook"
                  width="24"
                  height="38"
                  viewBox="0 0 24 38"
                  aria-hidden="true"
                >
                  <path
                    d="M12,36 L12,12 A6,6 0 0 1 22,12 L22,17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Etiqueta de precio colgante */}
                {item.precio > 0 && (
                  <span
                    ref={(el) => (tagsRef.current[i] = el)}
                    className="product-rail-tag"
                    aria-hidden="true"
                  >
                    <i className="product-rail-tag-string" />
                    <span className="product-rail-tag-card">
                      ${Math.round(item.precio / 1000)}k
                    </span>
                  </span>
                )}

                {/* Tarjeta con giro 3D */}
                <span ref={(el) => (turnsRef.current[i] = el)} className="product-rail-card">
                  <span className="product-rail-hole" aria-hidden="true" />
                  <img src={item.imagenRender} alt={item.nombre} draggable={false} />
                  <span ref={(el) => (shadesRef.current[i] = el)} className="product-rail-shade" />
                  <span className="product-rail-badge">{item.publicoNorm}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Pie dinámico con el nombre de la prenda al frente */}
      <div className="product-rail-caption" aria-live="polite">
        {current ? (
          <>
            <strong>{current.nombre}</strong>
            <span>
              {current.tipo} · {current.publicoNorm}
            </span>
          </>
        ) : (
          <span>Desliza sobre el riel o haz clic en una prenda para ver detalles</span>
        )}
      </div>
    </section>
  );
}