import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from io import BytesIO
import json
import os
import logging
from google import genai

logger = logging.getLogger("analysis")

# Initialize Gemini client
_client = None


def _get_gemini_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            _client = genai.Client(api_key=api_key)
        else:
            logger.warning("GEMINI_API_KEY not set — AI insights will be unavailable")
    return _client


def _generate_ai_insights(summary: dict, columns_profile: list, anomalies: list, correlations: dict, sample_rows: list) -> dict:
    """Call Gemini 2.5 Pro to generate real AI-powered insights from the data profile."""
    client = _get_gemini_client()
    if not client:
        return {
            "ai_summary": "AI insights unavailable — GEMINI_API_KEY not configured.",
            "ai_insights": []
        }

    # Build a compact data profile for the LLM
    strong_corr = {k: round(v, 3) for k, v in correlations.items() if abs(v) > 0.7 and "::" in k and k.split("::")[0] != k.split("::")[1]}

    data_profile = json.dumps({
        "summary": summary,
        "columns": columns_profile[:30],
        "anomaly_count": len(anomalies),
        "strong_correlations": dict(list(strong_corr.items())[:20]),
        "sample_rows": sample_rows[:3],
    }, default=str, indent=2)

    system_prompt = (
        "You are an expert data analyst AI agent. You receive a statistical profile of an uploaded dataset "
        "and produce a concise executive summary plus actionable insights.\n\n"
        "Rules:\n"
        "- Be specific and reference actual column names, values, and numbers.\n"
        "- Categorize each insight with a type (Data Quality, Trend, Anomaly, Recommendation, Optimization) and severity (High, Medium, Low).\n"
        "- Return ONLY valid JSON in this exact format:\n"
        '{\n'
        '  "ai_summary": "2-3 sentence executive summary of the dataset",\n'
        '  "ai_insights": [\n'
        '    {"type": "...", "severity": "...", "message": "..."}\n'
        '  ]\n'
        '}'
    )

    try:
        response = client.models.generate_content(
            model="gemini-2.5-pro-preview-06-05",
            contents=f"{system_prompt}\n\nAnalyze this dataset profile and provide insights:\n\n{data_profile}",
            config={
                "temperature": 0.3,
                "max_output_tokens": 1500,
                "response_mime_type": "application/json",
            },
        )

        result_text = response.text
        return json.loads(result_text)

    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return {
            "ai_summary": f"AI analysis encountered an error: {str(e)}",
            "ai_insights": []
        }


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
        anomaly_indices = []
        if len(numeric_cols) > 0 and len(df) > 10:
            df_numeric = df[numeric_cols].fillna(0)
            scaler = StandardScaler()
            X = scaler.fit_transform(df_numeric)
            
            clf = IsolationForest(contamination=0.05, random_state=42)
            preds = clf.fit_predict(X)
            
            anomaly_indices = [i for i, x in enumerate(preds) if x == -1]
            
            for idx in anomaly_indices[:5]:
                row_data = df.iloc[idx].to_dict()
                # Make sure all values are JSON-serializable
                clean_data = {}
                for k, v in row_data.items():
                    if isinstance(v, (np.integer,)):
                        clean_data[k] = int(v)
                    elif isinstance(v, (np.floating,)):
                        clean_data[k] = float(v) if not np.isnan(v) else None
                    elif isinstance(v, (np.bool_,)):
                        clean_data[k] = bool(v)
                    else:
                        clean_data[k] = str(v) if not pd.isna(v) else None
                anomalies.append({
                    "row_index": idx,
                    "data": clean_data
                })

        # 5. Correlation Matrix (Numeric only)
        correlations = {}
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr()
            for i, row in enumerate(corr_matrix.index):
                for j, col in enumerate(corr_matrix.columns):
                    val = corr_matrix.iloc[i, j]
                    correlations[f"{row}::{col}"] = float(val) if not np.isnan(val) else 0.0

        # 6. Rule-based insights (always available)
        insights = []
        if summary["missing_values_count"] > 0:
            insights.append({
                "type": "Data Quality",
                "severity": "High" if summary["missing_values_count"] > len(df) * 0.1 else "Medium",
                "message": f"Found {summary['missing_values_count']} missing values across {sum(1 for c in columns_profile if c['missing'] > 0)} columns. Consider imputation or dropping rows."
            })
        if summary["duplicate_rows"] > 0:
            insights.append({
                "type": "Data Quality",
                "severity": "Medium",
                "message": f"Found {summary['duplicate_rows']} duplicate rows ({summary['duplicate_rows']/summary['total_rows']*100:.1f}% of data). Deduplication recommended."
            })
        if len(anomalies) > 0:
            insights.append({
                "type": "Anomaly",
                "severity": "High",
                "message": f"Detected {len(anomaly_indices)} potential anomalies ({len(anomaly_indices)/summary['total_rows']*100:.1f}% of rows) via Isolation Forest."
            })

        # 7. AI-Powered Insights (GPT-4o-mini)
        sample_rows = []
        try:
            sample_df = df.head(3)
            for _, row in sample_df.iterrows():
                row_dict = {}
                for k, v in row.to_dict().items():
                    if isinstance(v, (np.integer,)):
                        row_dict[k] = int(v)
                    elif isinstance(v, (np.floating,)):
                        row_dict[k] = float(v) if not np.isnan(v) else None
                    elif isinstance(v, (np.bool_,)):
                        row_dict[k] = bool(v)
                    else:
                        row_dict[k] = str(v) if not pd.isna(v) else None
                sample_rows.append(row_dict)
        except Exception:
            pass

        ai_result = _generate_ai_insights(summary, columns_profile, anomalies, correlations, sample_rows)

        # Merge AI insights with rule-based ones
        all_insights = insights + ai_result.get("ai_insights", [])

        return {
            "success": True,
            "summary": summary,
            "columns": columns_profile,
            "anomalies": anomalies,
            "correlations": correlations,
            "insights": all_insights,
            "ai_summary": ai_result.get("ai_summary", ""),
        }

    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }
