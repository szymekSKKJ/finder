import "./ProfileSettings.scss";
import signOutUser from "../../../../custom/firebase/user/signOutUser";
import { useContext, useRef } from "react";
import { CurrentUserStateContext, SetIsLoadingContext } from "../../App";
import Button from "../../../Global/Button/Button";
import ComponentsTransition from "react-components-transition/ComponentsTransition";
import ReportBug from "./ReportBug/ReportBug";

const ProfileSettings = () => {
  const [, setCurrentUserData] = useContext(CurrentUserStateContext);
  const setIsLoading = useContext(SetIsLoadingContext);

  const profileSettingsElementRef = useRef<null | HTMLDivElement>(null);

  const options = [
    {
      title: "Ustawienia profilu",
      faClassName: "fa-regular fa-user",
      show: "",
      callback: null,
    },
    {
      title: "Zablokowani użytkownicy",
      faClassName: "fa-regular fa-lock-keyhole",
      show: "",
      callback: null,
    },
    {
      title: "Zweryfikuj profil",
      faClassName: "fa-light fa-circle-check",
      show: "",
      callback: null,
    },
    {
      title: "Zgłoś błąd",
      faClassName: "fa-thin fa-bug",
      show: "ReportBug",
      callback: null,
    },
    {
      title: "Wyloguj się",
      faClassName: "fa-regular fa-right-from-bracket",
      show: "",
      callback: async () => {
        setIsLoading(true);
        await signOutUser(setCurrentUserData);
        setIsLoading(false);
      },
    },
  ];

  return (
    <div className="profile-settings-wrapper">
      <div className="profile-settings" ref={profileSettingsElementRef}>
        <ComponentsTransition parentElementRef={profileSettingsElementRef}>
          <div className="main" key="Main">
            {options.map((option) => {
              const { title, faClassName, callback, show } = option;
              return (
                <Button
                  show={show}
                  animationIn={{ className: "animation-in", duration: 500 }}
                  animationOut={{ className: "animation-out", duration: 500 }}
                  className="option"
                  key={title}
                  onClick={() => callback && callback()}>
                  <p>{title}</p>
                  <span>
                    <i className={faClassName}></i>
                  </span>
                </Button>
              );
            })}
          </div>
          <ReportBug key="ReportBug"></ReportBug>
        </ComponentsTransition>
      </div>
    </div>
  );
};

export default ProfileSettings;
