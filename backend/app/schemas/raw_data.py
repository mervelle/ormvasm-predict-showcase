from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


RawCell = str | int | float | bool | None


class StrictModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )


class RawDataFilterOption(StrictModel):
    value: str
    label: str


class RawDataOptionsResponse(StrictModel):
    provinces: list[RawDataFilterOption]
    cultures: list[RawDataFilterOption]
    types_1: list[RawDataFilterOption]
    types_2: list[RawDataFilterOption]


class RawDataPageResponse(StrictModel):
    columns: list[str]
    rows: list[dict[str, RawCell]]
    total: int = Field(ge=0)
    offset: int = Field(ge=0)
    limit: int = Field(ge=1, le=200)
    next_offset: int | None = Field(default=None, ge=0)


class RawDataImportResponse(StrictModel):
    added_rows: int = Field(gt=0)
    total_rows: int = Field(gt=0)
