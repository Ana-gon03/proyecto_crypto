import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import NavbarInicio from "../../components/common/NavbarInicio";
import FooterInicio from "../../components/common/FooterInicio";
import "../../styles/HomePage.css";

/* ═══════════════════════
   DATOS
═══════════════════════ */
const FEATURES = [
  {
    icon: "🏷️",
    title: "Filtra por lo que de verdad necesitas",
    desc: "Precio máximo, habitaciones, servicios incluidos, tipo de inmueble... tú decides qué es innegociable antes de ver una sola propiedad.",
    wide: true,
  },
  {
    icon: "🛡️",
    title: "Solo personas reales",
    desc: "Nadie entra sin verificar. Arrendadores con CURP y estudiantes con constancia IPN vigente.",
  },
  {
    icon: "💬",
    title: "Opiniones que importan",
    desc: "Calificaciones de quienes ya vivieron ahí. Sin anuncios falsos ni fotos de catálogo.",
  },
  {
    icon: "🗺️",
    title: "Explora por zonas y colonias cerca de la UPALM",
    desc: "Navega por código postal, identifica colonias verificadas y encuentra propiedades bien ubicadas sin gastar tiempo en traslados.",
    wide: true,
  },
  {
    icon: "📋",
    title: "Contrato sin sorpresas",
    desc: "Revisa los elementos esenciales de un contrato de arrendamiento antes de firmar cualquier cosa.",
  },
  {
    icon: "🤝",
    title: "Hecha por y para la comunidad IPN",
    desc: "No somos una inmobiliaria. Somos una herramienta creada por estudiantes, para estudiantes foráneos de la UPALM que merecen vivir cerca de su campus.",
    wide: true,
    dark: true,
  },
];

const HOW_STEPS = [
  {
    num: "01",
    title: "Regístrate en minutos",
    desc: "Crea tu cuenta, sube tu documento de verificación y tu perfil queda listo. Sin formularios eternos ni burocracia.",
  },
  {
    num: "02",
    title: "Descubre tu zona",
    desc: "Explora propiedades en la zona UPALM, compara precios y lee lo que otros estudiantes opinan de cada lugar.",
  },
  {
    num: "03",
    title: "Cierra el trato seguro",
    desc: "Contacta al arrendador directamente, consulta la plantilla de contrato y arrienda con toda la información sobre la mesa.",
  },
];

const ARRENDADOR_CHECKS = [
  "Verifica tu identidad una sola vez",
  "Publica sin límite de propiedades",
  "Construye confianza con reseñas reales",
];

const ARRENDATARIO_CHECKS = [
  "Accede con tu constancia IPN vigente",
  "Compara precios y servicios al instante",
  "Lee opiniones de otros estudiantes",
  "Plantilla de contrato incluida",
];

/* ═══════════════════════
   HOOK — fade-in por ref (llamado solo en nivel de componente)
═══════════════════════ */
function useFadeIn() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ═══════════════════════
   CHECK ICON SVG
═══════════════════════ */
function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M2 5l2.2 2.2L8 3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ═══════════════════════
   TARJETA FEATURE (componente propio para poder usar useFadeIn)
