import { Link } from 'react-router-dom';

import useTheme from '../../../components/hooks/useTheme';
import './terminoscondiciones.css';
export default function TerminosCondiciones() {
    const { theme } = useTheme();

    return (
        <main
            className="ru-terms"
            data-theme={theme === 'dark' ? 'dark' : 'light'}
        >
            <div className="ru-terms__container">
                <Link
                    to="/cuenta/registro"
                    className="ru-terms__back"
                >
                    ← Volver al registro
                </Link>

                <article className="ru-terms__card">
                    <header>
                        <span className="ru-terms__eyebrow">
                            RAÍZ URBANA
                        </span>

                        <h1>Términos y condiciones</h1>

                        <p className="ru-terms__intro">
                            Consulta las condiciones de uso de la
                            plataforma antes de crear tu cuenta.
                        </p>
                    </header>

                    <section>
                        <h2>1. Uso de la plataforma</h2>

                        <p>
                            Raíz Urbana permite consultar productos,
                            crear una cuenta y utilizar las funciones
                            disponibles de la plataforma. El usuario se
                            compromete a utilizarla de manera responsable.
                        </p>
                    </section>

                    <section>
                        <h2>2. Registro y cuenta</h2>

                        <p>
                            La persona debe proporcionar información
                            correcta y mantenerla actualizada. Es
                            responsable de conservar la confidencialidad
                            de su contraseña y de comunicar cualquier uso
                            no autorizado de su cuenta.
                        </p>
                    </section>

                    <section>
                        <h2>3. Productos y compras</h2>

                        <p>
                            La información, disponibilidad, precios y
                            condiciones de compra se mostrarán en la
                            plataforma. Antes de completar una compra, el
                            usuario podrá revisar la información
                            correspondiente.
                        </p>
                    </section>

                    <section>
                        <h2>4. Datos personales</h2>

                        <p>
                            La información suministrada se utilizará para
                            administrar la cuenta, atender solicitudes y
                            desarrollar las operaciones relacionadas con
                            los servicios de la plataforma.
                        </p>

                        <p>
                            La política de tratamiento de datos deberá
                            informar los usos de la información, los
                            derechos de los titulares y los canales de
                            atención correspondientes.
                        </p>
                    </section>

                    <section>
                        <h2>5. Modificaciones</h2>

                        <p>
                            Los términos podrán actualizarse. La versión
                            vigente estará disponible para consulta en
                            la plataforma.
                        </p>
                    </section>

                    <section>
                        <h2>6. Contacto</h2>

                        <p>
                            Para consultas sobre la cuenta y el uso de la
                            plataforma, el usuario podrá comunicarse por
                            el canal de contacto que defina Raíz Urbana.
                        </p>
                    </section>
                </article>
            </div>
        </main>
    );
}