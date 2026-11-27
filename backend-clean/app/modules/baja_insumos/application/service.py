"""Lógica de negocio para bajas de insumos."""

from typing import Any

from app.modules.baja_insumos.domain.schemas import BajaInsumoCreate
from app.modules.baja_insumos.infrastructure.repository import (
    BajaInsumoRepository,
)


class BajaInsumoNoEncontradaError(Exception):
    """La baja solicitada no existe."""


class BajaInsumoService:
    """Coordina las operaciones de bajas de insumos."""

    def __init__(
        self,
        repositorio: BajaInsumoRepository | None = None,
    ):
        self.repositorio = (
            repositorio
            if repositorio is not None
            else BajaInsumoRepository()
        )

    def registrar(
        self,
        datos: BajaInsumoCreate,
        id_usuario: int,
    ) -> dict[str, Any]:
        """Registra una baja para el usuario autenticado."""

        return self.repositorio.registrar(
            id_insumo=datos.id_insumo,
            id_usuario=id_usuario,
            cantidad=datos.cantidad,
            motivo=datos.motivo,
        )

    def listar(self) -> list[dict[str, Any]]:
        """Devuelve las bajas registradas."""

        return self.repositorio.listar()

    def obtener_por_id(
        self,
        id_baja: int,
    ) -> dict[str, Any]:
        """Devuelve una baja o informa que no existe."""

        baja = self.repositorio.obtener_por_id(id_baja)

        if baja is None:
            raise BajaInsumoNoEncontradaError(
                f"No se encontró la baja con ID {id_baja}."
            )

        return baja