import { useEffect, useState } from "react";
import "./Loading.scss";

const Loading = ({ isLoading }: { isLoading: boolean }) => {
  const [isLoadingLocal, setIsLoadingLocal] = useState(true);

  useEffect(() => {
    if (isLoading === false) {
      // Transition timeout + offest
      setTimeout(() => {
        setIsLoadingLocal(isLoading);
      }, 500);
    } else {
      // Wont delay apearing loading element so without timeout
      setIsLoadingLocal(isLoading);
    }
  }, [isLoading]);

  return (
    <>
      {isLoadingLocal && (
        <div className={`loading ${isLoading ? "apearing" : "hiding"}`}>
          <span className="loader"></span>
        </div>
      )}
    </>
  );
};

export default Loading;
