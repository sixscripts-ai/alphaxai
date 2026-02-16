import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from io import BytesIO
import json

def analyze_dataset(file_content: bytes, filename: str) -> dict:
    try:
        # 1. Load Data
        if filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(file_content))
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(BytesIO(file_content))
        elif filename.endswith('.json'):
            df = pd.read_json(BytesIO(file_content))
        elif filename.endswith('.parquet'):
            df = pd.read_parquet(BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format")

        # Basic Cleaning
        df = df.replace([np.inf, -np.inf], np.nan)
        
        # 2. Executive Summary
        summary = {
            "total_rows": int(df.shape[0]),
            "total_columns": int(df.shape[1]),
            "memory_usage_mb": float(df.memory_usage(deep=True).sum() / 1024 / 1024),
            "missing_values_count": int(df.isna().sum().sum()),
            "duplicate_rows": int(df.duplicated().sum())
        }

        # 3. Column Profiling
        columns_profile = []
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        
        for col in df.columns:
            col_data = df[col]
            profile = {
                "name": col,
                "type": str(col_data.dtype),
                "missing": int(col_data.isna().sum()),
                "unique": int(col_data.nunique()),
            }
            if col in numeric_cols:
                profile.update({
                    "mean": float(col_data.mean()) if not col_data.isna().all() else None,
                    "min": float(col_data.min()) if not col_data.isna().all() else None,
                    "max": float(col_data.max()) if not col_data.isna().all() else None,
                    "std": float(col_data.std()) if not col_data.isna().all() else None,
                })
            columns_profile.append(profile)

        # 4. Anomaly Detection (Numeric only)
        anomalies = []
        if len(numeric_cols) > 0 and len(df) > 10:
            # Fill NA for isolation forest
            df_numeric = df[numeric_cols].fillna(0)
            scaler = StandardScaler()
            X = scaler.fit_transform(df_numeric)
            
            clf = IsolationForest(contamination=0.05, random_state=42)
            preds = clf.fit_predict(X)
            
            # Get indices of anomalies
            anomaly_indices = [i for i, x in enumerate(preds) if x == -1]
            
            # Return top 5 anomalies
            for idx in anomaly_indices[:5]:
                anomalies.append({
                    "row_index": idx,
                    "data": df.iloc[idx].to_dict()
                })

        # 5. Correlation Matrix (Numeric only)
        correlations = {}
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr()
            # Convert to list format for frontend heatmap
            for i, row in enumerate(corr_matrix.index):
                for j, col in enumerate(corr_matrix.columns):
                    correlations[f"{row}::{col}"] = float(corr_matrix.iloc[i, j])

        # 6. Actionable Insights (Rule-based)
        insights = []
        if summary["missing_values_count"] > 0:
            insights.append({
                "type": "Data Quality",
                "severity": "High" if summary["missing_values_count"] > len(df) * 0.1 else "Medium",
                "message": f"Found {summary['missing_values_count']} missing values. Consider imputation or dropping rows."
            })
        if summary["duplicate_rows"] > 0:
            insights.append({
                "type": "Data Quality",
                "severity": "Medium",
                "message": f"Found {summary['duplicate_rows']} duplicate rows. Deduping recommended."
            })
        if len(anomalies) > 0:
            insights.append({
                "type": "Anomaly",
                "severity": "High",
                "message": f"Detected {len(anomaly_indices)} potential anomalies in numeric data."
            })

        return {
            "success": True,
            "summary": summary,
            "columns": columns_profile,
            "anomalies": anomalies,
            "correlations": correlations,
            "insights": insights
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
