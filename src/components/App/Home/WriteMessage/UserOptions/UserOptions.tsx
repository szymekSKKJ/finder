import { Dispatch, SetStateAction, useRef, useState } from "react";
import "./UserOptions.scss";
import { currentUserNotNullType } from "../../../../../types";
import ComponentsTransition, { TransitionChildStatic } from "react-components-transition/ComponentsTransition";
import Button from "../../../../Global/Button/Button";

interface userOptionsProps {
  setAreUserOptionsOpen: Dispatch<SetStateAction<boolean>>;
  areUserOptionsOpen: boolean;
  activeUserData: currentUserNotNullType | null;
}

const UserOptions = ({ setAreUserOptionsOpen, areUserOptionsOpen, activeUserData }: userOptionsProps) => {
  const [lastClosedOption, setLastClosedOption] = useState<null | string>(null);

  const userOptionsElementRef = useRef<null | HTMLDivElement>(null);
  const headerWrapperElementRef = useRef<null | HTMLDivElement>(null);

  return (
    <div className={`user-options ${areUserOptionsOpen ? "open" : ""}`} ref={userOptionsElementRef}>
      {activeUserData && (
        <>
          <div className="header" ref={headerWrapperElementRef}></div>
          <ComponentsTransition parentElementRef={userOptionsElementRef} firstVisible={"Main"}>
            <TransitionChildStatic renderToRef={headerWrapperElementRef}>
              <Button
                show={lastClosedOption ? lastClosedOption : ""}
                className="back"
                onClick={() => {
                  if (lastClosedOption === null) {
                    setAreUserOptionsOpen(false);
                  } else {
                    setLastClosedOption(null);
                  }
                }}>
                <i className="fa-solid fa-chevron-left"></i>
              </Button>
            </TransitionChildStatic>
            <div className="main" key="Main">
              <div className="profile-image">
                <img src={activeUserData.profileImage}></img>
              </div>
              <p className="username">{activeUserData.name}</p>
              <div className="options">
                <Button show="Theme" className="option" onClick={() => setLastClosedOption("Main")}>
                  <span>Motyw</span> <i className="fa-regular fa-palette"></i>
                </Button>
                <button className="option">
                  <span>Zdjęcia</span> <i className="fa-regular fa-image"></i>
                </button>
                <button className="option">
                  <span>Szukaj</span> <i className="fa-solid fa-magnifying-glass"></i>
                </button>
                <button className="option">
                  <span>Zablokuj</span> <i className="fa-regular fa-lock-keyhole"></i>
                </button>
              </div>
            </div>
            <div className="theme" key="Theme">
              <p>123</p>
            </div>
          </ComponentsTransition>
        </>
      )}
    </div>
  );
};
export default UserOptions;
