import { Dispatch, SetStateAction, useContext, useState } from "react";
import "./DescriptionMyself.scss";
import Button from "../../../../Global/Button/Button";
import { currentUserType } from "../../../../../types";
import { CurrentUserStateContext } from "../../../App";

const DescriptionMyself = ({ setStatusStage }: { setStatusStage: Dispatch<SetStateAction<number>> }) => {
  const [, setCurrentUserData] = useContext(CurrentUserStateContext);

  const [textareaValue, setTextareaValue] = useState("");

  return (
    <div className="description-myself">
      <h1>Opis</h1>
      <p>Uzupełnij swój profil o dodatkowe informcje</p>
      <p>(Możesz pozostawić puste)</p>
      <div className="content-wrapper">
        <span
          className={`textarea ${textareaValue ? "not-empty" : ""}`}
          role="textbox"
          contentEditable
          onInput={(event) => setTextareaValue(event.currentTarget.innerText.trim())}></span>
        <Button
          isValid={true}
          show={"BackgroundImageEditor"}
          animationIn={{ className: "animationIn", duration: 500 }}
          animationOut={{ className: "animationOut", duration: 500 }}
          onClick={() => {
            setStatusStage((currentValue) => (currentValue === 6 ? currentValue + 1 : currentValue));
            setCurrentUserData((currentValue: currentUserType) => {
              const coppiedCurrentValue = { ...currentValue };

              coppiedCurrentValue.description = textareaValue;

              return coppiedCurrentValue;
            });
          }}>
          Dalej
        </Button>
      </div>
    </div>
  );
};

export default DescriptionMyself;
