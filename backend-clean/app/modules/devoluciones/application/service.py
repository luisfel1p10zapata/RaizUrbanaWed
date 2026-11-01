
from app.modules.devoluciones.infrastructure.repository import (
    DevolucionRepository,
)


class DevolucionService:

    def __init__(self):
        self.repositorio = DevolucionRepository()

    # --------------------------------------------------
    # REGISTRAR DEVOLUCIÓN
    # --------------------------------------------------

    def registrar(
        self,
        id_det_venta: int,
        cantidad: int,
        observaciones: str | None,
        fecha_devolucion,
        id_motivo: int,
    ):
        if id_det_venta <= 0:
            raise ValueError("El detalle de venta no es válido.")

        if cantidad <= 0:
            raise ValueError(
                "La cantidad devuelta debe ser mayor que cero."
            )

        if id_motivo <= 0:
            raise ValueError("Debes seleccionar un motivo válido.")

        if fecha_devolucion is None:
            raise ValueError("La fecha de devolución es obligatoria.")

        observaciones = (
            observaciones.strip()
            if observaciones
            else None
        )

        return self.repositorio.registrar(
            id_det_venta=id_det_venta,
            cantidad=cantidad,
            observaciones=observaciones,
            fecha_devolucion=fecha_devolucion,
            id_motivo=id_motivo,
        )

    # --------------------------------------------------
    # LISTAR DEVOLUCIONES
    # --------------------------------------------------

    def listar(self):
        return self.repositorio.listar()

    # --------------------------------------------------
    # BUSCAR DEVOLUCIONES
    # --------------------------------------------------

    def buscar(self, filtro: str):
        return self.repositorio.buscar(filtro.strip())

    # --------------------------------------------------
    # CONSULTAR DEVOLUCIÓN
    # --------------------------------------------------

    def obtener_por_id(self, id_devoluciones: int):
        if id_devoluciones <= 0:
            raise ValueError("El ID de devolución no es válido.")

        return self.repositorio.obtener_por_id(id_devoluciones)

    # --------------------------------------------------
    # ACTUALIZAR DEVOLUCIÓN
    # --------------------------------------------------

    def actualizar(
        self,
        id_devoluciones: int,
        cantidad: int,
        observaciones: str | None,
        fecha_devolucion,
        id_motivo: int,
    ):
        if id_devoluciones <= 0:
            raise ValueError("El ID de devolución no es válido.")

        if cantidad <= 0:
            raise ValueError(
                "La cantidad devuelta debe ser mayor que cero."
            )

        if id_motivo <= 0:
            raise ValueError("Debes seleccionar un motivo válido.")

        if fecha_devolucion is None:
            raise ValueError("La fecha de devolución es obligatoria.")

        observaciones = (
            observaciones.strip()
            if observaciones
            else None
        )

        return self.repositorio.actualizar(
            id_devoluciones=id_devoluciones,
            cantidad=cantidad,
            observaciones=observaciones,
            fecha_devolucion=fecha_devolucion,
            id_motivo=id_motivo,
        )

    # --------------------------------------------------
    # ANULAR DEVOLUCIÓN
    # --------------------------------------------------

    def anular(
        self,
        id_devoluciones: int,
        observacion_anulacion: str | None = None,
    ):
        if id_devoluciones <= 0:
            raise ValueError("El ID de devolución no es válido.")

        observacion_anulacion = (
            observacion_anulacion.strip()
            if observacion_anulacion
            else None
        )

        return self.repositorio.anular(
            id_devoluciones=id_devoluciones,
            observacion_anulacion=observacion_anulacion,
        )

    # --------------------------------------------------
    # FILTRAR DEVOLUCIONES
    # --------------------------------------------------

    def filtrar(
        self,
        fecha_inicio=None,
        fecha_fin=None,
        id_motivo: int | None = None,
    ):
        if (
            fecha_inicio is not None
            and fecha_fin is not None
            and fecha_inicio > fecha_fin
        ):
            raise ValueError(
                "La fecha inicial no puede ser posterior a la fecha final."
            )

        if id_motivo is not None and id_motivo <= 0:
            raise ValueError("El motivo seleccionado no es válido.")

        return self.repositorio.filtrar(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            id_motivo=id_motivo,
        )

    # --------------------------------------------------
    # LISTAR DETALLES DISPONIBLES
    # --------------------------------------------------

    def listar_detalles_disponibles(self):
        return self.repositorio.listar_detalles_disponibles()

    # --------------------------------------------------
    # LISTAR MOTIVOS
    # --------------------------------------------------

    def listar_motivos(self):
        return self.repositorio.listar_motivos()

    # --------------------------------------------------
    # REGISTRAR MOTIVO
    # --------------------------------------------------

    def registrar_motivo(self, nombre: str):
        nombre = nombre.strip()

        if not nombre:
            raise ValueError("El nombre del motivo es obligatorio.")

        if len(nombre) > 100:
            raise ValueError(
                "El nombre del motivo no puede superar los 100 caracteres."
            )

        return self.repositorio.registrar_motivo(nombre)

    # --------------------------------------------------
    # ACTUALIZAR MOTIVO
    # --------------------------------------------------

    def actualizar_motivo(
        self,
        id_motivo: int,
        nombre: str,
    ):
        nombre = nombre.strip()

        if id_motivo <= 0:
            raise ValueError("El ID del motivo no es válido.")

        if not nombre:
            raise ValueError("El nombre del motivo es obligatorio.")

        if len(nombre) > 100:
            raise ValueError(
                "El nombre del motivo no puede superar los 100 caracteres."
            )

        return self.repositorio.actualizar_motivo(
            id_motivo=id_motivo,
            nombre=nombre,
        )
