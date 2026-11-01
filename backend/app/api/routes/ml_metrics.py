from fastapi import APIRouter
from app.ml.evaluation import ml_evaluation_service

router = APIRouter(prefix="/api/ml", tags=["ml_metrics"])

@router.get("/evaluation")
async def get_ml_evaluation_report():
    """
    Returns actual, reproducible ML model benchmark metrics:
    Precision, Recall, F1-Score, ROC-AUC, MAE, R^2, NDCG@5, and Feature Importances.
    """
    return ml_evaluation_service.report or ml_evaluation_service.train_and_evaluate_benchmark()
