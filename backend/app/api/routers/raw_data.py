from __future__ import annotations

from dataclasses import asdict
from io import BytesIO
from typing import Annotated

import pandas as pd
from fastapi import (
    APIRouter,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import StreamingResponse

from app.api.dependencies import RawDataRepositoryDependency
from app.repositories.raw_data_repository import (
    RawDataImportError,
    RawDataRepositoryError,
)
from app.schemas.raw_data import (
    RawDataImportResponse,
    RawDataOptionsResponse,
    RawDataPageResponse,
)
from app.services.raw_data import (
    RawDataFilters,
    build_raw_data_export,
    build_raw_data_options,
    build_raw_data_page,
)


MAX_UPLOAD_BYTES = 10 * 1024 * 1024

router = APIRouter(
    prefix="/raw-data",
    tags=["Données brutes"],
)


def _filters(
    *,
    province: list[str] | None,
    culture: list[str] | None,
    type_1: list[str] | None,
    type_2: list[str] | None,
) -> RawDataFilters:
    return RawDataFilters(
        provinces=tuple(province or ()),
        cultures=tuple(culture or ()),
        types_1=tuple(type_1 or ()),
        types_2=tuple(type_2 or ()),
    )


@router.get(
    "/options",
    response_model=RawDataOptionsResponse,
    summary="Lister les filtres des données brutes ORMVA",
)
def get_raw_data_options(
    repository: RawDataRepositoryDependency,
) -> RawDataOptionsResponse:
    result = build_raw_data_options(
        repository.get_all()
    )
    return RawDataOptionsResponse.model_validate(result)


@router.get(
    "",
    response_model=RawDataPageResponse,
    summary="Consulter les données brutes ORMVA",
)
def get_raw_data(
    repository: RawDataRepositoryDependency,
    province: Annotated[list[str] | None, Query()] = None,
    culture: Annotated[list[str] | None, Query()] = None,
    type_1: Annotated[list[str] | None, Query()] = None,
    type_2: Annotated[list[str] | None, Query()] = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> RawDataPageResponse:
    result = build_raw_data_page(
        repository.get_all(),
        filters=_filters(
            province=province,
            culture=culture,
            type_1=type_1,
            type_2=type_2,
        ),
        offset=offset,
        limit=limit,
    )

    return RawDataPageResponse.model_validate(asdict(result))


@router.post(
    "/import",
    response_model=RawDataImportResponse,
    status_code=status.HTTP_200_OK,
    summary="Ajouter des données brutes depuis Excel",
)
async def import_raw_data(
    repository: RawDataRepositoryDependency,
    file: Annotated[UploadFile, File(...)],
) -> RawDataImportResponse:
    content = await file.read(MAX_UPLOAD_BYTES + 1)

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "raw_data_file_too_large",
                "message": "Le fichier dépasse la taille maximale de 10 Mo.",
            },
        )

    try:
        added_rows = repository.append_excel(content)
    except RawDataImportError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "raw_data_invalid_file",
                "message": str(error),
            },
        ) from error
    except RawDataRepositoryError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "raw_data_unavailable",
                "message": "Les données n'ont pas pu être enregistrées.",
            },
        ) from error

    return RawDataImportResponse(
        added_rows=added_rows,
        total_rows=len(repository.get_all()),
    )


@router.get(
    "/export",
    summary="Exporter les données brutes filtrées",
)
def export_raw_data(
    repository: RawDataRepositoryDependency,
    province: Annotated[list[str] | None, Query()] = None,
    culture: Annotated[list[str] | None, Query()] = None,
    type_1: Annotated[list[str] | None, Query()] = None,
    type_2: Annotated[list[str] | None, Query()] = None,
) -> StreamingResponse:
    frame = build_raw_data_export(
        repository.get_all(),
        filters=_filters(
            province=province,
            culture=culture,
            type_1=type_1,
            type_2=type_2,
        ),
    )

    output = BytesIO()

    with pd.ExcelWriter(
        output,
        engine="openpyxl",
    ) as writer:
        frame.to_excel(
            writer,
            sheet_name="BD 2",
            index=False,
        )

    output.seek(0)

    return StreamingResponse(
        output,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                'attachment; filename="donnees_brutes_ormva.xlsx"'
            )
        },
    )
