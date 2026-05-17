import { Link } from "react-router-dom";

/* ════════════════════════════════
   FOOTER INICIO
════════════════════════════════ */
const FooterInicio = () => {
  return (
    <footer
      style={{
        background: "#064e3b",
        color: "rgba(255,255,255,0.6)",
        padding: "1rem 5vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
        fontSize: "0.85rem",
        textAlign: "center",
      }}
    >
      {/* Marca — enlace al panel admin */}
      <Link
        to="/admin/inicio-sesion"
        style={{
          color: "#ffffff",
          fontWeight: 700,
          fontSize: "1rem",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#6ee7b7")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
      >
        Blockhoom
      </Link>

      {/* Links legales */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { to: "/legal/aviso-privacidad", label: "Aviso de Privacidad", isLink: true },
          { label: "·", isSep: true },
          { to: "/legal/terminos-uso", label: "Términos y Condiciones", isLink: true },
          { label: "·", isSep: true },
          { href: "mailto:contacto@blockhoom.mx", label: "Contacto", isEmail: true },
        ].map((item, i) => {
          if (item.isSep) {
            return (
              <span key={i} style={{ color: "rgba(255,255,255,0.3)" }}>
                {item.label}
              </span>
            );
          }
          const linkStyle = {
            color: "rgba(255,255,255,0.6)",
            textDecoration: "none",
            transition: "color 0.2s",
          };
          return item.isEmail ? (
            <a
              key={i}
              href={item.href}
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={i}
              to={item.to}
              style={linkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Copyright */}
      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
        © 2025 Blockhoom · Todos los derechos reservados
      </div>
    </footer>
  );
};

export default FooterInicio;
