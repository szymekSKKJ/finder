let indexId = 1;
const cacheStorage: { id: number; key: string; data: { id: string; value: any }[] }[] = [];

const createCache = (key: string) => {
  const doesThisCacheExist = cacheStorage.some((cache) => cache.key === key);

  if (doesThisCacheExist) {
    console.error("Cache with given 'key' exist");
  } else {
    cacheStorage.push({ id: indexId, key: key, data: [] });
    indexId++;
  }
};

export { createCache };

const addCache = <T,>(key: string, data: { id: string; value: T }) => {
  const currentStorage = cacheStorage.find((object) => object.key === key);

  if (currentStorage) {
    const doesDataWithGivenIdExist = currentStorage.data.find((dataLocal) => dataLocal.id === data.id);

    if (data.value != 0) {
      if (doesDataWithGivenIdExist) {
        doesDataWithGivenIdExist.value = data.value;
      } else {
        currentStorage.data.push({
          id: data.id,
          value: data.value,
        });
      }
    }
  } else {
    console.error("Storage does not exist");
  }
};

export { addCache };

const getCache = (key: string) => {
  const currentStorage = cacheStorage.find((object) => object.key === key);

  if (currentStorage) {
    return currentStorage.data;
  } else {
    console.error("Storage does not exist");
  }
};

export { getCache };
export default cacheStorage;
