import math
import random
from typing import Tuple


EARTH_RADIUS_M = 6_371_000


def offset_coordinates(lat: float, lng: float,
                        min_meters: int = 100,
                        max_meters: int = 200) -> Tuple[float, float]:
    """
    Return a masked (lat, lng) offset randomly by min_meters–max_meters
    in a random direction.  Used to hide the exact parking location before
    a booking is confirmed.
    """
    distance = random.uniform(min_meters, max_meters)
    bearing  = random.uniform(0, 2 * math.pi)   # random direction

    lat_r = math.radians(lat)
    lng_r = math.radians(lng)
    d_r   = distance / EARTH_RADIUS_M

    new_lat_r = math.asin(
        math.sin(lat_r) * math.cos(d_r) +
        math.cos(lat_r) * math.sin(d_r) * math.cos(bearing)
    )
    new_lng_r = lng_r + math.atan2(
        math.sin(bearing) * math.sin(d_r) * math.cos(lat_r),
        math.cos(d_r) - math.sin(lat_r) * math.sin(new_lat_r),
    )

    return round(math.degrees(new_lat_r), 7), round(math.degrees(new_lng_r), 7)


def haversine_distance(lat1: float, lng1: float,
                        lat2: float, lng2: float) -> float:
    """Return distance in metres between two WGS-84 coordinates."""
    lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def wkb_to_coords(wkb_element) -> Tuple[float, float]:
    """Convert a GeoAlchemy2 WKBElement to (lat, lng)."""
    from shapely import wkb
    point = wkb.loads(bytes(wkb_element.data))
    return point.y, point.x   # (lat, lng)
