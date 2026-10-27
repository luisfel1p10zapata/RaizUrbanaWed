
from datetime import date
from pydantic import BaseModel, Field, ConfigDict, model_validator


class DetalleOrdenProduccionRequest(BaseModel):
    id_producto_vari: int = Field(gt=0)
    cantidad: int = Field(gt=0)


class RegistrarOrdenProduccionRequest(BaseModel):
    id_usuario: int = Field(gt=0)
    fecha_estimada: date
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

        return self


class ActualizarOrdenProduccionRequest(BaseModel):
    id_usuario: int = Field(gt=0)
    fecha_estimada: date
    observaciones: str | None = Field(default=None, max_length=255)
    detalles: list[DetalleOrdenProduccionRequest] = Field(min_length=1)

    @model_validator(mode="after")
    def validar_detalles_unicos(self):
        ids = [detalle.id_producto_vari for detalle in self.detalles]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "No se puede repetir una variante en los detalles de la orden."
            )

        return self


class CambiarEstadoOrdenProduccionRequest(BaseModel):
    id_estado_orden: int = Field(gt=0)
