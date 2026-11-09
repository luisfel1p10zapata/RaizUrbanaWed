import { X, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import '../Styles/ModalVerRoles.css';

export default function ModalVerRoles({
  isOpen,
  onClose,
  selectedRole,
  permisos = [],
}) {
  if (!isOpen || !selectedRole) return null;

  const rolePrivIds = selectedRole.privilegios_ids || [];

  return (
    <div className="ru-modal-overlay" onClick={onClose}>
      <div className="ru-modal roles-view-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ru-modal-header">
          <span className="ru-modal-eyebrow">CONSULTA DE ROL</span>
          <h2 className="ru-modal-title">Detalle del Rol #{selectedRole.id}</h2>
          <button
            type="button"
            className="ru-modal-close"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ru-modal-body roles-view-modal-body">
          <div className="roles-view-header-row">
            <div className="roles-view-icon-badge">
              <ShieldCheck size={24} />
            </div>
            <div>
              <div className="roles-view-title-row">
                <h3 className="roles-view-title">
                  {selectedRole.nombre || selectedRole.name}
                </h3>
                <Badge variant={selectedRole.estado ? 'activo' : 'cancelado'}>
                  {selectedRole.estado ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="roles-view-description">
                {selectedRole.descripcion || selectedRole.description || 'Sin descripción'}
              </p>
            </div>
          </div>

          <div className="roles-view-perms-section">
            <span className="ru-form-label roles-view-perms-label">
              PERMISOS ASIGNADOS
            </span>
            <div className="roles-view-perms-list">
              {permisos.map((permiso) => {
                const idsPrivilegios = (permiso.privilegios ?? []).map((pr) => Number(pr.id_privilegio));
                const asignados = idsPrivilegios.filter((id) => rolePrivIds.includes(id)).length;
                const tienePermiso = idsPrivilegios.length > 0 && asignados === idsPrivilegios.length;

                return (
                  <div
                    key={permiso.id_permiso}
                    className={`roles-view-perm-item ${tienePermiso ? 'active' : ''}`}
                  >
                    <div className="roles-view-perm-item-left">
                      {tienePermiso ? (
                        <CheckCircle2 size={16} color="#16A34A" />
                      ) : (
                        <XCircle size={16} color="#94A3B8" />
                      )}
                      <span className="roles-view-perm-name">{permiso.nombre}</span>
                    </div>
                    <span className="roles-view-perm-count">
                      {asignados} de {idsPrivilegios.length} privilegios
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="ru-modal-footer">
          <Button variant="outline" onClick={onClose} fullWidth>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
