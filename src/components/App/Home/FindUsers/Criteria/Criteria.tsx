import { Dispatch, SetStateAction, useEffect, useState } from "react";
import "./Criteria.scss";
import InputRange from "./InputRange/InputRange";
import skillsData from "../../../../../skills";
import Button from "../../../../Global/Button/Button";
import useLocalStorage from "../../../../../customHooks/useLocalStorage";

const Criteria = ({
  setFoundUsers,
}: {
  setFoundUsers: Dispatch<
    SetStateAction<
      | {
          name: string;
          followers: number;
          description: string;
          id: string;
          stars: number;
          age: number;
        }[]
      | null
    >
  >;
}) => {
  const [criteriaSettings, setCriteriaSettings] = useLocalStorage<{
    gender: string[];
    skills: number[];
    endAge: number;
    startAge: number;
  }>(
    {
      startAge: 15,
      endAge: 100,
      skills: [],
      gender: [],
    },
    "criteriaSettings"
  );

  const [startRangeStep, setStartRangeStep] = useState(criteriaSettings.startAge);
  const [endRangeStep, setEndRangeStep] = useState(criteriaSettings.endAge);
  const [choosenSkills, setChoosenSkills] = useState<number[]>(criteriaSettings.skills);
  const [choosenGender, setChoosenGender] = useState<string[]>(criteriaSettings.gender);

  useEffect(() => {
    const criteriaData = {
      startAge: startRangeStep,
      endAge: endRangeStep,
      skills: choosenSkills,
      gender: choosenGender,
    };

    setCriteriaSettings(criteriaData);
  }, [startRangeStep, endRangeStep, choosenSkills, choosenGender]);

  return (
    <div className="criteria">
      <div className="header">
        <Button
          className="back"
          show="wrapper"
          animationIn={{ className: "animation-in", duration: 500 }}
          animationOut={{ className: "animation-out", duration: 500 }}
          onClick={() => setFoundUsers(null)}>
          <i className="fa-solid fa-chevron-left"></i>
        </Button>
      </div>
      <div className="content">
        <p>Wiek</p>
        <div className="select-age">
          <InputRange
            minRange={15}
            maxRange={100}
            endRangeStep={endRangeStep}
            startRangeStep={startRangeStep}
            setStartRangeStep={setStartRangeStep}
            setEndRangeStep={setEndRangeStep}></InputRange>
        </div>
        <p>Płeć</p>
        <div className="select-gender">
          <div
            className={`gender man ${choosenGender.includes("men") ? "choosen" : ""}`}
            onClick={() =>
              setChoosenGender((currentValue) => {
                const copiedCurrentValue = [...currentValue];

                const indexOfMen = copiedCurrentValue.indexOf("men");

                copiedCurrentValue.includes("men") ? copiedCurrentValue.splice(indexOfMen, 1) : copiedCurrentValue.push("men");

                return copiedCurrentValue;
              })
            }>
            <i className="fa-solid fa-mars"></i>
            <p>Mężczyzna</p>
          </div>
          <div
            className={`gender woman ${choosenGender.includes("women") ? "choosen" : ""}`}
            onClick={() =>
              setChoosenGender((currentValue) => {
                const copiedCurrentValue = [...currentValue];

                const indexOfMen = copiedCurrentValue.indexOf("women");

                copiedCurrentValue.includes("women") ? copiedCurrentValue.splice(indexOfMen, 1) : copiedCurrentValue.push("women");

                return copiedCurrentValue;
              })
            }>
            <i className="fa-solid fa-venus"></i>
            <p>Kobieta</p>
          </div>
        </div>
        <p>Zainteresowania</p>
        <div className="select-skills">
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
      </div>
    </div>
  );
};

export default Criteria;
