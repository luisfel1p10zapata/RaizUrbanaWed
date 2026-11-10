import { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, XCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import '../Styles/ModalVerRoles.css';

export default function ModalVerRoles({
  isOpen,
  onClose,
  selectedRole,
  permisos = [],
}) {
  const [expandedPerm, setExpandedPerm] = useState(null);

  if (!isOpen || !selectedRole) return null;

  const rolePrivIds = Array.isArray(selectedRole.privilegios_ids)
    ? selectedRole.privilegios_ids.map(Number)
    : [];

  const totalUsuarios = Number(selectedRole.total_usuarios ?? 0);

  const toggleExpand = (idPermiso) => {
    setExpandedPerm(prev => prev === idPermiso ? null : idPermiso);
  };

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
            <div style={{ flex: 1 }}>
              <div className="roles-view-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <h3 className="roles-view-title" style={{ margin: 0 }}>
                  {selectedRole.nombre || selectedRole.name}
                </h3>
                <Badge variant={selectedRole.estado ? 'activo' : 'cancelado'}>
                  {selectedRole.estado ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="roles-view-description" style={{ margin: '6px 0 10px 0', color: '#64748b', fontSize: '13px' }}>
                {selectedRole.descripcion || selectedRole.description || 'Sin descripción'}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', color: '#475569' }}>
                <Users size={14} />
                <span><strong>{totalUsuarios}</strong> {totalUsuarios === 1 ? 'usuario asignado' : 'usuarios asignados'}</span>
              </div>
            </div>
          </div>

          <div className="roles-view-perms-section">
            <span className="ru-form-label roles-view-perms-label">
              PERMISOS ASIGNADOS
            </span>
            <div className="roles-view-perms-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {permisos.map((permiso) => {
                const nombrePermiso = permiso.permiso || permiso.nombre || `Permiso #${permiso.id_permiso}`;
                const privs = permiso.privilegios ?? [];
                const idsPrivilegios = privs.map((pr) => Number(pr.id_privilegio));
                const asignados = idsPrivilegios.filter((id) => rolePrivIds.includes(id)).length;
                const tienePermisoCompleto = idsPrivilegios.length > 0 && asignados === idsPrivilegios.length;
                const tienePermisoParcial = asignados > 0 && !tienePermisoCompleto;
                const isExpanded = expandedPerm === permiso.id_permiso;

                return (
                  <div
                    key={permiso.id_permiso}
                    className={`roles-view-perm-item ${tienePermisoCompleto ? 'active' : ''}`}
                    style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', background: '#ffffff' }}
                  >
                    <div
                      className="roles-view-perm-item-left"
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => toggleExpand(permiso.id_permiso)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {tienePermisoCompleto ? (
                          <CheckCircle2 size={16} color="#16A34A" />
                        ) : tienePermisoParcial ? (
                          <CheckCircle2 size={16} color="#EAB308" />
                        ) : (
                          <XCircle size={16} color="#94A3B8" />
                        )}
                        <span className="roles-view-perm-name" style={{ fontWeight: 500, fontSize: '13px' }}>{nombrePermiso}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="roles-view-perm-count" style={{ fontSize: '12px', color: '#64748b' }}>
                          {asignados} de {idsPrivilegios.length} privilegios
                        </span>
                        {isExpanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                      </div>
                    </div>

                    {isExpanded && privs.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '6px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        {privs.map((priv) => {
                          const pId = Number(priv.id_privilegio);
                          const asignado = rolePrivIds.includes(pId);
                          return (
                            <div key={pId} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: asignado ? '#1e293b' : '#94a3b8' }}>
                              {asignado ? (
                                <CheckCircle2 size={12} color="#16a34a" />
                              ) : (
                                <XCircle size={12} color="#cbd5e1" />
                              )}
                              <span>{priv.nombre}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
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
