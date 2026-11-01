# Machine Learning Methodology

## Objective

The prediction component aims to estimate agricultural production using relevant agricultural characteristics.

## Model Features

The implemented M5 model uses three main types of information:

- Cultivated area.
- Crop information.
- Province information.

These features help the model account for differences between agricultural categories and geographical areas.

## Prediction Workflow

1. Receive prediction parameters from the frontend.
2. Validate the input through the API.
3. Prepare the features required by the model.
4. Generate a production estimate.
5. Return the result through the prediction endpoint.
6. Display the prediction in the frontend.

## Backend Integration

The model is integrated into FastAPI through a dedicated machine learning module and prediction service.

## Reproducibility

Original training datasets and private model artifacts are intentionally excluded from this repository.

This document describes the implemented approach but does not claim that the original model can be independently retrained from the public repository.