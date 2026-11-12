
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class RegistrarDevolucionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    id_det_venta: int = Field(gt=0)
    cantidad: int = Field(gt=0)
    observaciones: str | None = Field(default=None, max_length=255)
    fecha_devolucion: date
    id_motivo: int = Field(gt=0)
    reintegra_stock: bool = True


class ActualizarDevolucionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    cantidad: int = Field(gt=0)
    observaciones: str | None = Field(default=None, max_length=255)
    fecha_devolucion: date
    id_motivo: int = Field(gt=0)
    reintegra_stock: bool | None = None


class AnularDevolucionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    observacion_anulacion: str | None = Field(
        default=None,
        max_length=255,
    )


class CambiarMotivoDevolucionRequest(BaseModel):
    id_motivo: int = Field(gt=0)


class RegistrarMotivoRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1, max_length=100)


class ActualizarMotivoRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    nombre: str = Field(min_length=1, max_length=100)
