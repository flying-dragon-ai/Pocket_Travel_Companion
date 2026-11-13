/**
 * GPS 距离计算（Haversine）：
 * 用于打卡 500 米范围校验，严格遵循 .dev.rule。
 */
export function calculateDistanceMeter(lat1, lng1, lat2, lng2) {
  const earthRadius = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadius * c
}

export function checkGpsWithin500Meter(distanceMeter) {
  return distanceMeter <= 500
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}
