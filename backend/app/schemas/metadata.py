from pydantic import BaseModel, ConfigDict


class FilterOption(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    value: str
    label: str


class ProductionUnits(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    production_t: str
    superficie_ha: str
    rendement_t_ha: str
    part_pct: str


class FilterMetadataResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    provinces: list[FilterOption]
    cultures: list[FilterOption]
    campagnes: list[FilterOption]
    types_environnement: list[FilterOption]
    modes_irrigation: list[FilterOption]
    units: ProductionUnits
