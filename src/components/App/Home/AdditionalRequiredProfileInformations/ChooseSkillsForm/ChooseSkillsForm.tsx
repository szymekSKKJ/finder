import { Dispatch, SetStateAction, useContext, useState } from "react";
import "./ChooseSkillsForm.scss";
import Button from "../../../../Global/Button/Button";
import { currentUserType } from "../../../../../types";
import skillsData from "../../../../../skills";
import { CurrentUserStateContext } from "../../../App";

const ChooseSkillsForm = ({ setStatusStage }: { setStatusStage: Dispatch<SetStateAction<number>> }) => {
  const [, setCurrentUserData] = useContext(CurrentUserStateContext);

  const [choosenSkills, setChoosenSkills] = useState<number[]>([]);

  const isButtonValid = choosenSkills.length > 0;

  return (
    <div className="choose-skills-form">
      <h1>Zainteresowania</h1>
      <p>Znacząco pomaga to znajdywanie odpowiednych użytkowników</p>
      <div className="content-wrapper">
        <div className="skills">
          {skillsData.map((skill) => {
            const { name, iconClass, id } = skill;

            const isThisSkillChoosen = choosenSkills.find((choosenSkill) => choosenSkill === id);

            return (
              <div
                key={name}
                className={`skill ${isThisSkillChoosen ? "choosen" : ""}`}
                onClick={() => {
                  setChoosenSkills((currentValues) => {
                    const copiedCurrentValues = [...currentValues];

                    if (isThisSkillChoosen) {
                      const index = copiedCurrentValues.findIndex((skillId) => skillId === id);

                      copiedCurrentValues.splice(index, 1);
                    } else {
                      copiedCurrentValues.push(id);
                    }

                    return copiedCurrentValues;
                  });
                }}>
                <i className={iconClass}></i>
                <p>{name}</p>
              </div>
            );
          })}
        </div>
        <Button
          isValid={isButtonValid}
          show={isButtonValid ? "DescriptionMyself" : "ChooseSkillsForm"}
          animationIn={{ className: "animationIn", duration: 500 }}
          animationOut={{ className: "animationOut", duration: 500 }}
          onClick={() => {
            if (isButtonValid) {
              setStatusStage((currentValue) => (currentValue === 5 ? currentValue + 1 : currentValue));
              setCurrentUserData((currentValue: currentUserType) => {
                const coppiedCurrentValue = { ...currentValue };

                coppiedCurrentValue.skills = choosenSkills;
                return coppiedCurrentValue;
              });
            }
          }}>
          Dalej
        </Button>
      </div>
    </div>
  );
};

export default ChooseSkillsForm;
