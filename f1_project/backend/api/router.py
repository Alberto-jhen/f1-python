from fastapi import APIRouter

from api.routes import graphics, laps, drivers, standings, schedule, contact, replay, h2h

router = APIRouter()

router.include_router(graphics.router)
router.include_router(laps.router)
router.include_router(drivers.router)
router.include_router(standings.router)
router.include_router(schedule.router)
router.include_router(contact.router)
router.include_router(replay.router)
router.include_router(h2h.router)
