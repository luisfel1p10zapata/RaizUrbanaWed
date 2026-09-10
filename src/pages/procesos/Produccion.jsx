import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  SlidersHorizontal,
  CircleCheck,
  Clock3,
  Package,
} from 'lucide-react';

import './Produccion.css';

const PRODUCCIONES = [
  {
    id: 1,
    code: 'DV-000',
    product: 'Producto Artesanal',
    responsible: 'Juan Pérez',
    assigned: 'Laura Martínez',
    date: '2026-05-28',
    status: 'Terminado',
  },
  {
    id: 2,
    code: 'DV-001',
    product: 'Collar Artesanal Az...',
    responsible: 'Andrés Gómez',
    assigned: 'Valeria Morales',
    date: '2026-06-02',
    status: 'En Producción',
  },
  {
    id: 3,
    code: 'DV-002',
    product: 'Pulsera Ajustable ...',
    responsible: 'María López',
    assigned: 'Diego Herrera',
    date: '2026-06-05',
    status: 'En Producción',
  },
  {
    id: 4,
    code: 'DV-003',
    product: 'Llavero Personaliza...',
    responsible: 'Carlos Ramírez',
    assigned: 'Camila Ríos',
    date: '2026-06-08',
    status: 'En Producción',
  },
  {
    id: 5,
    code: 'DV-004',
    product: 'Dije Plateado Estre...',
    responsible: 'Lucía Fernández',
    assigned: 'Martín Acosta',
    date: '2026-06-10',
    status: 'Terminado',
  },
  {
    id: 6,
    code: 'DV-005',
    product: 'Manilla Tejida Roja',
    responsible: 'Pablo Torres',
    assigned: 'Florencia Gómez',
    date: '2026-06-12',
    status: 'En Producción',
  },
];

