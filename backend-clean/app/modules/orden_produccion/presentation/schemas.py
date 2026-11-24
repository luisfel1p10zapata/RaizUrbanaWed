from datetime import date
from pydantic import BaseModel, Field, ConfigDict, model_validator


class DetalleOrdenProduccionRequest(BaseModel):
    id_producto_vari: int = Field(gt=0)
    cantidad: int = Field(gt=0)


class RegistrarOrdenProduccionRequest(BaseModel):
    id_usuario: int = Field(gt=0)
    fecha_estimada: date
    fecha_inicio: date
    observaciones: str | None = Field(default=None, max_length=255)
    detalles: list[DetalleOrdenProduccionRequest] = Field(min_length=1)
    id_estado_orden: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validar_detalles_unicos(self):
        ids = [detalle.id_producto_vari for detalle in self.detalles]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "No se puede repetir una variante en los detalles de la orden."
            )

        if self.fecha_inicio and self.fecha_estimada and self.fecha_inicio > self.fecha_estimada:
            raise ValueError(
                "La fecha de inicio no puede ser posterior a la fecha estimada."
            )

        return self


class ActualizarOrdenProduccionRequest(BaseModel):
    id_usuario: int = Field(gt=0)
    fecha_estimada: date
    fecha_inicio: date
    observaciones: str | None = Field(default=None, max_length=255)
    detalles: list[DetalleOrdenProduccionRequest] = Field(min_length=1)

    @model_validator(mode="after")
    def validar_detalles_unicos(self):
        ids = [detalle.id_producto_vari for detalle in self.detalles]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "No se puede repetir una variante en los detalles de la orden."
            )

        if self.fecha_inicio and self.fecha_estimada and self.fecha_inicio > self.fecha_estimada:
            raise ValueError(
                "La fecha de inicio no puede ser posterior a la fecha estimada."
            )

        return self


class CambiarEstadoOrdenProduccionRequest(BaseModel):
    id_estado_orden: int = Field(gt=0)


class CancelarOrdenProduccionRequest(BaseModel):
    motivo: str = Field(min_length=1, max_length=255)

    @model_validator(mode="after")
    def validar_motivo_no_vacio(self):
        if not self.motivo or not self.motivo.strip():
            raise ValueError("El motivo de la cancelación es obligatorio.")
        return self


class RegistrarNoConformeRequest(BaseModel):
    cantidad: int = Field(gt=0)
    motivo: str = Field(min_length=1, max_length=255)
    id_accion: int = Field(gt=0)
    detalle_accion: str | None = Field(default=None, max_length=255)


class ResolverNoConformeRequest(BaseModel):
    observacion: str | None = Field(default=None, max_length=255)


class AnularNoConformeRequest(BaseModel):
    observacion: str | None = Field(default=None, max_length=255)