═══════════════════════ */
function FeatureCard({ feature, delay }) {
  const ref = useFadeIn();
  const isWide = feature.wide;
  const isDark = feature.dark;

  return (
    <div
      className="bento-item fade-in"
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
    >
      <div className={`bento-card${isWide ? " bento-card-wide" : ""}${isDark ? " bento-card-dark" : ""}`}>
        <div className="bento-icon">{feature.icon}</div>
        <div>
          <h3>{feature.title}</h3>
          <p>{feature.desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════
   STAT CARD (componente propio)
═══════════════════════ */
function StatCard({ icon, num, label, delay }) {
  const ref = useFadeIn();
  return (
    <div className="hero-stat-card fade-in" ref={ref} style={{ transitionDelay: `${delay}s` }}>
      <div className="hero-stat-icon">{icon}</div>
      <div>
        <div className="hero-stat-num">{num}</div>
        <div className="hero-stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════
   STEP (componente propio)
═══════════════════════ */
function StepCard({ num, title, desc, delay }) {
  const ref = useFadeIn();
  return (
    <div className="how-step fade-in" ref={ref} style={{ transitionDelay: `${delay}s` }}>
      <div className="how-step-num">{num}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

/* ═══════════════════════
   HERO
═══════════════════════ */
function Hero() {
  const leftRef = useFadeIn();
  return (
    <section className="hero">
      {/* — Panel izquierdo oscuro — */}
      <div className="hero-left">
        <div className="fade-in" ref={leftRef}>
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            La plataforma de vivienda del IPN · UPALM
          </div>

          <h1 className="hero-title">
            Para de buscar<br />
            en todos lados.<br />
            <span>Está aquí.</span>
          </h1>

          <p className="hero-subtitle">
            Blockhoom conecta a estudiantes foráneos de la{" "}
            <strong style={{ color: "rgba(255,255,255,0.95)" }}>
              UPALM
            </strong>{" "}
            con arrendadores verificados en la zona. Sin intermediarios, sin sorpresas, sin perder tiempo.
          </p>

          <div className="hero-ctas">
            <Link to="/buscar" className="btn btn-primary">
              Explorar propiedades
            </Link>
            <a href="#el-proceso" className="btn btn-white">
              Ver cómo funciona →
            </a>
          </div>

          <div className="hero-checks">
            {[
              "Sin agencias ni intermediarios",
              "Precios reales, sin cargos ocultos",
              "Comunidad IPN verificada al 100%",
            ].map((txt) => (
              <div className="hero-check" key={txt}>
                <div className="hero-check-dot"><CheckIcon /></div>
                <span>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* — Panel derecho con stat cards — */}
      <div className="hero-right">
        <StatCard icon="🏘️" num="120+"  label="Cuartos y depas en la zona UPALM"   delay={0}    />
        <StatCard icon="⭐"  num="4.8"  label="Calificación promedio de arrendadores" delay={0.12} />
        <StatCard icon="🎓" num="300+"  label="Estudiantes IPN que ya encontraron lugar" delay={0.24} />
      </div>
    </section>
  );
}

/* ═══════════════════════
   CÓMO FUNCIONA
═══════════════════════ */
function ComoFunciona() {
  const headerRef = useFadeIn();
  return (
    <section id="el-proceso" className="section how">
      <div className="how-header fade-in" ref={headerRef}>
        <span className="section-chip">El proceso</span>
        <h2 className="section-title">
          Sin rodeos, <em>así de sencillo</em>
        </h2>
        <p className="section-sub">
          Desde que te registras hasta que tienes llave en mano. Todo en un solo lugar.
        </p>
      </div>

      <div className="how-steps">
        {HOW_STEPS.map(({ num, title, desc }, i) => (
          <StepCard key={num} num={num} title={title} desc={desc} delay={i * 0.14} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════
   CARACTERÍSTICAS
═══════════════════════ */
function Caracteristicas() {
  const headerRef = useFadeIn();
  return (
    <section id="caracteristicas" className="section features">
      <div className="features-header fade-in" ref={headerRef}>
        <span className="section-chip">Lo que ofrecemos</span>
        <h2 className="section-title">
          Más que un buscador <em>de cuartos</em>
        </h2>
        <p className="section-sub">
          Cada herramienta fue pensada para que tomar la decisión correcta sea lo más fácil posible.
        </p>
      </div>

      <div className="bento">
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.title} feature={feature} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════
   PERFILES
═══════════════════════ */
function Perfiles() {
  const headerRef = useFadeIn();
  const cardARef   = useFadeIn();
  const cardERef   = useFadeIn();

  return (
    <section id="perfiles" className="section profiles">
      <div className="profiles-header fade-in" ref={headerRef}>
        <span className="section-chip">¿Quién eres?</span>
        <h2 className="section-title">
          Dos perfiles. <em>Una misma plataforma.</em>
        </h2>
      </div>

      <div className="profiles-grid">
        {/* Arrendador */}
        <div className="profile-card fade-in" ref={cardARef} style={{ transitionDelay: "0.1s" }}>
          <div className="profile-header profile-header-a">
            <div className="profile-icon-box">🏠</div>
            <div className="profile-tag">Para propietarios</div>
            <h3>Pon tu propiedad a trabajar</h3>
          </div>
          <div className="profile-body">
            <p className="profile-desc">
              Tienes un cuarto, departamento o casa cerca de la UPALM y no sabes cómo encontrar
              inquilinos confiables. Blockhoom te conecta directamente con estudiantes verificados del IPN.
            </p>
            <div className="profile-checks">
              {ARRENDADOR_CHECKS.map((c) => (
                <div className="profile-check" key={c}>
                  <div className="check-circle"><CheckIcon /></div>
                  <span>{c}</span>
                </div>
              ))}
            </div>
            <Link to="/registro" className="profile-btn">
              Registrarme como Arrendador
            </Link>
          </div>
        </div>

        {/* Estudiante */}
        <div className="profile-card fade-in" ref={cardERef} style={{ transitionDelay: "0.2s" }}>
          <div className="profile-header profile-header-e">
            <div className="profile-icon-box">🎓</div>
            <div className="profile-tag">Para estudiantes</div>
            <h3>Para de vivir lejos de tu campus</h3>
          </div>
          <div className="profile-body">
            <p className="profile-desc">
              Busca propiedades cercanas a la UPALM en segundos, sin sorteos ni listas de espera.
              Filtra lo que necesitas, lee opiniones reales y arrienda con toda la información disponible.
            </p>
            <div className="profile-checks">
              {ARRENDATARIO_CHECKS.map((c) => (
                <div className="profile-check" key={c}>
                  <div className="check-circle"><CheckIcon /></div>
                  <span>{c}</span>
                </div>
              ))}
            </div>
            <Link to="/registro" className="profile-btn">
              Registrarme como Estudiante
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════
   CTA FINAL
═══════════════════════ */
function CtaFinal() {
  const ref = useFadeIn();
  return (
    <section className="cta-section">
      <div className="fade-in" ref={ref}>
        <div className="cta-chip">Empieza gratis</div>
        <h2>
          Un registro.<br />
          <em>Cientos de opciones.</em>
        </h2>
        <p>
          Regístrate gratis, verifica tu identidad en minutos y accede a todas
          las propiedades disponibles cerca de la UPALM. Ya no tienes pretexto.
        </p>
        <div className="cta-btns">
          <Link to="/registro" className="btn btn-white">
            Crear mi cuenta ahora
          </Link>
          <Link to="/buscar" className="btn" style={{
            background: "rgba(255,255,255,0.12)",
            color: "#ffffff",
            border: "2px solid rgba(255,255,255,0.28)"
          }}>
            Explorar sin registrarme →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════
   PÁGINA PRINCIPAL
═══════════════════════ */
export default function HomePage() {
  return (
    <>
      <NavbarInicio />
      <main>
        <Hero />
        <ComoFunciona />
        <Caracteristicas />
        <Perfiles />
        <CtaFinal />
      </main>
      <FooterInicio />

      <Link to="/faq" className="faq-btn" title="Preguntas Frecuentes">
        ?
      </Link>
    </>
  );
}
