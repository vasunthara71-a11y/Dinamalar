let _cache = null;

export const setDataCache = (data) => {
  _cache = data;
};

export const getDataCache = () => _cache;

export const clearDataCache = () => {
  _cache = null;
};
