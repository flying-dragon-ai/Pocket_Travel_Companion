/** 打卡 GPS 校验半径（米）。前后端必须一致：backend-api/src/utils/gps.js 同值。 */
export const GPS_RADIUS_METER = 500

export function isWithinDistance(distanceMeter: number, limitMeter = GPS_RADIUS_METER) {
  return distanceMeter <= limitMeter
}

/**
 * 计算两点直线距离（米）
 * 业务用途：打卡前做 GPS 500 米范围校验。
 * 算法：Haversine（球面距离），精度满足打卡范围判断。
 */
export function calculateDistanceMeter(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
) {
  const earthRadius = 6371000
  const lat1 = toRad(latitude1)
  const lat2 = toRad(latitude2)
  const deltaLat = toRad(latitude2 - latitude1)
  const deltaLon = toRad(longitude2 - longitude1)

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadius * c
}

function toRad(degree: number) {
  return (degree * Math.PI) / 180
}
