import fastf1
import os

CACHE_DIR = 'cache_fastf1'
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)

fastf1.Cache.enable_cache(CACHE_DIR)