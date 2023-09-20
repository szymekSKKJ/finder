import { Dispatch, SetStateAction } from "react";
import "./Start.scss";
import Button from "../../../../Global/Button/Button";

const Start = ({ setStatusStage }: { setStatusStage: Dispatch<SetStateAction<number>> }) => {
  return (
    <div className="start">
      <h1>Cześć</h1>
      <p>Jest nam niezmiernie miło, że chcesz stać się częścią społeczeności naszej aplikacji</p>
      <p>Zależy nam aby wszyscy użytkownicy czuli jak największy komfort, dlatego chcemy abyś przeszedł krótki kreator swojego profilu</p>
      <p>Klikając belkę u góry, możesz wrócić do poprzdniej opcji</p>
      <p>Klikając przycisk "dalej", zgadzasz się z regulaminem</p>
      <Button
        isValid={true}
        show={"ChooseGender"}
        animationIn={{ className: "animationIn", duration: 500 }}
        animationOut={{ className: "animationOut", duration: 500 }}
        onClick={() => {
          setStatusStage((currentValue) => (currentValue === 1 ? currentValue + 1 : currentValue));
        }}>
        Dalej
      </Button>
    </div>
  );
};

export default Start;
