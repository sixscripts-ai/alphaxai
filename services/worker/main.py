import asyncio
import os
import asyncpg
import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from analysis import analyze_dataset

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("inventory-worker")

app = FastAPI(title="Inventory Worker & Analytics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/inventory_saas")

async def get_db_pool():
    return await asyncpg.create_pool(DATABASE_URL)

async def compute_daily_snapshots(pool):
    """Rebuilds daily inventory snapshots."""
    logger.info("Starting daily snapshot computation...")
    async with pool.acquire() as conn:
        try:
            complex_sql = """
            WITH daily_moves AS (
                SELECT 
                    org_id, location_id, item_id,
                    DATE(occurred_at) as day,
                    SUM(signed_quantity) as daily_change
                FROM inventory_movements
                GROUP BY 1, 2, 3, 4
            ),
            running_totals AS (
                SELECT 
                    org_id, location_id, item_id, day,
                    SUM(daily_change) OVER (PARTITION BY org_id, location_id, item_id ORDER BY day ASC) as on_hand
                FROM daily_moves
            )
            INSERT INTO inventory_snapshot_daily (org_id, location_id, item_id, day, on_hand, inventory_value)
            SELECT 
                rt.org_id, rt.location_id, rt.item_id, rt.day, rt.on_hand,
                (rt.on_hand * COALESCE(ic.unit_cost, 0))
            FROM running_totals rt
            LEFT JOIN item_costs ic ON rt.item_id = ic.item_id AND rt.location_id = ic.location_id
            ON CONFLICT (org_id, location_id, item_id, day) 
            DO UPDATE SET on_hand = EXCLUDED.on_hand, inventory_value = EXCLUDED.inventory_value;
            """
            await conn.execute(complex_sql)
            logger.info("Daily snapshots updated.")
        except Exception as e:
            logger.error(f"Error computing snapshots: {e}")

async def generate_forecasts(pool):
    """Generates demand forecasts."""
    logger.info("Starting forecast generation...")
    async with pool.acquire() as conn:
        try:
            rows = await conn.fetch("""
                SELECT item_id, location_id, org_id, DATE(occurred_at) as day, ABS(SUM(signed_quantity)) as usage
                FROM inventory_movements
                WHERE movement = 'CONSUME' OR (movement = 'TRANSFER_OUT')
                GROUP BY 1, 2, 3, 4
                ORDER BY day ASC
            """)
            
            if not rows: return

            df = pd.DataFrame(rows, columns=['item_id', 'location_id', 'org_id', 'day', 'usage'])
            df['day'] = pd.to_datetime(df['day'])
            df['day_ordinal'] = df['day'].apply(lambda x: x.toordinal())
            
            groups = df.groupby(['org_id', 'item_id', 'location_id'])
            forecast_inserts = []
            
            for (org_id, item_id, loc_id), group in groups:
                if len(group) < 3: continue
                
                X = group['day_ordinal'].values.reshape(-1, 1)
                y = group['usage'].values
                model = LinearRegression()
                model.fit(X, y)
                
                last_day = group['day'].max()
                future_dates = [last_day + timedelta(days=x) for x in range(1, 15)]
                future_ordinals = np.array([d.toordinal() for d in future_dates]).reshape(-1, 1)
                predictions = model.predict(future_ordinals)
                
                residuals = y - model.predict(X)
                std_resid = np.std(residuals)
                
                for date, pred in zip(future_dates, predictions):
                    val = max(0, float(pred))
                    lower = max(0, val - 1.96 * std_resid)
                    upper = val + 1.96 * std_resid
                    forecast_inserts.append((org_id, loc_id, item_id, 'ML', date.date(), val, lower, upper))
            
            if forecast_inserts:
                await conn.executemany("""
                    INSERT INTO forecasts_daily (org_id, location_id, item_id, model, day, yhat, yhat_lower, yhat_upper)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (org_id, location_id, item_id, model, day)
                    DO UPDATE SET yhat = EXCLUDED.yhat, yhat_lower = EXCLUDED.yhat_lower, yhat_upper = EXCLUDED.yhat_upper
                """, forecast_inserts)
                logger.info(f"Generated {len(forecast_inserts)} forecast points.")
        except Exception as e:
            logger.error(f"Error generating forecasts: {e}")

async def background_loop():
    await asyncio.sleep(5)
    try:
        pool = await get_db_pool()
        while True:
            await compute_daily_snapshots(pool)
            await generate_forecasts(pool)
            logger.info("Cycle complete. Sleeping...")
            await asyncio.sleep(300)
    except Exception as e:
        logger.error(f"Fatal background loop error: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(background_loop())

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "worker"}

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    content = await file.read()
    result = analyze_dataset(content, file.filename)
    return result

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
