import { useContext, useEffect, useRef, useState } from "react";
import "./DisplayImages.scss";
import { SetImagesToDisplayContext } from "../Home";
import Button from "../../../Global/Button/Button";

const DisplayImages = ({ imagesToDisplay }: { imagesToDisplay: string[] }) => {
  const setImagesToDisplay = useContext(SetImagesToDisplayContext);

  const [currentImage, setCurrentImage] = useState(0);
  const [firstTouch, setFirstTouch] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const miniaturesElementRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (miniaturesElementRef.current && miniaturesElementRef.current.firstChild) {
      const miniatureElement = miniaturesElementRef.current.firstChild as HTMLDivElement;
      const { width: miniaturesElementWidth } = miniaturesElementRef.current.getBoundingClientRect();
      const { width: miniatureElementWidth } = miniatureElement.getBoundingClientRect();
      const displayFlexGap = 10;

      miniaturesElementRef.current?.scrollTo({
        top: 0,
        left: (miniatureElementWidth + displayFlexGap) * currentImage - (miniaturesElementWidth - (miniatureElementWidth + displayFlexGap * 4) / 2) / 2,
        behavior: "smooth",
      });
    }
  }, [currentImage]);

  return (
    <div
      className="display-images"
      onTouchMove={(event) => {
        const touch = event.touches[0];
        const { clientX } = touch;

        if (firstTouch === null && isMoving === false) {
          setFirstTouch(clientX);
        }
        if (firstTouch) {
          if (clientX - firstTouch > 50) {
            setFirstTouch(null);
            setIsMoving(true);
            setTimeout(() => {
              setIsMoving(false);
            }, 250); // Animation time

            setCurrentImage((currentValue) => (currentValue > 0 ? currentValue - 1 : currentValue));
          }

          if (firstTouch - clientX > 50) {
            setFirstTouch(null);
            setIsMoving(true);
            setTimeout(() => {
              setIsMoving(false);
            }, 250); // Animation time

            setCurrentImage((currentValue) => (currentValue < imagesToDisplay.length - 1 ? currentValue + 1 : currentValue));
          }
        }
      }}>
      <Button
        className="close"
        onClick={() => {
          setImagesToDisplay([]);
          setCurrentImage(0);
        }}>
        <i className="fa-sharp fa-regular fa-xmark"></i>
      </Button>
      <button
        className="backwards"
        onClick={() => {
          setCurrentImage((currentValue) => (currentValue > 0 ? currentValue - 1 : currentValue));
        }}>
        <i className="fa-thin fa-chevron-left"></i>
      </button>
      <div className="images-wrapper">
        <div className="images" style={{ transform: `translateX(-${currentImage * 100}%)` }}>
          {imagesToDisplay.map((image, index) => {
            return (
              <div className="image" key={index}>
                <img src={image}></img>
              </div>
            );
          })}
        </div>
      </div>
      <button
        className="forwards"
        onClick={() => {
          setCurrentImage((currentValue) => (currentValue < imagesToDisplay.length - 1 ? currentValue + 1 : currentValue));
        }}>
        <i className="fa-thin fa-chevron-right"></i>
      </button>
      <div className="miniatures" ref={miniaturesElementRef}>
        {imagesToDisplay.map((image, index) => {
          return (
            <div className={`miniature ${currentImage === index ? "choosen" : ""}`} key={index}>
              <img src={image}></img>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DisplayImages;
