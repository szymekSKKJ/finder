import { Dispatch, MutableRefObject, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import "./MainNavigation.scss";
import { CurrentUserStateContext } from "../../App";
import { currentUserNotNullType } from "../../../../types";
import Button from "../../../Global/Button/Button";
import { SetSharingPostContext } from "../Home";
import { Unsubscribe, collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../../firebaseInitialization";

const setChoosneButton = (
  setNavigation: Dispatch<
    SetStateAction<
      {
        id: number;
        className: string;
        isChoosen: boolean;
        iconClassName: string | null;
        show: string;
        animationIn: { className: string; duration: number };
        animationOut: { className: string; duration: number };
      }[]
    >
  >,
  idButton: number
) => {
  setNavigation((currentValues) => {
    const copiedCurrentValues = [...currentValues];

    copiedCurrentValues.forEach((buttonObject) => {
      if (buttonObject.id === idButton) {
        buttonObject.isChoosen = true;
      } else {
        buttonObject.isChoosen = false;
      }
    });

    return copiedCurrentValues;
  });
};

const listenForMessages = (
  unsubForReceivedLastMessages: MutableRefObject<Unsubscribe | null>,
  currentUserId: string,
  setNotReadMessages: Dispatch<SetStateAction<number>>
) => {
  let notReadMessages = 0;

  const unsubscribe = onSnapshot(
    query(collection(db, "users", currentUserId, "receivedLastMessages"), orderBy("sentAt", "desc"), limit(20)),
    (querySnapshot) => {
      notReadMessages = 0;
      querySnapshot.forEach((doc) => {
        const { isRead } = doc.data();

        isRead === false && notReadMessages++;
      });

      setNotReadMessages(notReadMessages);
    }
  );

  unsubForReceivedLastMessages.current = unsubscribe;
};

const listenForNotifications = (
  unsubForNotifications: MutableRefObject<Unsubscribe | null>,
  currentUserId: string,
  setNotReadNotifications: Dispatch<SetStateAction<number>>
) => {
  let notReadNotifications = 0;

  const unsubscribe = onSnapshot(query(collection(db, "users", currentUserId, "notifications"), orderBy("uploadedAt", "desc"), limit(20)), (querySnapshot) => {
    notReadNotifications = 0;
    querySnapshot.forEach((doc) => {
      const { isRead } = doc.data();

      isRead === false && notReadNotifications++;
    });

    setNotReadNotifications(notReadNotifications);
  });

  unsubForNotifications.current = unsubscribe;
};

const MainNavigation = ({ getActiveUserData }: { getActiveUserData: (userId: string) => void }) => {
  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);
  const setSharingPost = useContext(SetSharingPostContext);

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;
  const [navigation, setNavigation] = useState<
    {
      id: number;
      className: string;
      isChoosen: boolean;
      iconClassName: string | null;
      show: string;
      animationIn: { className: string; duration: number };
      animationOut: { className: string; duration: number };
    }[]
  >([
    {
      id: 1,
      className: "News-button",
      isChoosen: false,
      iconClassName: "fa-regular fa-bars",
      show: "News",
      animationIn: { className: "animation-in", duration: 500 },
      animationOut: { className: "animation-out", duration: 500 },
    },
    {
      id: 2,
      className: "Notifications-button",
      isChoosen: false,
      iconClassName: "fa-regular fa-bell",
      show: "Notifications",
      animationIn: { className: "animation-in", duration: 500 },
      animationOut: { className: "animation-out", duration: 500 },
    },
    {
      id: 3,
      className: "FindUsers-button",
      isChoosen: false,
      iconClassName: "fa-solid fa-magnifying-glass",
      show: "FindUsers",
      animationIn: { className: "animation-in", duration: 500 },
      animationOut: { className: "animation-out", duration: 500 },
    },
    {
      id: 4,
      className: "LastMessages-button",
      isChoosen: false,
      iconClassName: "fa-regular fa-messages",
      show: "LastMessages",
      animationIn: { className: "animation-in", duration: 500 },
      animationOut: { className: "animation-out", duration: 500 },
    },
    {
      id: 5,
      className: "UserProfile-button",
      isChoosen: true,
      iconClassName: null,
      show: "UserProfile",
      animationIn: { className: "animation-in", duration: 500 },
      animationOut: { className: "animation-out", duration: 500 },
    },
  ]);

  const [notReadMessages, setNotReadMessages] = useState(0);
  const [notReadNotifications, setNotReadNotifications] = useState(0);

  const unsubForReceivedLastMessages = useRef<Unsubscribe | null>(null);
  const unsubForNotifications = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (currentUserData.id) {
      listenForMessages(unsubForReceivedLastMessages, currentUserData.id, setNotReadMessages);

      return () => {
        unsubForReceivedLastMessages.current && unsubForReceivedLastMessages.current();
      };
    }
  }, [currentUserData]);

  useEffect(() => {
    if (currentUserData.id) {
      listenForNotifications(unsubForNotifications, currentUserData.id, setNotReadNotifications);

      return () => {
        unsubForNotifications.current && unsubForNotifications.current();
      };
    }
  }, [currentUserData]);

  return (
    <div className="main-navigation">
      {currentUserData && (
        <>
          {navigation.map((button) => {
            const { className, isChoosen, iconClassName, id, show, animationIn, animationOut } = button;

            if (className === "LastMessages-button") {
              return notReadMessages !== 0 ? (
                <Button
                  show={show}
                  animationIn={animationIn}
                  animationOut={animationOut}
                  className={`${className} ${isChoosen ? "choosen" : ""} active-notification`}
                  key={id}
                  data-notification-number={notReadMessages}
                  onClick={() => {
                    setSharingPost(null);
                    setChoosneButton(setNavigation, id);
                  }}>
                  <i className={iconClassName!}></i>
                </Button>
              ) : (
                <Button
                  show={show}
                  animationIn={animationIn}
                  animationOut={animationOut}
                  className={`${className} ${isChoosen ? "choosen" : ""}`}
                  key={id}
                  onClick={() => {
                    setSharingPost(null);
                    setChoosneButton(setNavigation, id);
                  }}>
                  <i className={iconClassName!}></i>
                </Button>
              );
            } else if (className === "Notifications-button") {
              return notReadNotifications !== 0 ? (
                <Button
                  show={show}
                  animationIn={animationIn}
                  animationOut={animationOut}
                  className={`${className} ${isChoosen ? "choosen" : ""} active-notification`}
                  key={id}
                  data-notification-number={notReadNotifications}
                  onClick={() => {
                    setSharingPost(null);
                    setChoosneButton(setNavigation, id);
                  }}>
                  <i className={iconClassName!}></i>
                </Button>
              ) : (
                <Button
                  show={show}
                  animationIn={animationIn}
                  animationOut={animationOut}
                  className={`${className} ${isChoosen ? "choosen" : ""}`}
                  key={id}
                  onClick={() => {
                    setSharingPost(null);
                    setChoosneButton(setNavigation, id);
                  }}>
                  <i className={iconClassName!}></i>
                </Button>
              );
            } else {
              return (
                <Button
                  show={show}
                  animationIn={animationIn}
                  animationOut={animationOut}
                  className={`${className} ${isChoosen ? "choosen" : ""}`}
                  key={id}
                  onClick={() => {
                    setSharingPost(null);
                    setChoosneButton(setNavigation, id);
                    if (show === "UserProfile") {
                      getActiveUserData(currentUserData.id);
                    }
                  }}>
                  {iconClassName ? (
                    <i className={iconClassName}></i>
                  ) : (
                    <div className="profile-image">
                      <img src={currentUserData.profileImage}></img>
                    </div>
                  )}
                </Button>
              );
            }
          })}
        </>
      )}
    </div>
  );
};

export default MainNavigation;
