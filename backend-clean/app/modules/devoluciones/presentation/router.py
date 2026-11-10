from datetime import date
import psycopg

from fastapi import APIRouter, HTTPException, Query, status

from app.modules.devoluciones.application.service import DevolucionService

from app.modules.devoluciones.presentation.schemas import (
    RegistrarDevolucionRequest,
    ActualizarDevolucionRequest,
    AnularDevolucionRequest,
    RegistrarMotivoRequest,
    ActualizarMotivoRequest,
)


router = APIRouter(
    prefix="/api/devoluciones",
    tags=["Devoluciones"],
)


# --------------------------------------------------
# MANEJO DE ERRORES
# --------------------------------------------------

def manejar_error(error: Exception):
    if isinstance(error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    if isinstance(error, psycopg.Error):
        codigo = error.sqlstate
        mensaje = str(error).split("\n")[0].replace("ERROR:", "").strip()

        if codigo == "P0002":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=mensaje,
            ) from error

        if codigo == "P0001":
            mensaje_lower = mensaje.lower()

            if "no existe" in mensaje_lower:
                codigo_http = status.HTTP_404_NOT_FOUND

            elif "anulad" in mensaje_lower:
                codigo_http = status.HTTP_409_CONFLICT

            elif "ya existe" in mensaje_lower:
                codigo_http = status.HTTP_409_CONFLICT

            elif "insuficiente" in mensaje_lower:
                codigo_http = status.HTTP_409_CONFLICT

            else:
                codigo_http = status.HTTP_400_BAD_REQUEST

            raise HTTPException(
                status_code=codigo_http,
                detail=mensaje,
            ) from error

        if codigo == "23505":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El registro ya existe.",
            ) from error

        if codigo in ("23503", "23514"):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=mensaje,
            ) from error

        if codigo == "22023":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=mensaje,
            ) from error

        if isinstance(error, psycopg.OperationalError):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No fue posible conectar con la base de datos.",
            ) from error

    if isinstance(error, RuntimeError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Ocurrió un error interno al procesar la operación.",
    ) from error


# --------------------------------------------------
# REGISTRAR DEVOLUCIÓN
# POST /api/devoluciones
# --------------------------------------------------

@router.post("", status_code=status.HTTP_201_CREATED)
def registrar_devolucion(datos: RegistrarDevolucionRequest):
    try:
        return DevolucionService().registrar(
            id_det_venta=datos.id_det_venta,
            cantidad=datos.cantidad,
            observaciones=datos.observaciones,
            fecha_devolucion=datos.fecha_devolucion,
            id_motivo=datos.id_motivo,
            reintegra_stock=datos.reintegra_stock,
        )

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# LISTAR DEVOLUCIONES
# GET /api/devoluciones
# --------------------------------------------------

@router.get("")
def listar_devoluciones():
    try:
        return DevolucionService().listar()

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# BUSCAR DEVOLUCIONES
# GET /api/devoluciones/buscar?filtro=camisa
# --------------------------------------------------

@router.get("/buscar")
def buscar_devoluciones(
    filtro: str = Query(default="", max_length=100),
):
    try:
        return DevolucionService().buscar(filtro)

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# FILTRAR DEVOLUCIONES
# GET /api/devoluciones/filtrar
# --------------------------------------------------

@router.get("/filtrar")
def filtrar_devoluciones(
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
    id_motivo: int | None = Query(default=None, gt=0),
    estado: str | None = Query(default=None, max_length=50),
):
    try:
        return DevolucionService().filtrar(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            id_motivo=id_motivo,
            estado=estado,
        )

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# LISTAR DETALLES DISPONIBLES PARA DEVOLUCIÓN
# GET /api/devoluciones/detalles-disponibles
# --------------------------------------------------

@router.get("/detalles-disponibles")
def listar_detalles_disponibles():
    try:
        return DevolucionService().listar_detalles_disponibles()

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# LISTAR MOTIVOS
# GET /api/devoluciones/motivos
# --------------------------------------------------

@router.get("/motivos")
def listar_motivos():
    try:
        return DevolucionService().listar_motivos()

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# REGISTRAR MOTIVO
# POST /api/devoluciones/motivos
# --------------------------------------------------

@router.post(
    "/motivos",
    status_code=status.HTTP_201_CREATED,
)
def registrar_motivo(datos: RegistrarMotivoRequest):
    try:
        return DevolucionService().registrar_motivo(
            nombre=datos.nombre,
        )

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ACTUALIZAR MOTIVO
# PUT /api/devoluciones/motivos/{id_motivo}
# --------------------------------------------------

@router.put("/motivos/{id_motivo}")
def actualizar_motivo(
    id_motivo: int,
    datos: ActualizarMotivoRequest,
):
    try:
        resultado = DevolucionService().actualizar_motivo(
            id_motivo=id_motivo,
            nombre=datos.nombre,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró el motivo.",
            )

        return resultado

    except HTTPException:
        raise

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# CONSULTAR DEVOLUCIÓN POR ID
# GET /api/devoluciones/{id_devoluciones}
# --------------------------------------------------

@router.get("/{id_devoluciones}")
def obtener_devolucion(id_devoluciones: int):
    try:
        resultado = DevolucionService().obtener_por_id(
            id_devoluciones,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró la devolución.",
            )

        return resultado

    except HTTPException:
        raise

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ACTUALIZAR DEVOLUCIÓN
# PUT /api/devoluciones/{id_devoluciones}
# --------------------------------------------------

@router.put("/{id_devoluciones}")
def actualizar_devolucion(
    id_devoluciones: int,
    datos: ActualizarDevolucionRequest,
):
    try:
        resultado = DevolucionService().actualizar(
            id_devoluciones=id_devoluciones,
            cantidad=datos.cantidad,
            observaciones=datos.observaciones,
            fecha_devolucion=datos.fecha_devolucion,
            id_motivo=datos.id_motivo,
            reintegra_stock=datos.reintegra_stock,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró la devolución.",
            )

        return resultado

    except HTTPException:
        raise

    except Exception as error:
        manejar_error(error)


# --------------------------------------------------
# ANULAR DEVOLUCIÓN
# PATCH /api/devoluciones/{id_devoluciones}/anular
# --------------------------------------------------

@router.patch("/{id_devoluciones}/anular")
def anular_devolucion(
    id_devoluciones: int,
    datos: AnularDevolucionRequest,
):
    try:
        resultado = DevolucionService().anular(
            id_devoluciones=id_devoluciones,
            observacion_anulacion=datos.observacion_anulacion,
        )

        if resultado is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No se encontró la devolución.",
            )

        return {
            "mensaje": "Devolución anulada correctamente.",
            "devolucion": resultado,
        }

    except HTTPException:
        raise

    except Exception as error:
        manejar_error(error)
