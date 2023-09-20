import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import "./FindUsers.scss";
import { CurrentUserStateContext } from "../../App";
import Button from "../../../Global/Button/Button";
import { currentUserNotNullType } from "../../../../types";
import Criteria from "./Criteria/Criteria";
import { DocumentData, QueryDocumentSnapshot, Timestamp, collection, getDocs, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import { db } from "../../../../firebaseInitialization";
import { useWatchStorage } from "../../../../customHooks/useLocalStorage";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import ComponentsTransition, { TransitionChildStatic, useGetTransitionContext } from "react-components-transition/ComponentsTransition";

const getAgeName = (lastDigitAge: number) => {
  if (lastDigitAge > 1 && lastDigitAge < 5) {
    return "lata";
  }
  if (lastDigitAge > 4 || lastDigitAge <= 1) {
    return "lat";
  }
};

const findUsers = async (
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
  >,
  criteriaSettings: {
    gender: string[];
    skills: number[];
    startAge: number;
    endAge: number;
  },
  currentUserDataId: string
) => {
  const foundUsers: {
    name: string;
    followers: number;
    description: string;
    id: string;
    stars: number;
    age: number;
  }[] = [];

  const lastActiveDateMax = new Date();

  lastActiveDateMax.setMinutes(lastActiveDateMax.getMinutes() - 4);

  const documentIds: string[] = [];

  let lastDocument: QueryDocumentSnapshot<DocumentData> | undefined = undefined;

  const findUserLoop = async () => {
    const querySnapshot = await getDocs(
      lastDocument
        ? query(
            collection(db, "users"),
            where("lastActive", ">=", Timestamp.fromDate(lastActiveDateMax)),
            orderBy("lastActive", "desc"),
            limit(1),
            startAfter(lastDocument)
          )
        : query(collection(db, "users"), where("lastActive", ">=", Timestamp.fromDate(lastActiveDateMax)), orderBy("lastActive", "desc"), limit(1))
    );

    lastDocument = querySnapshot.docs.at(0);

    if (lastDocument) {
      const { name, followers, description, gender, stars, skills, dateOfBirthday: dateOfBirthdayTimeStamp } = lastDocument.data();

      if (documentIds.includes(lastDocument.id) === false) {
        documentIds.push(lastDocument.id);
      }

      const startAgeTime = new Date(new Date().getFullYear() - criteriaSettings.startAge, 11, 31).getTime();

      const endRageTimes = new Date(new Date().getFullYear() - criteriaSettings.endAge, 11, 31).getTime();

      const dateOfBirthdayTime = new Date(dateOfBirthdayTimeStamp.seconds * 1000).getTime();

      const doesAnySkillsMatch = skills.some((skill: number) => criteriaSettings.skills.includes(skill));

      if (
        (criteriaSettings.gender.includes(gender) || criteriaSettings.gender.length === 0) &&
        (doesAnySkillsMatch || criteriaSettings.skills.length === 0) &&
        startAgeTime > dateOfBirthdayTime &&
        endRageTimes < dateOfBirthdayTime &&
        currentUserDataId !== lastDocument.id
      ) {
        foundUsers.push({
          name,
          followers,
          description,
          id: lastDocument.id,
          stars,
          age: new Date().getFullYear() - new Date(dateOfBirthdayTimeStamp.seconds * 1000).getFullYear(),
        });
      }

      if (documentIds.length <= 50) {
        await findUserLoop();
      }
    }
  };

  await findUserLoop();

  setFoundUsers(foundUsers);
};

const findUser = async (
  foundUsers:
    | {
        name: string;
        followers: number;
        description: string;
        id: string;
        stars: number;
        age: number;
      }[]
    | null,
  setFoundUser: Dispatch<
    SetStateAction<{
      name: string;
      followers: number;
      description: string;
      id: string;
      profileImage: string;
      stars: number;
      age: number;
    } | null>
  >,
  lastUser: {
    name: string;
    followers: number;
    description: string;
    id: string;
    profileImage: string;
    stars: number;
  } | null
) => {
  if (foundUsers && foundUsers.length !== 0) {
    const randomizedUserIndex = Math.floor(Math.random() * foundUsers.length);

    let randomizedUser = foundUsers[randomizedUserIndex];

    if (lastUser) {
      if (lastUser.id === randomizedUser.id) {
        if (foundUsers[randomizedUserIndex - 1]) {
          randomizedUser = foundUsers[randomizedUserIndex - 1];
        } else if (foundUsers[randomizedUserIndex + 1]) {
          randomizedUser = foundUsers[randomizedUserIndex + 1];
        }
      }
    }

    const storage = getStorage();
    const profileImageUrl = await getDownloadURL(ref(storage, `users/${randomizedUser.id}/profileImage.png`));

    setTimeout(() => {
      setFoundUser({ ...randomizedUser, profileImage: profileImageUrl });
    }, 1500);
  }
};

const tips = ["Pamiętaj aby być miłym dla innych", "Pamiętaj o limitowanej ilości gwiazdek", "Wejdź w ustawienia profilu, aby bardziej go spersonalizować"];

const FindUsers = ({
  setLastContent,
  getActiveUserData,
}: {
  setLastContent: Dispatch<SetStateAction<string>>;
  getActiveUserData: (userId: string) => void;
}) => {
  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);
  const homeComponentsTransitionContext = useGetTransitionContext();

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;
  const componentsTransitionWrapperRef = useRef(null);

  const [criteriaSettings] = useWatchStorage("criteriaSettings");

  const [foundUsers, setFoundUsers] = useState<
    | {
        name: string;
        followers: number;
        description: string;
        id: string;
        stars: number;
        age: number;
      }[]
    | null
  >(null);
  const [tip, setTip] = useState(tips[Math.round(Math.random() * (tips.length - 1))]);
  const [foundUser, setFoundUser] = useState<{
    name: string;
    followers: number;
    description: string;
    id: string;
    profileImage: string;
    stars: number;
    age: number;
  } | null>(null);

  const findUserActionsWrapperElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (foundUsers === null) {
      findUsers(setFoundUsers, criteriaSettings, currentUserData.id);
      setFoundUser(null);
    }
  }, [foundUsers]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (foundUsers !== null) {
        findUsers(setFoundUsers, criteriaSettings, currentUserData.id);
      }
    }, 1000 * 60 * 1);

    return () => {
      clearInterval(interval);
    };
  }, [foundUsers]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (foundUser === null) {
      setTip(tips[Math.round(Math.random() * (tips.length - 1))]);
      interval = setInterval(() => {
        setTip(tips[Math.round(Math.random() * (tips.length - 1))]);
      }, 2000);
    } else {
      clearInterval(interval);
    }

    return () => {
      clearInterval(interval);
    };
  }, [foundUser]);

  useEffect(() => {
    if (foundUsers !== null && foundUser === null) {
      findUser(foundUsers, setFoundUser, foundUser);
    }
  }, [foundUsers]);

  return (
    <div className="find-users">
      <div className="components-transition-wrapper" ref={componentsTransitionWrapperRef}>
        <ComponentsTransition parentElementRef={componentsTransitionWrapperRef}>
          <div className="wrapper" key="wrapper">
            {foundUser ? (
              <div className="found-user">
                <div className="background-and-profile-image-wrapper">
                  <div className="background"></div>
                  <div className="profile-image">
                    <img src={foundUser.profileImage}></img>
                  </div>
                </div>

                <p className="username">{foundUser.name} </p>
                <p className="age">
                  {foundUser.age} {getAgeName(Number(foundUser.age.toString().slice(1)))}
                </p>
                <div className="stats">
                  <p className="follows">
                    <i className="fa-sharp fa-regular fa-heart"></i> {foundUser.followers}
                  </p>
                  <p className="stars">
                    <i className="fa-sharp fa-regular fa-star"></i> {foundUser.stars}
                  </p>
                </div>
                <p className="description">{foundUser.description}</p>
                <div className="actions">
                  <Button
                    context={homeComponentsTransitionContext}
                    show="WriteMessage"
                    animationIn={{ className: "animation-in", duration: 500 }}
                    animationOut={{ className: "animation-Out", duration: 500 }}
                    onClick={() => {
                      getActiveUserData(foundUser.id);
                      setLastContent("FindUsers");
                    }}>
                    <i className="fa-regular fa-messages"></i>Wiadmość
                  </Button>
                  <Button
                    context={homeComponentsTransitionContext}
                    show="UserProfile"
                    className="UserProfile-button"
                    animationIn={{ className: "animation-in", duration: 500 }}
                    animationOut={{ className: "animation-Out", duration: 500 }}
                    onClick={() => {
                      setLastContent("FindUsers");
                      getActiveUserData(foundUser.id);
                    }}>
                    <i className="fa-regular fa-user"></i>Profil
                  </Button>
                </div>
              </div>
            ) : (
              <div className="searching-for-user">
                <p className="tip">{tip}</p>
              </div>
            )}
          </div>
          <Criteria key="Criteria" setFoundUsers={setFoundUsers}></Criteria>
          <TransitionChildStatic key="find-user-actions" renderToRef={findUserActionsWrapperElementRef}>
            <div className="find-user-actions">
              <Button show="Criteria" animationIn={{ className: "animation-in", duration: 500 }} animationOut={{ className: "animation-out", duration: 500 }}>
                <i className="fa-regular fa-gear"></i>
              </Button>
              <Button
                onClick={() => {
                  setFoundUser(null);
                  findUser(foundUsers, setFoundUser, foundUser);
                }}>
                <i className="fa-solid fa-arrow-rotate-left"></i>
              </Button>
            </div>
          </TransitionChildStatic>
        </ComponentsTransition>
      </div>

      <div className="find-user-actions-wrapper" ref={findUserActionsWrapperElementRef}></div>
    </div>
  );
};

export default FindUsers;
