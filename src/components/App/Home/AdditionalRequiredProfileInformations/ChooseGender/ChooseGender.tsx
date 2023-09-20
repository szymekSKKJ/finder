import { Dispatch, SetStateAction, useContext, useState } from "react";
import Button from "../../../../Global/Button/Button";
import "./ChooseGender.scss";
import { CurrentUserStateContext } from "../../../App";

const ChooseGender = ({ setStatusStage }: { setStatusStage: Dispatch<SetStateAction<number>> }) => {
  const [, setCurrentUserData] = useContext(CurrentUserStateContext);

  const [choosenGender, setChoosenGender] = useState<string>("");

  return (
    <div className="choose-gender">
      <h1>Płeć</h1>
      <p>Potrzebujemy jej, abyśmy mogli innym użytkownikom Cię przedstawić</p>
      <div className="content-wrapper">
        <div className="select-gender">
          <div className={`gender man ${choosenGender === "men" ? "choosen" : ""}`} onClick={() => setChoosenGender("men")}>
            <i className="fa-solid fa-mars"></i>
            <p>Mężczyzna</p>
          </div>
          <div className={`gender woman ${choosenGender === "women" ? "choosen" : ""}`} onClick={() => setChoosenGender("women")}>
            <i className="fa-solid fa-venus"></i>
            <p>Kobieta</p>
          </div>
        </div>
        <Button
          isValid={choosenGender !== ""}
          show={"DateOfBirthdayForm"}
          animationIn={{ className: "animationIn", duration: 500 }}
          animationOut={{ className: "animationOut", duration: 500 }}
          onClick={() => {
            setStatusStage((currentValue) => (currentValue === 2 ? currentValue + 1 : currentValue));
            setCurrentUserData((currentValue) => {
              const coppiedCurrentValue = { ...currentValue };

              coppiedCurrentValue.gender = choosenGender;

              return coppiedCurrentValue;
            });
          }}>
          Dalej
        </Button>
      </div>
    </div>
  );
};

export default ChooseGender;
