import './Inicio.css';
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import useTheme from '../../components/hook/useTheme';

const categories = [
  {
    title: 'Ropa',
    image: '/images/ropa.jpg',
  },
  {
    title: 'Tenis',
    image: '/images/tenis.jpg',
  },
  {
    title: 'Bolsos',
    image: '/images/bolsos.jpg',
  },
  {
    title: 'Accesorios',
    image: '/images/accesorios.jpg',
  },
];

const features = [
  {
    title: 'DISEÑOS ÚNICOS',
    description: 'Piezas exclusivas que no encontrarás en otro lado',
    icon: '◇',
  },
  {
    title: 'ESTILOS VARIADOS',
    description: 'Para cada personalidad y cada ocasión',
    icon: '✦',
  },
  {
    title: 'MODA URBANA',
    description: 'Colecciones inspiradas en el street style global',
    icon: '⬡',
  },
  {
    title: 'PARA TODOS',
    description: 'Hombre, mujer y accesorios en un solo lugar',
    icon: '○',
  },
];

const Inicio = () => {
  const { theme } = useTheme();

  return (
    <main className="inicio-page">

      {/* HERO */}
      <section className="inicio-hero">

        <div className="inicio-hero-overlay" />

        <div className="inicio-hero-content">

          <div className="inicio-hero-eyebrow">
            <span />
            NUEVA COLECCIÓN
          </div>

          <h1>
            Viste tu
            <br />
            <span>identidad.</span>
          </h1>

          <p className="inicio-hero-description">
            Ropa, tenis, bolsos y accesorios diseñados para quienes
            <br />
            saben lo que quieren. Moda urbana con carácter propio.
          </p>

          <div className="inicio-hero-buttons">

            <button className="inicio-btn inicio-btn-primary">
              <ShoppingBag size={17} />
              VER COLECCIÓN
              <ArrowRight size={17} />
            </button>

            <button className="inicio-btn inicio-btn-outline">
              MI CARRITO
            </button>

          </div>

          <div className="inicio-hero-styles">

            <div className="inicio-hero-avatars">
              <div className="inicio-avatar inicio-avatar-1" />
              <div className="inicio-avatar inicio-avatar-2" />
              <div className="inicio-avatar inicio-avatar-3" />
            </div>

            <div>
              <strong>ESTILOS PARA TODOS</strong>
              <span>Hombre · Mujer · Accesorios</span>
            </div>

          </div>

          <div className="inicio-hero-scroll">
            <div />
            <span>SCROLL</span>
          </div>

        </div>

        <div className="inicio-hero-bottom">

          <span>NUEVA TEMPORADA DISPONIBLE</span>
          <b>✦</b>

          <span>ROPA · TENIS · BOLSOS · ACCESORIOS</span>
          <b>✦</b>

          <span>ENCUENTRA TU ESTILO ÚNICO</span>
          <b>✦</b>

          <span>COLECCIONES EXCLUSIVAS</span>

        </div>

      </section>


      {/* CATEGORÍAS */}
      <section className="inicio-categories">

        <div className="inicio-section-heading">

          <div>
            <span className="inicio-section-label">
              LO QUE ENCONTRARÁS
            </span>

            <h2>Nuestras categorías</h2>
          </div>

          <button className="inicio-view-all">
            Ver todo
            <ArrowRight size={18} />
          </button>

        </div>


        <div className="inicio-category-grid">

          {categories.map((category) => (

            <article
              className="inicio-category-card"
              key={category.title}
              style={{
                backgroundImage: `url(${category.image})`,
              }}
            >

              <div className="inicio-category-overlay" />

              <span className="inicio-category-badge">
                COLECCIÓN
              </span>

              <h3>{category.title}</h3>

            </article>

          ))}

        </div>

      </section>


      {/* EDITORIAL */}
      <section className="inicio-editorial">

        <div className="inicio-editorial-background" />
        <div className="inicio-editorial-overlay" />

        <div className="inicio-editorial-content">

          <div className="inicio-editorial-copy">

            <div className="inicio-editorial-eyebrow">
              <Sparkles size={15} />
              RAÍZ URBANA
            </div>

            <h2>
              Moda que
              <br />
              <span>define épocas.</span>
            </h2>

            <p>
              Cada prenda, cada accesorio y cada par de tenis
              en nuestra colección está pensado para construir
              un estilo auténtico. Sin tendencias pasajeras.
            </p>

            <button className="inicio-btn inicio-btn-primary">
              VER COLECCIÓN COMPLETA
              <ArrowRight size={18} />
            </button>

          </div>


          <div className="inicio-features">

            {features.map((feature) => (

              <div
                className="inicio-feature-card"
                key={feature.title}
              >

                <div className="inicio-feature-icon">
                  {feature.icon}
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>

              </div>

            ))}

          </div>

        </div>

      </section>


      {/* FOOTER */}
      <footer className="inicio-footer">

        <div className="inicio-footer-main">

          <div className="inicio-footer-brand">

            <div className="inicio-logo">
              <img
                src={theme === 'dark' ? '/images/logoDark.png' : '/images/logo-ru.png'}
                alt="Raíz Urbana"
              />
            </div>

            <p>
              Moda contemporánea que refleja tu
              <br />
              esencia y estilo personal.
            </p>

          </div>


          <div className="inicio-footer-column">

            <h3>NAVEGACIÓN</h3>

            <a href="/">Inicio</a>
            <a href="/productos">Productos</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/design-system">Design System</a>
            <a href="/navegacion">Navegación</a>

          </div>


          <div className="inicio-footer-column inicio-footer-contact">

            <h3>CONTACTO</h3>

            <div>
              <MapPin size={17} />
              <span>Calle Principal 123, Ciudad</span>
            </div>

            <div>
              <Phone size={17} />
              <span>+123 456 7890</span>
            </div>

            <div>
              <Mail size={17} />
              <span>hola@raizurbana.com</span>
            </div>

          </div>

          <div className="inicio-social-icons">

            <h3>SÍGUENOS</h3>
            <div className="inicio-social-icons-list">

              <a href="#" aria-label="Facebook">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 8h3V4h-3c-3.3 0-5 2-5 5v3H6v4h3v8h4v-8h3l1-4h-4V9c0-.7.3-1 1-1Z"
                    fill="currentColor"
                  />
                </svg>
              </a>

              <a href="#" aria-label="Instagram">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    fill="currentColor"
                  />
                </svg>
              </a>

              <a href="#" aria-label="TikTok">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.5 3c.3 2.1 1.5 3.5 3.5 3.7v3.2c-1.5 0-2.8-.5-3.8-1.2v7.1c0 4-2.7 6.2-6.1 6.2-3 0-5.6-2.2-5.6-5.4 0-3.4 2.8-5.6 6-5.6.4 0 .8 0 1.2.1v3.2c-.4-.1-.8-.2-1.2-.2-1.2 0-2.5.8-2.5 2.3 0 1.4 1.1 2.2 2.2 2.2 1.4 0 2.6-.8 2.6-2.8V3h3.7Z"
                    fill="currentColor"
                  />
                </svg>
              </a>

              <a href="#" aria-label="WhatsApp">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.5 3.5A11.8 11.8 0 0 0 12.1 0C5.6 0 .3 5.3.3 11.8c0 2.1.5 4.1 1.6 5.9L.2 24l6.5-1.7a11.8 11.8 0 0 0 5.4 1.3h.1c6.5 0 11.8-5.3 11.8-11.8 0-3.1-1.2-6.1-3.5-8.3ZM12.1 21.5c-1.7 0-3.3-.5-4.7-1.3l-.3-.2-3.9 1 1-3.8-.2-.3a9.7 9.7 0 1 1 8.1 4.6Zm5.3-7.3c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.2-.4-2.3-1.4-.9-.8-1.5-1.7-1.7-2-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.5 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.1 3.1 1.3 3.3c.2.2 2.2 3.4 5.4 4.8.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.7-.7 2-1.3.2-.6.2-1.1.1-1.3-.1-.1-.3-.2-.6-.3Z"
                    fill="currentColor"
                  />
                </svg>
              </a>

              <a href="#" aria-label="YouTube">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.9V8.1l6.5 3.9-6.5 3.9Z"
                    fill="currentColor"
                  />
                </svg>
              </a>

              <a href="#" aria-label="LinkedIn">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.2 3.2a2.2 2.2 0 1 1-4.4 0 2.2 2.2 0 0 1 4.4 0ZM1.1 8h4.2v12.9H1.1V8Zm6.8 0h4v1.8h.1c.6-1.1 2-2.2 4.1-2.2 4.4 0 5.2 2.9 5.2 6.7v6.6h-4.2v-5.8c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1v5.9H7.9V8Z"
                    fill="currentColor"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="inicio-footer-bottom">

          <span>
            © 2026 Raíz Urbana. Todos los derechos reservados.
          </span>

          <div>
            <a href="#">Política de Privacidad</a>
            <a href="#">Términos de Uso</a>
          </div>

        </div>

      </footer>

    </main>
  );
};

export default Inicio;