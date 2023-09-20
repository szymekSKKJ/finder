import RegisterAndLoginForms from "./RegisterAndLoginForms/RegisterAndLoginForms";
import Home from "./Home/Home";
import { Dispatch, SetStateAction, createContext, useEffect, useRef, useState } from "react";
import { initializeFirebaseApp } from "../../firebaseInitialization";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseInitialization";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { currentUserType } from "../../types";
import loginUser from "../../custom/firebase/user/loginUser";
import Loading from "../Global/Loading/Loading";
import ComponentsTransition, { TransitionChildStatic } from "react-components-transition/ComponentsTransition";
import errorCodes from "../../custom/firebase/errorCodes";
import NotificationGlobal from "../Global/Notification/NotificationGlobal";
import Button from "../Global/Button/Button";
import { FirebaseError } from "firebase/app";

initializeFirebaseApp();

export const CurrentUserStateContext = createContext<[currentUserType, Dispatch<SetStateAction<currentUserType>>]>([
  {
    id: null,
    name: null,
    dateOfBirthday: null,
    profileImage: null,
    backgroundImage: null,
    skills: null,
    description: null,
    email: null,
    following: null,
    followers: null,
    lastActive: null,
    password: null,
    gender: null,
    stars: null,
    givenStarsTo: null,
    leftStars: null,
  },
  () => {
    return {
      id: null,
      name: null,
      dateOfBirthday: null,
      profileImage: null,
      backgroundImage: null,
      skills: null,
      description: null,
      email: null,
      following: null,
      followers: null,
      lastActive: null,
      password: null,
      gender: null,
      stars: null,
      givenStarsTo: null,
      leftStars: null,
    };
  },
]);

export const SetIsLoadingContext = createContext<Dispatch<SetStateAction<boolean>>>((value) => value);

export const CreateNotificationContext = createContext<(errorCode: string, isPositive?: boolean) => void>(() => null);

let isActivityIntervalActivated = false;

const setAcivityStatus = async (userId: string) => {
  if (isActivityIntervalActivated === false) {
    isActivityIntervalActivated = true;

    await updateDoc(doc(db, "users", userId), {
      lastActive: serverTimestamp(),
    });

    setInterval(async () => {
      await updateDoc(doc(db, "users", userId), {
        lastActive: serverTimestamp(),
      });
    }, 1000 * 120);
  }
};

const getUserData = async (currentUserId: string, currentUserEmail: string, setCurrentUserData: Dispatch<SetStateAction<currentUserType>>) => {
  onSnapshot(doc(db, "users", currentUserId), (doc) => {
    const { name, dateOfBirthday, skills, description, following, followers, lastActive, gender, stars, givenStarsTo, leftStars } = doc.data()!;

    setCurrentUserData((currentValues) => {
      const copiedCurrentBValue = { ...currentValues };

      return {
        id: currentUserId,
        name: name,
        dateOfBirthday: new Date(dateOfBirthday.seconds * 1000),
        profileImage: copiedCurrentBValue.profileImage,
        skills: skills,
        description: description,
        email: currentUserEmail,
        backgroundImage: copiedCurrentBValue.backgroundImage,
        following: following,
        followers: followers,
        lastActive: lastActive,
        gender: gender,
        stars: stars,
        givenStarsTo: givenStarsTo,
        leftStars: leftStars,
      };
    });
  });

  const storage = getStorage();

  getDownloadURL(ref(storage, `users/${currentUserId}/profileImage.png`)).then(async (profileImageUrl) => {
    try {
      const backgroundImageUrl = await getDownloadURL(ref(storage, `users/${currentUserId}/backgroundImage.png`));

      setCurrentUserData((currentValue) => {
        const copiedCurrentValue = { ...currentValue };

        return {
          ...copiedCurrentValue,
          profileImage: profileImageUrl,
          backgroundImage: backgroundImageUrl,
        };
      });
    } catch (error) {
      setCurrentUserData((currentValues) => {
        const copiedCurrentBValue = { ...currentValues };

        return {
          ...copiedCurrentBValue,
          profileImage: profileImageUrl,
        };
      });
    }
  });
};

