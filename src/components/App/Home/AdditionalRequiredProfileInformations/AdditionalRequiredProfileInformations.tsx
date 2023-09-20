import DateOfBirthdayForm from "./DateOfBirthdayForm/DateOfBirthdayForm";
import ImageEditorForm from "./ImageEditorForm/ImageEditorForm";
import "./AdditionalRequiredProfileInformations.scss";
import DescriptionMyself from "./DescriptionMyself/DescriptionMyself";
import ChooseSkillsForm from "./ChooseSkillsForm/ChooseSkillsForm";
import { useEffect, useRef, useState } from "react";
import ProfileSummary from "./ProfileSummary/ProfileSummary";
import Start from "./Start/Start";
import BackgroundImageEditor from "./BackgroundImageEditor/BackgroundImageEditor";
import ChooseGender from "./ChooseGender/ChooseGender";
import { TransitionButton } from "react-components-transition";
import ComponentsTransition, { TransitionChildStatic } from "react-components-transition/ComponentsTransition";

const AdditionalRequiredProfileInformations = () => {
  const [statusStage, setStatusStage] = useState(0);

  const additionalRequiredProfileInformationsRef = useRef<HTMLDivElement>(null);

  const statusBarElementRef = useRef<HTMLDivElement | null>(null);

  // Important order
  const componentsKeys = [
    "Start",
    "ChooseGender",
    "DateOfBirthdayForm",
    "ImageEditorForm",
    "ChooseSkillsForm",
    "DescriptionMyself",
    "BackgroundImageEditor",
    "ProfileSummary",
  ];

  useEffect(() => {
    setStatusStage(1);
  }, []);

  return (
    <div className="additional-required-profile-informations" ref={additionalRequiredProfileInformationsRef}>
      <div className="status-bar" ref={statusBarElementRef}></div>
      <ComponentsTransition firstVisible={"Start"} parentElementRef={additionalRequiredProfileInformationsRef}>
        <Start key="Start" setStatusStage={setStatusStage}></Start>
        <DateOfBirthdayForm key="DateOfBirthdayForm" setStatusStage={setStatusStage}></DateOfBirthdayForm>
        <ImageEditorForm key="ImageEditorForm" setStatusStage={setStatusStage}></ImageEditorForm>
        <ChooseSkillsForm key="ChooseSkillsForm" setStatusStage={setStatusStage}></ChooseSkillsForm>
        <DescriptionMyself key="DescriptionMyself" setStatusStage={setStatusStage}></DescriptionMyself>
        <BackgroundImageEditor key="BackgroundImageEditor" setStatusStage={setStatusStage}></BackgroundImageEditor>
        <ProfileSummary key="ProfileSummary"></ProfileSummary>
        <ChooseGender key="ChooseGender" setStatusStage={setStatusStage}></ChooseGender>
        <TransitionChildStatic renderToRef={statusBarElementRef}>
          <div className="menu">
            {componentsKeys.map((key, index) => {
              if (index < statusStage) {
                return (
                  <TransitionButton
                    key={key}
                    show={componentsKeys[index]}
                    className="line filled"
                    animationIn={{ className: "animationIn", duration: 500 }}
                    animationOut={{ className: "animationOut", duration: 500 }}></TransitionButton>
                );
              } else {
                return (
                  <TransitionButton
                    key={key}
                    show={""}
                    className="line"
                    animationIn={{ className: "animationIn", duration: 500 }}
                    animationOut={{ className: "animationOut", duration: 500 }}></TransitionButton>
                );
              }
            })}
          </div>
        </TransitionChildStatic>
      </ComponentsTransition>
    </div>
  );
};

export default AdditionalRequiredProfileInformations;
