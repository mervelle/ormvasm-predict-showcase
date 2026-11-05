# ORMVASM Predict

**Agricultural Production Analysis & Machine Learning Prediction Platform**

ORMVASM Predict is a web application designed to support agricultural production analysis and production forecasting at a regional level.

The project combines a Python-based API, a machine learning prediction service, and a React dashboard to provide a structured interface for exploring agricultural indicators and generating production estimates.

> This repository is a technical showcase. Original operational datasets, confidential business information, and private model assets are intentionally excluded.

## Project Objectives

- Organize and explore agricultural production indicators.
- Provide an interactive interface for consulting production information.
- Analyze relationships between agricultural production and climate indicators.
- Estimate agricultural production using a machine learning model.
- Expose application features through a REST API.

## Main Features

- **Production analysis:** consultation of production indicators and distributions.
- **Climate analysis:** exploration of climate-related indicators alongside production.
- **Production prediction:** generation of production estimates through a machine learning service.
- **Territory exploration:** consultation of geographical and territorial information.
- **Data management interface:** application-level interfaces for managing raw records.

## System Architecture

The application follows a frontend–backend architecture.

```text
                 React + TypeScript
                        |
                        | HTTP / REST API
                        v
                   FastAPI Backend
                        |
          +-------------+-------------+
          |             |             |
       Services     Repositories   ML Service
          |             |             |
          +-------------+-------------+
                        |
                 Data Sources
             (not included in this
                public showcase)
```

See [Architecture](docs/architecture.md) for more details.

## Machine Learning Approach

The prediction component uses a supervised machine learning approach to estimate agricultural production.

The implemented M5 model uses agricultural features including cultivated area, crop information, and province information.

The model is integrated into the backend through a dedicated prediction service and API endpoint.

See [Machine Learning Methodology](docs/machine-learning.md).

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI and data visualization | ECharts, React-Leaflet |
| API | Python, FastAPI |
| Data processing | Pandas, NumPy |
| Machine Learning | Scikit-learn |
| Backend validation | Pydantic |
| Testing | Pytest |

## Repository Structure

```text
ormvasm-predict-showcase/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── data_contracts/
│   │   ├── ml/
│   │   ├── repositories/
│   │   ├── schemas/
│   │   └── services/
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── app/
│   │   ├── components/
│   │   └── features/
│   └── package.json
├── docs/
│   ├── architecture.md
│   └── machine-learning.md
├── screenshots/
├── .gitignore
└── README.md
```

## Screenshots

Application screenshots will be added after reviewing and sanitizing them to ensure that no private or operational information is exposed.

## Data Privacy

This public repository does not include original agricultural datasets, operational spreadsheets or confidential institutional information.

The application source code is presented for technical demonstration. Running the complete application requires separately authorized data sources and configuration.

---

**Project:** ORMVASM Predict  
**Focus:** Data Science · Machine Learning · Full-Stack Development
