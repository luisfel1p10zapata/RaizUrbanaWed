
from datetime import date

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
        reintegra_stock: bool = True,
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

        f_dev = (
            fecha_devolucion
            if isinstance(fecha_devolucion, date)
            else date.fromisoformat(str(fecha_devolucion)[:10])
        )
        if f_dev > date.today():
            raise ValueError("La fecha no puede ser futura.")

        # Validar que no sea anterior a la venta
        detalles = self.repositorio.listar_detalles_disponibles(id_venta=None)
        det_actual = next((d for d in detalles if d["id_det_venta"] == id_det_venta), None)
        if det_actual and det_actual.get("fecha_venta"):
            f_venta = (
                det_actual["fecha_venta"]
                if isinstance(det_actual["fecha_venta"], date)
                else date.fromisoformat(str(det_actual["fecha_venta"])[:10])
            )
            if f_dev < f_venta:
                raise ValueError("La fecha no puede ser anterior a la venta.")

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
            reintegra_stock=reintegra_stock,
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
        reintegra_stock: bool | None = None,
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

        f_dev = (
            fecha_devolucion
            if isinstance(fecha_devolucion, date)
            else date.fromisoformat(str(fecha_devolucion)[:10])
        )

        if f_dev > date.today():
            raise ValueError("La fecha no puede ser futura.")

        actual = self.obtener_por_id(id_devoluciones)
        if actual and actual.get("fecha_venta"):
            f_venta = (
                actual["fecha_venta"]
                if isinstance(actual["fecha_venta"], date)
                else date.fromisoformat(str(actual["fecha_venta"])[:10])
            )
            if f_dev < f_venta:
                raise ValueError("La fecha no puede ser anterior a la venta.")

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
            reintegra_stock=reintegra_stock,
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
    # ELIMINAR DEVOLUCIÓN (DELETE DEFINITIVO)
    # --------------------------------------------------

    def eliminar(self, id_devoluciones: int) -> bool:
        if id_devoluciones <= 0:
            raise ValueError("El ID de devolución no es válido.")

        return self.repositorio.borrar(id_devoluciones)

    # --------------------------------------------------
    # CAMBIAR MOTIVO
    # --------------------------------------------------

    def cambiar_motivo(self, id_devoluciones: int, id_motivo: int):
        if id_devoluciones <= 0:
            raise ValueError("El ID de devolución no es válido.")
        if id_motivo <= 0:
            raise ValueError("El motivo seleccionado no es válido.")
        return self.repositorio.cambiar_motivo(id_devoluciones, id_motivo)

    # --------------------------------------------------
    # FILTRAR DEVOLUCIONES
    # --------------------------------------------------

    def filtrar(
        self,
        fecha_inicio=None,
        fecha_fin=None,
        id_motivo: int | None = None,
        estado: str | None = None,
        id_tipo_resolucion: int | None = None,
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

        if id_tipo_resolucion is not None and id_tipo_resolucion <= 0:
            raise ValueError("El tipo de resolución seleccionado no es válido.")

        estado = estado.strip() if estado else None

        return self.repositorio.filtrar(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            id_motivo=id_motivo,
            estado=estado,
            id_tipo_resolucion=id_tipo_resolucion,
        )

    # --------------------------------------------------
    # LISTAR DETALLES DISPONIBLES
    # --------------------------------------------------

    def listar_detalles_disponibles(self, id_venta: int | None = None):
        return self.repositorio.listar_detalles_disponibles(id_venta=id_venta)

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

    # --------------------------------------------------
    # ELIMINAR MOTIVO
    # --------------------------------------------------

    def eliminar_motivo(self, id_motivo: int) -> bool:
        if id_motivo <= 0:
            raise ValueError("El ID del motivo no es válido.")

        return self.repositorio.eliminar_motivo(id_motivo)

    # --------------------------------------------------
    # TIPOS DE RESOLUCIÓN
    # --------------------------------------------------

    def listar_tipos_resolucion(self):
        return self.repositorio.listar_tipos_resolucion()

    # --------------------------------------------------
    # OBTENER DETALLE (JSONB)
    # --------------------------------------------------

    def obtener_detalle(self, id_devolucion: int):
        if id_devolucion <= 0:
            raise ValueError("El ID de devolución no es válido.")
        return self.repositorio.obtener_detalle(id_devolucion)

    # --------------------------------------------------
    # OBTENER RECIBO (JSONB)
    # --------------------------------------------------

    def obtener_recibo(self, id_devolucion: int):
        if id_devolucion <= 0:
            raise ValueError("El ID de devolución no es válido.")
        return self.repositorio.obtener_recibo(id_devolucion)

    # --------------------------------------------------
    # DEFINIR RESOLUCIÓN
    # --------------------------------------------------

    def definir_resolucion(
        self,
        id_devolucion: int,
        id_tipo_resolucion: int,
        monto: float | None = None,
        id_producto_vari_cambio: int | None = None,
        detalle: str | None = None,
    ):
        if id_devolucion <= 0:
            raise ValueError("El ID de devolución no es válido.")
        if id_tipo_resolucion <= 0:
            raise ValueError("El tipo de resolución no es válido.")
        if monto is not None and monto < 0:
            raise ValueError("El monto no puede ser negativo.")
        if id_producto_vari_cambio is not None and id_producto_vari_cambio <= 0:
            raise ValueError("La variante de producto para cambio no es válida.")

        detalle = detalle.strip() if detalle else None

        return self.repositorio.definir_resolucion(
            id_devolucion=id_devolucion,
            id_tipo_resolucion=id_tipo_resolucion,
            monto=monto,
            id_producto_vari_cambio=id_producto_vari_cambio,
            detalle=detalle,
        )

    # --------------------------------------------------
    # COMPLETAR DEVOLUCIÓN
    # --------------------------------------------------

    def completar_devolucion(
        self,
        id_devolucion: int,
        id_usuario: int | None = None,
    ):
        if id_devolucion <= 0:
            raise ValueError("El ID de devolución no es válido.")
        if id_usuario is not None and id_usuario <= 0:
            id_usuario = None

        return self.repositorio.completar_devolucion(
            id_devolucion=id_devolucion,
            id_usuario=id_usuario,
        )

    # --------------------------------------------------
    # LISTAR CANDIDATOS CAMBIO
    # --------------------------------------------------

    def listar_candidatos_cambio(self):
        return self.repositorio.listar_candidatos_cambio()