const Produccion = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const filteredProducciones = useMemo(() => {
    const value = search.trim().toLowerCase();

    return PRODUCCIONES.filter((item) => {
      const matchesSearch =
        !value ||
        item.code.toLowerCase().includes(value) ||
        item.product.toLowerCase().includes(value) ||
        item.responsible.toLowerCase().includes(value) ||
        item.assigned.toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === 'Todos' ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const totalProducciones = PRODUCCIONES.length;

  const productionCount = PRODUCCIONES.filter(
    (item) => item.status === 'En Producción'
  ).length;

  const completedCount = PRODUCCIONES.filter(
    (item) => item.status === 'Terminado'
  ).length;

  return (
    <section className="produccion-page">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="produccion-header">

        <div className="produccion-header-info">

          <span className="produccion-eyebrow">
            MÓDULO
          </span>

          <h1 className="produccion-title">
            Gestión de Producción
          </h1>

          <p className="produccion-description">
            Administra las órdenes y procesos de producción
          </p>

        </div>

        <button
          type="button"
          className="produccion-register-button"
        >
          <Plus size={14} strokeWidth={2} />
          <span>REGISTRAR PRODUCCIÓN</span>
        </button>

      </header>


      {/* =====================================================
          ESTADÍSTICAS
      ====================================================== */}

      <div className="produccion-stats">

        <article className="produccion-stat-card">

          <div className="produccion-stat-icon">
            <Package
              size={18}
              strokeWidth={1.7}
            />
          </div>

          <div className="produccion-stat-info">

            <span className="produccion-stat-label">
              Total producciones
            </span>

            <strong className="produccion-stat-value">
              {totalProducciones}
            </strong>

            <span className="produccion-stat-description">
              registradas
            </span>

          </div>

        </article>


        <article className="produccion-stat-card">

          <div className="produccion-stat-icon">
            <Clock3
              size={18}
              strokeWidth={1.7}
            />
          </div>

          <div className="produccion-stat-info">

            <span className="produccion-stat-label">
              En producción
            </span>

            <strong className="produccion-stat-value">
              {productionCount}
            </strong>

            <span className="produccion-stat-description">
              en proceso
            </span>

          </div>

        </article>


        <article className="produccion-stat-card">

          <div className="produccion-stat-icon">
            <CircleCheck
              size={18}
              strokeWidth={1.7}
            />
          </div>

          <div className="produccion-stat-info">

            <span className="produccion-stat-label">
              Terminadas
            </span>

            <strong className="produccion-stat-value">
              {completedCount}
            </strong>

            <span className="produccion-stat-description">
              completadas
            </span>

          </div>

        </article>

      </div>


      {/* =====================================================
          FILTROS
      ====================================================== */}

      <section className="produccion-filters-card">

        <div className="produccion-filter-header">

          <SlidersHorizontal
            size={12}
            strokeWidth={1.8}
          />

          <span>
            Buscar producción
          </span>

        </div>

        <div className="produccion-filters">

          <div className="produccion-search">

            <Search
              className="produccion-search-icon"
              size={15}
              strokeWidth={1.6}
            />

            <input
              type="text"
              className="produccion-search-input"
              placeholder="Buscar por código, producto o responsable..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          <select
            className="produccion-filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="Todos">
              Todos los estados
            </option>

            <option value="En Producción">
              En Producción
            </option>

            <option value="Terminado">
              Terminado
            </option>
          </select>

        </div>

      </section>


      {/* =====================================================
          TABLA
      ====================================================== */}

      <section className="produccion-table-card">

        <div className="produccion-table-header">

          <div className="produccion-table-title">

            <span>
              Listado de Producción
            </span>

            <span className="produccion-table-count">
              {totalProducciones}
            </span>

          </div>

          <span className="produccion-table-page">
            Página 1 de 1
          </span>

        </div>


        <div className="produccion-table-wrapper">

          <table className="produccion-table">

            <thead>

              <tr>
                <th>ID</th>
                <th>CÓDIGO</th>
                <th>PRODUCTO</th>
                <th>RESPONSABLE</th>
                <th>ENCARGADO</th>
                <th>FECHA</th>
                <th>ESTADO</th>
                <th></th>
              </tr>

            </thead>

            <tbody>

              {filteredProducciones.length > 0 ? (

                filteredProducciones.map((item) => (

                  <tr key={item.id}>

                    {/* ID */}

                    <td className="produccion-id">
                      <span>
                        #{item.id}
                      </span>
                    </td>


                    {/* CÓDIGO */}

                    <td>

                      <span className="produccion-code">
                        {item.code}
                      </span>

                    </td>


                    {/* PRODUCTO */}

                    <td className="produccion-product">
                      {item.product}
                    </td>


                    {/* RESPONSABLE */}

                    <td className="produccion-responsible">
                      {item.responsible}
                    </td>


                    {/* ENCARGADO */}

                    <td>

                      <div className="produccion-assigned">

                        <div className="produccion-assigned-icon">
                          <Users
                            size={14}
                            strokeWidth={1.7}
                          />
                        </div>

                        <span>
                          {item.assigned}
                        </span>

                      </div>

                    </td>


                    {/* FECHA */}

                    <td className="produccion-date">
                      {item.date}
                    </td>


                    {/* ESTADO */}

                    <td>

                      <span
                        className={`produccion-status ${
                          item.status === 'Terminado'
                            ? 'completed'
                            : ''
                        }`}
                      >

                        {item.status === 'Terminado' ? (
                          <CircleCheck
                            size={12}
                            strokeWidth={1.8}
                          />
                        ) : (
                          <Clock3
                            size={12}
                            strokeWidth={1.8}
                          />
                        )}

                        <span>
                          {item.status}
                        </span>

                      </span>

                    </td>


                    {/* ACCIONES */}

                    <td>

                      <div className="produccion-actions">

                        <button
                          type="button"
                          className="produccion-action-button produccion-action-view"
                          title={`Ver ${item.code}`}
                          aria-label={`Ver ${item.code}`}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          type="button"
                          className="produccion-action-button produccion-action-edit"
                          title={`Editar ${item.code}`}
                          aria-label={`Editar ${item.code}`}
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="produccion-action-button produccion-action-delete"
                          title={`Eliminar ${item.code}`}
                          aria-label={`Eliminar ${item.code}`}
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="produccion-empty"
                  >
                    No se encontraron registros
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =====================================================
            PAGINACIÓN
        ====================================================== */}

        <footer className="produccion-pagination">

          <span className="produccion-pagination-info">
            Mostrando 1–{filteredProducciones.length} de{' '}
            {totalProducciones} registros
          </span>


          <div className="produccion-pagination-controls">

            <button
              type="button"
              className="produccion-pagination-button"
              disabled
              aria-label="Primera página"
            >
              «
            </button>

            <button
              type="button"
              className="produccion-pagination-button"
              disabled
              aria-label="Página anterior"
            >
              <ChevronLeft size={13} />
            </button>

            <button
              type="button"
              className="produccion-pagination-button active"
            >
              1
            </button>

            <button
              type="button"
              className="produccion-pagination-button"
              disabled
              aria-label="Página siguiente"
            >
              <ChevronRight size={13} />
            </button>

            <button
              type="button"
              className="produccion-pagination-button"
              disabled
              aria-label="Última página"
            >
              »
            </button>

          </div>

        </footer>

      </section>

    </section>
  );
};

export default Produccion;