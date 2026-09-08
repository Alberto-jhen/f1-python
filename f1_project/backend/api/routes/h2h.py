import asyncio
import threading

from fastapi import APIRouter, HTTPException, Request
from starlette.concurrency import run_in_threadpool
import services.h2h_service as h2h_service
from core.schemas import H2HResponse

router = APIRouter()


@router.get("/data/h2h/{year}/{driver1}/{driver2}", tags=["H2H"], response_model=H2HResponse)
async def get_h2h(year: int, driver1: str, driver2: str, request: Request):
    cancel_event = threading.Event()

    async def monitor_disconnect():
        while not cancel_event.is_set():
            try:
                if await request.is_disconnected():
                    cancel_event.set()
                    break
            except Exception:
                break
            await asyncio.sleep(0.5)

    monitor_task = asyncio.create_task(monitor_disconnect())
    try:
        data = await run_in_threadpool(
            h2h_service.get_h2h_data,
            year,
            driver1.upper(),
            driver2.upper(),
            cancel_event,
        )
    except h2h_service.RequestCancelledError:
        raise HTTPException(status_code=499, detail="Client closed request")
    finally:
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass

    if "error" in data:
        raise HTTPException(status_code=400, detail=data["error"])
    return data
