import { getAmapConfig } from '../constants/defaults';

// A hardcoded API Key for Amap Web Service. 
// Note: This should ideally be a Web Service API Key from Amap Open Platform.
const AMAP_WEB_KEY = getAmapConfig();

/**
 * Helper to fetch Amap endpoints
 */
const fetchAmap = async (endpoint, params) => {
  const query = new URLSearchParams({
    key: AMAP_WEB_KEY,
    ...params,
  }).toString();

  const url = `https://restapi.amap.com/v3/place/${endpoint}?${query}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === '1') {
      return data.pois || [];
    }
    throw new Error(data.info || '高德API请求失败');
  } catch (error) {
    console.error('Amap API Error:', error);
    throw error;
  }
};

/**
 * 搜索周边的商铺 (主要限制为餐饮、购物、生活服务类)
 * @param {number} longitude 
 * @param {number} latitude 
 * @returns Array of POIs
 */
export const searchAround = async (longitude, latitude) => {
  return fetchAmap('around', {
    location: `${longitude},${latitude}`,
    radius: 2000, // 2公里以内
    // types: 050000(餐饮) | 060000(购物) | 070000(生活服务) | 080000(体育休闲) | 090000(医疗保健) | 100000(住宿)
    types: '050000|060000|070000|080000|090000|100000',
    offset: 20,
    page: 1,
  });
};

/**
 * 关键字搜索商铺
 * @param {string} keywords 
 * @param {string} city (Optional) 限制城市
 * @returns Array of POIs
 */
export const searchText = async (keywords, city = '') => {
  const params = {
    keywords,
    offset: 20,
    page: 1,
    types: '050000|060000|070000|080000|090000|100000',
  };
  if (city) {
    params.city = city;
  }
  return fetchAmap('text', params);
};

/**
 * 模糊搜索联想输入提示
 * @param {string} keywords 
 * @param {number} longitude (Optional)
 * @param {number} latitude (Optional)
 * @returns Array of POIs
 */
export const getTips = async (keywords, longitude, latitude) => {
  const params = {
    keywords,
    datatype: 'poi' // 只返回POI类型，不返回公交站等
  };
  if (longitude && latitude) {
    params.location = `${longitude},${latitude}`;
  }
  // 注意：输入提示的 endpoint 是 ../assistant/inputtips 而不是 ../place/
  const query = new URLSearchParams({
    key: AMAP_WEB_KEY,
    ...params,
  }).toString();

  const url = `https://restapi.amap.com/v3/assistant/inputtips?${query}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === '1') {
      return data.tips || [];
    }
    throw new Error(data.info || '高德API请求失败');
  } catch (error) {
    console.error('Amap API Error:', error);
    throw error;
  }
};