export const loginAndGetUserData = async (
  setCurrentUserData: Dispatch<SetStateAction<currentUserType>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  email?: string,
  password?: string
) => {
  try {
    const user = await loginUser(email, password);

    if (user) {
      // User is a firebase auth object which contains email
      await getUserData(user.uid, user.email!, setCurrentUserData);
    }
    // For local loading images purpose
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  } catch (error) {
    return error;
  }
};

const App = () => {
  const [currentUserData, setCurrentUserData] = useState<currentUserType>({
    id: null,
    name: null,
    dateOfBirthday: null,
    profileImage: null,
    backgroundImage: null,
    skills: null,
    description: null,
    email: null,
    following: [],
    followers: 0,
    lastActive: null,
    password: null,
    gender: null,
    stars: null,
    givenStarsTo: null,
    leftStars: null,
  });

  const [isLoading, setIsLoading] = useState(true);

  const [notifications, setNotifications] = useState<
    {
      response: string;
      isPositive: boolean;
    }[]
  >([]);

  const appElementRef = useRef(null);

  const createNotification = (errorCode: string, isPositive = false) => {
    const foundError = errorCodes.find((errorCodeLocal) => errorCodeLocal.code === errorCode);

    setNotifications((currentValues) => {
      const copiedCurrentValues = [...currentValues];

      const doesThisNotificationAlreadyExists = copiedCurrentValues.find((notification) => notification.response === foundError?.response);

      if (foundError) {
        if (!doesThisNotificationAlreadyExists) {
          copiedCurrentValues.push({
            response: foundError.response,
            isPositive: isPositive,
          });
        }
      } else {
        copiedCurrentValues.push({
          response: "Wystąpił nieznany błąd. Spróbuj ponownie",
          isPositive: isPositive,
        });
      }

      return copiedCurrentValues;
    });
    setIsLoading(false);
  };

  useEffect(() => {
    const asyncWrapper = async () => {
      const error = await loginAndGetUserData(setCurrentUserData, setIsLoading);

      if (error) {
        const errorData = error as FirebaseError;
        createNotification(errorData.code);
      }
    };
    asyncWrapper();
  }, []);

  useEffect(() => {
    if (currentUserData.id) {
      setAcivityStatus(currentUserData.id);
    }
  }, [currentUserData]);

  return (
    <>
      <div className="notifications-global">
        {notifications.map((notification) => {
          const { response, isPositive } = notification;
          return <NotificationGlobal key={response} response={response} isPositive={isPositive} setNotifications={setNotifications}></NotificationGlobal>;
        })}
      </div>
      <div
        className="app"
        ref={appElementRef}
        onClick={() => {
          if (screen.orientation.type === "portrait-primary") {
            //document.documentElement.requestFullscreen();
          }
        }}>
        <Loading isLoading={isLoading}></Loading>
        <CreateNotificationContext.Provider value={createNotification}>
          <SetIsLoadingContext.Provider value={setIsLoading}>
            <CurrentUserStateContext.Provider value={[currentUserData, setCurrentUserData]}>
              <ComponentsTransition firstVisible={currentUserData.id !== null ? "Home" : "RegisterAndLoginForms"} parentElementRef={appElementRef}>
                <RegisterAndLoginForms key="RegisterAndLoginForms"></RegisterAndLoginForms>
                <Home key="Home"></Home>
                <TransitionChildStatic renderToRef={appElementRef} key="RegisterAndLoginFormsButton">
                  <Button show="RegisterAndLoginForms" className="show-register-and-login-forms-button" style={{ display: "none" }} hidden></Button>
                </TransitionChildStatic>
              </ComponentsTransition>
            </CurrentUserStateContext.Provider>
          </SetIsLoadingContext.Provider>
        </CreateNotificationContext.Provider>
      </div>
    </>
  );
};

export default App;
