import asyncio
import os
import asyncpg
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inventory-worker")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/inventory_saas")

async def compute_daily_snapshots(pool):
    """
    Simulate computing daily snapshots.
    In a real app, this would aggregate inventory_movements.
    """
    logger.info("Starting daily snapshot computation...")
    async with pool.acquire() as conn:
        # Example: Refresh a materialized view or compute aggregations
        # For now, just a dummy query to show connectivity
        try:
            row = await conn.fetchrow("SELECT count(*) FROM inventory_movements")
            logger.info(f"Processed movements. Total count: {row['count']}")
            
            # Here we would insert into inventory_snapshot_daily
            # ...
            
        except Exception as e:
            logger.error(f"Error computing snapshots: {e}")

async def main():
    logger.info("Worker service started")
    
    # Wait for DB to be ready
    await asyncio.sleep(5) 
    
    try:
        pool = await asyncpg.create_pool(DATABASE_URL)
        logger.info("Connected to database")
        
        while True:
            await compute_daily_snapshots(pool)
            
            # Sleep for a bit (e.g., 1 minute for demo, 24h in prod)
            logger.info("Sleeping for 60 seconds...")
            await asyncio.sleep(60)
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        exit(1)

if __name__ == "__main__":
    asyncio.run(main())
