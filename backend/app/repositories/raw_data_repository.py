from __future__ import annotations

from io import BytesIO
from pathlib import Path
from threading import RLock
from typing import Final
import json
import math
import os

import pandas as pd


RAW_DATA_COLUMNS: Final[tuple[str, ...]] = (
    "PROVINCES",
    "FAMILLE ",
    "TYPE 1",
    "TYPE2",
    "CULTURES",
    "CAMPAGNES",
    "SUP.(HA)",
    "PROD.(T)",
    "EXP.(T)",
)

OLE_SIGNATURE: Final[bytes] = bytes.fromhex("D0CF11E0A1B11AE1")


class RawDataRepositoryError(RuntimeError):
    """La source brute n'est pas lisible ou cohérente."""


class RawDataImportError(ValueError):
    """Le fichier importé ne respecte pas le contrat brut."""


def _is_blank_cell(value: object) -> bool:
    if value is None:
        return True

    if isinstance(value, str):
        return value.strip() == ""

    if isinstance(value, float):
        return math.isnan(value)

    try:
        result = pd.isna(value)
    except (TypeError, ValueError):
        return False

    return bool(result) if isinstance(result, bool) else False


def remove_fully_blank_rows(frame: pd.DataFrame) -> pd.DataFrame:
    """Retire uniquement les lignes dont toutes les cellules sont vides."""
    if frame.empty:
        return frame.copy()

    blank_mask = frame.apply(
        lambda row: all(_is_blank_cell(value) for value in row),
        axis=1,
    )
    return frame.loc[~blank_mask].reset_index(drop=True)


def _validate_columns(frame: pd.DataFrame) -> None:
    actual = tuple(str(column) for column in frame.columns)

    if actual != RAW_DATA_COLUMNS:
        raise RawDataImportError(
            "Le fichier doit contenir exactement les 9 colonnes de la feuille BD 2, "
            "dans le même ordre."
        )


def _excel_engine(content: bytes) -> str:
    # Le fichier ORMVA fourni a l'extension .xlsx mais son contenu est un ancien .xls.
    return "xlrd" if content.startswith(OLE_SIGNATURE) else "openpyxl"


def _read_excel_content(
    content: bytes,
    *,
    sheet_name: str,
) -> pd.DataFrame:
    if not content:
        raise RawDataImportError("Le fichier Excel est vide.")

    engine = _excel_engine(content)

    try:
        with pd.ExcelFile(BytesIO(content), engine=engine) as workbook:
            if sheet_name not in workbook.sheet_names:
                raise RawDataImportError(
                    f"La feuille obligatoire '{sheet_name}' est absente."
                )

            frame = pd.read_excel(
                workbook,
                sheet_name=sheet_name,
                dtype=object,
                keep_default_na=False,
            )
    except RawDataImportError:
        raise
    except Exception as exc:
        raise RawDataImportError(
            "Le fichier Excel n'a pas pu être lu."
        ) from exc

    _validate_columns(frame)
    return remove_fully_blank_rows(frame)


def _python_value(value: object) -> object:
    if _is_blank_cell(value):
        # Une cellule vide reste vide dans le stockage additionnel.
        return ""

    item = getattr(value, "item", None)
    if callable(item):
        return item()

    return value


def _frame_to_records(frame: pd.DataFrame) -> list[dict[str, object]]:
    return [
        {
            column: _python_value(row[column])
            for column in RAW_DATA_COLUMNS
        }
        for _, row in frame.iterrows()
    ]


def _load_additions(path: Path) -> pd.DataFrame:
    if not path.is_file():
        return pd.DataFrame(columns=RAW_DATA_COLUMNS)

    records: list[dict[str, object]] = []

    try:
        with path.open("r", encoding="utf-8") as stream:
            for line in stream:
                if not line.strip():
                    continue

                value = json.loads(line)
                if not isinstance(value, dict):
                    raise RawDataRepositoryError(
                        "Le stockage des ajouts bruts est invalide."
                    )

                records.append(
                    {
                        column: value.get(column, "")
                        for column in RAW_DATA_COLUMNS
                    }
                )
    except (OSError, json.JSONDecodeError) as exc:
        raise RawDataRepositoryError(
            "Le stockage des ajouts bruts est illisible."
        ) from exc

    frame = pd.DataFrame(records, columns=RAW_DATA_COLUMNS)
    _validate_columns(frame)
    return frame


def _save_additions(path: Path, frame: pd.DataFrame) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")

    records = _frame_to_records(frame)

    try:
        with temporary.open("w", encoding="utf-8", newline="\n") as stream:
            for record in records:
                stream.write(
                    json.dumps(
                        record,
                        ensure_ascii=False,
                        separators=(",", ":"),
                    )
                )
                stream.write("\n")

            stream.flush()
            os.fsync(stream.fileno())

        os.replace(temporary, path)
    except OSError as exc:
        try:
            temporary.unlink(missing_ok=True)
        except OSError:
            pass

        raise RawDataRepositoryError(
            "Les nouvelles données n'ont pas pu être enregistrées."
        ) from exc


class RawDataRepository:
    def __init__(
        self,
        *,
        base_data: pd.DataFrame,
        additions: pd.DataFrame,
        additions_path: Path,
        sheet_name: str,
    ) -> None:
        self._base_data = base_data.copy()
        self._additions = additions.copy()
        self._additions_path = additions_path
        self._sheet_name = sheet_name
        self._lock = RLock()

    @classmethod
    def from_excel(
        cls,
        source_path: Path,
        *,
        sheet_name: str,
        additions_path: Path,
    ) -> "RawDataRepository":
        source_path = Path(source_path)

        if not source_path.is_file():
            raise RawDataRepositoryError(
                "Le fichier de données brutes ORMVA est absent."
            )

        try:
            content = source_path.read_bytes()
        except OSError as exc:
            raise RawDataRepositoryError(
                "Le fichier de données brutes ORMVA est illisible."
            ) from exc

        try:
            base_data = _read_excel_content(
                content,
                sheet_name=sheet_name,
            )
        except RawDataImportError as exc:
            raise RawDataRepositoryError(str(exc)) from exc

        additions = _load_additions(Path(additions_path))

        return cls(
            base_data=base_data,
            additions=additions,
            additions_path=Path(additions_path),
            sheet_name=sheet_name,
        )

    def get_all(self) -> pd.DataFrame:
        """Retourne une copie de la source et des ajouts, dans l'ordre."""
        with self._lock:
            return pd.concat(
                [self._base_data, self._additions],
                ignore_index=True,
            ).copy()

    def append_excel(self, content: bytes) -> int:
        """Ajoute les lignes d'une feuille BD 2 sans transformer leurs valeurs."""
        frame = _read_excel_content(
            content,
            sheet_name=self._sheet_name,
        )

        if frame.empty:
            raise RawDataImportError(
                "Le fichier ne contient aucune ligne de données."
            )

        with self._lock:
            updated = pd.concat(
                [self._additions, frame],
                ignore_index=True,
            )
            _save_additions(self._additions_path, updated)
            self._additions = updated

        return len(frame)
