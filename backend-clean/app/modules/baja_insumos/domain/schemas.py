"""Esquemas de entrada y respuesta para bajas de insumos."""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator # type: ignore


class BajaInsumoCreate(BaseModel):
    """Datos que se reciben para registrar una baja."""

    model_config = ConfigDict(populate_by_name=True)

    id_insumo: int = Field(
        gt=0,
        alias="idInsumo",
        description="Identificador del insumo.",
    )

    cantidad: int = Field(
        gt=0,
        description="Cantidad de unidades que se darán de baja.",
    )

    motivo: str = Field(
        min_length=1,
        max_length=255,
        description="Motivo por el cual se registra la baja.",
    )

    @field_validator("motivo", mode="before")
    @classmethod
    def limpiar_motivo(cls, valor):
        if isinstance(valor, str):
            return valor.strip()

        return valor


class BajaInsumoRegistrada(BaseModel):
    """Resultado devuelto después de registrar una baja."""

    model_config = ConfigDict(populate_by_name=True)

    id_baja: int = Field(alias="idBaja")
    stock_resultante: int = Field(alias="stockResultante")


class BajaInsumoResponse(BaseModel):
    """Información de una baja registrada."""

    model_config = ConfigDict(populate_by_name=True)

    id_baja: int = Field(alias="idBaja")
    id_insumo: int = Field(alias="idInsumo")
    nombre_insumo: str = Field(alias="nombreInsumo")
    id_usuario: int = Field(alias="idUsuario")
    nombre_usuario: str = Field(alias="nombreUsuario")
    cantidad: int
    motivo: str
    fecha_baja: date = Field(alias="fechaBaja")