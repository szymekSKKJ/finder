import { Dispatch, SetStateAction, useEffect, useState } from "react";

const useWatchStorage = (key: string) => {
  const dataJSON = localStorage.getItem(key);
  const data = dataJSON ? JSON.parse(dataJSON) : null;

  data === null && console.error("Data does not exist with given key");

  const [state, setState] = useState(data);

  useEffect(() => {
    const handleStorageEvent = (event: Event) => {
      //@ts-ignore
      if (event.key === key) {
        const newDataJSON = localStorage.getItem(key)!;
        const newData = JSON.parse(newDataJSON);

        setState(newData);
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  return [state];
};

export { useWatchStorage };

const useLocalStorage = <T,>(data: T, key: string): [data: T, setState: Dispatch<SetStateAction<T>>] => {
  const itemJSON = localStorage.getItem(key);
  const itemData = itemJSON ? JSON.parse(itemJSON) : null;

  const [state, setState] = useState(itemData ? itemData : data);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));

    const storageEvent = new StorageEvent("storage", {
      key: "criteriaSettings",
    });

    window.dispatchEvent(storageEvent);
  }, [state]);

  return [state, setState];
};

export default useLocalStorage;
