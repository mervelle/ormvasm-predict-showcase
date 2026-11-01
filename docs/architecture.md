# System Architecture

## Overview

ORMVASM Predict follows a frontend–backend architecture designed to separate user interaction, application logic, data access, and machine learning operations.

## Frontend

The frontend is developed with React and TypeScript.

Its responsibilities include:

- Displaying application screens and dashboards.
- Managing navigation and user interactions.
- Communicating with backend REST endpoints.
- Presenting production and climate indicators.
- Collecting prediction parameters and displaying results.

## Backend

The backend is developed with FastAPI and organized into several layers:

- **API:** handles HTTP requests and responses.
- **Schemas:** validates and structures API data.
- **Services:** implements application logic.
- **Repositories:** handles data access.
- **Data Contracts:** defines structured application data.
- **Machine Learning:** integrates the prediction model.

## Request Flow

1. The user interacts with the frontend.
2. The frontend sends an HTTP request.
3. The API validates the request.
4. The relevant service processes the operation.
5. The service uses the required repository or ML component.
6. The backend returns a structured response.
7. The frontend displays the result.

## Data Sources

Original operational datasets and private model assets are not included in this public showcase.