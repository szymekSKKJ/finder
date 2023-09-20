import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import "./InputRange.scss";

const InputRange = ({
  endRangeStep,
  startRangeStep,
  maxRange,
  minRange,
  setStartRangeStep,
  setEndRangeStep,
}: {
  endRangeStep: number;
  startRangeStep: number;
  maxRange: number;
  minRange: number;
  setStartRangeStep: Dispatch<SetStateAction<number>>;
  setEndRangeStep: Dispatch<SetStateAction<number>>;
}) => {
  const [isSettingStartRange, setIsSettingStartRange] = useState(false);
  const [isSettingEndRange, setIsSettingEndRange] = useState(false);
  const [zIndexOfStartRange, setZIndexOfStartRange] = useState(1);
  const [zIndexOfLastRange, setZIndexOfLstRange] = useState(2);

  const startRangeStepOffest = ((startRangeStep - minRange) / (maxRange - minRange)) * 100;

  const endRangeStepOffest = ((endRangeStep - minRange) / (maxRange - minRange)) * 100;

  const inputRangeElementRef = useRef<HTMLDivElement | null>(null);

  const inputSelectedRangeWidth = 100 - startRangeStepOffest - (100 - maxRange - endRangeStepOffest) - 100;

  useEffect(() => {
    const setDefaultValues = () => {
      setIsSettingStartRange(false);
      setIsSettingEndRange(false);
    };

    window.addEventListener("mouseup", setDefaultValues);

    return () => {
      window.removeEventListener("mouseup", setDefaultValues);
    };
  }, []);

  return (
    <div
      className="input-range"
      ref={inputRangeElementRef}
      onTouchMove={(event) => {
        if (inputRangeElementRef.current) {
          const { left, width } = inputRangeElementRef.current.getBoundingClientRect();
          const { clientX } = event.changedTouches[0];
          const stepWidth = width / (maxRange - minRange);
          const currentStep = Math.round((clientX - left) / stepWidth) + minRange;

          if (isSettingStartRange) {
            if (currentStep >= minRange && currentStep <= maxRange && currentStep < endRangeStep) {
              setStartRangeStep(currentStep);
            }
          }

          if (isSettingEndRange) {
            if (currentStep >= minRange && currentStep <= maxRange && currentStep > startRangeStep) {
              setEndRangeStep(currentStep);
            }
          }
        }
      }}
      onMouseMove={(event) => {
        if (inputRangeElementRef.current) {
          const { left, width } = inputRangeElementRef.current.getBoundingClientRect();
          const { clientX } = event;
          const stepWidth = width / (maxRange - minRange);
          const currentStep = Math.round((clientX - left) / stepWidth) + minRange;

          if (isSettingStartRange) {
            if (currentStep >= minRange && currentStep <= maxRange && currentStep < endRangeStep) {
              setStartRangeStep(currentStep);
            }
          }

          if (isSettingEndRange) {
            if (currentStep >= minRange && currentStep <= maxRange && currentStep > startRangeStep) {
              setEndRangeStep(currentStep);
            }
          }
        }
      }}>
      <div
        className="start-range"
        data-start-range={startRangeStep}
        onTouchStart={() => {
          setIsSettingStartRange(true);
          setZIndexOfStartRange(zIndexOfLastRange + 1);
        }}
        onTouchEnd={() => setIsSettingStartRange(false)}
        onMouseDown={() => {
          setIsSettingStartRange(true);
          setZIndexOfStartRange(zIndexOfLastRange + 1);
        }}
        onMouseUp={() => {
          setIsSettingStartRange(false);
        }}
        style={{ left: `${startRangeStepOffest}%`, zIndex: zIndexOfStartRange }}></div>
      <div
        className="selected-range"
        style={{
          left: `${startRangeStepOffest}%`,
          width: `${inputSelectedRangeWidth}%`,
        }}></div>
      <div
        className="end-range"
        data-end-range={endRangeStep}
        onTouchStart={() => {
          setIsSettingEndRange(true);
          setZIndexOfLstRange(zIndexOfStartRange + 1);
        }}
        onMouseDown={() => {
          setIsSettingEndRange(true);
          setZIndexOfLstRange(zIndexOfStartRange + 1);
        }}
        onTouchEnd={() => setIsSettingEndRange(false)}
        onMouseUp={() => {
          setIsSettingEndRange(false);
        }}
        style={{ left: `${endRangeStepOffest}%`, zIndex: zIndexOfLastRange }}></div>
    </div>
  );
};

export default InputRange;
