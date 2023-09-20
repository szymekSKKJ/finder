import "./Home.scss";
import AdditionalRequiredProfileInformations from "./AdditionalRequiredProfileInformations/AdditionalRequiredProfileInformations";
import { Dispatch, SetStateAction, createContext, useContext, useEffect, useRef, useState } from "react";
import UserProfile from "./UserProfile/UserProfile";
import { CurrentUserStateContext } from "../App";
import MainNavigation from "./MainNavigation/MainNavigation";
import FindUsers from "./FindUsers/FindUsers";
import News from "./News/News";
import LastMessages from "./LastMessages/LastMessages";
import WriteMessage from "./WriteMessage/WriteMessage";
import { currentUserNotNullType } from "../../../types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseInitialization";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import ComponentsTransition, { TransitionChildStatic } from "react-components-transition/ComponentsTransition";
import Notifications from "./Notifications/Notifications";
import NotificationPost from "./NotificationPost/NotificationPost";
import DisplayImages from "./DisplayImages/DisplayImages";
import SharePost from "./SharePost/SharePost";
import ProfileSettings from "./ProfileSettings/ProfileSettings";

export const SetSharingPostContext = createContext<
  Dispatch<
    SetStateAction<null | {
      id: string;
      userId: string;
      commentsCounter: number;
      usersIdLikes: string[];
      content: string;
      uploadedAt: Date;
      images: { id: string; url: string; updatedAt: Date }[];
      sharingPost: null;
      sharingPostsCounter: number;
    }>
  >
>(() => null);

export const SetLastContentContext = createContext<Dispatch<SetStateAction<string>>>(() => "");

export const SetImagesToDisplayContext = createContext<Dispatch<SetStateAction<string[]>>>(() => []);

export const SetIsMainNavigationClosedContext = createContext<Dispatch<SetStateAction<boolean>> | null>(null);

export const GetActiveUserDataContext = createContext<(userId: string) => void>(() => "");

const getUserData = async (setActiveUserData: Dispatch<SetStateAction<currentUserNotNullType | null>>, userId: string) => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);

  const { name, dateOfBirthday, skills, description, following, followers, lastActive, gender, stars, givenStarsTo, leftStars } = docSnap.data()!;

  const storage = getStorage();

  getDownloadURL(ref(storage, `users/${userId}/profileImage.png`)).then(async (profileImageUrl) => {
    try {
      const backgroundImage = await getDownloadURL(ref(storage, `users/${userId}/backgroundImage.png`));

      const activeUserData = {
        id: userId,
        name: name,
        dateOfBirthday: new Date(dateOfBirthday.seconds * 1000),
        profileImage: profileImageUrl,
        skills: skills,
        description: description,
        backgroundImage: backgroundImage,
        following: following,
        followers: followers,
        lastActive: lastActive,
        gender: gender,
        stars: stars,
        givenStarsTo: givenStarsTo,
        leftStars: leftStars,
      };

      setActiveUserData({ ...activeUserData });
    } catch (error) {
      const activeUserData = {
        id: userId,
        name: name,
        dateOfBirthday: new Date(dateOfBirthday.seconds * 1000),
        profileImage: profileImageUrl,
        skills: skills,
        description: description,
        backgroundImage: "",
        following: following,
        followers: followers,
        lastActive: lastActive,
        gender: gender,
        stars: stars,
        givenStarsTo: givenStarsTo,
        leftStars: leftStars,
      };

      setActiveUserData({ ...activeUserData });
    }
  });
};

const Home = () => {
  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);

  const homeElementRef = useRef(null);

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;

  const [isMainNavigationClosed, setIsMainNavigationClosed] = useState(true);

  const [activeUserData, setActiveUserData] = useState<currentUserNotNullType | null>(null);

  const [sharingPost, setSharingPost] = useState<null | {
    id: string;
    userId: string;
    commentsCounter: number;
    usersIdLikes: string[];
    content: string;
    uploadedAt: Date;
    images: { id: string; url: string; updatedAt: Date }[];
    sharingPost: null;
    sharingPostsCounter: number;
  }>(null);

  const [activePost, setActivePost] = useState<{
    postId: string;
    userIdOfCreatedPost: string;
    commentId: string;
    replyId: string;
    type: string;
  } | null>(null);

  const [lastContent, setLastContent] = useState("UserProfile");

  const [imagesToDisplay, setImagesToDisplay] = useState<string[]>([]);

  const mainNavigationElementRef = useRef<HTMLDivElement | null>(null);
  const displayImagesElementRef = useRef<HTMLDivElement | null>(null);
  const sharePostWrapperElementRef = useRef<HTMLDivElement | null>(null);

  const getActiveUserData = (userId: string) => {
    setActiveUserData(null);
    if (userId === currentUserData.id) {
      setActiveUserData(currentUserData);
    } else if (userId) {
      getUserData(setActiveUserData, userId);
    }
  };

  useEffect(() => {
    if (currentUserData.id !== null && currentUserData.id === activeUserData?.id) {
      setIsMainNavigationClosed(false);

      getActiveUserData(currentUserData.id);
    }
  }, [currentUserData]);

  useEffect(() => {
    getActiveUserData(currentUserData.id);
  }, []);

  useEffect(() => {
    const criteriaDataJSON = localStorage.getItem("criteriaSettings");

    if (criteriaDataJSON === null) {
      const criteriaData = {
        startAge: 16,
        endAge: 100,
        skills: [],
        gender: [],
      };

      localStorage.setItem("criteriaSettings", JSON.stringify(criteriaData));
    }
  }, []);

  return (
    <div className="home" ref={homeElementRef}>
      <SetSharingPostContext.Provider value={setSharingPost}>
        <SetLastContentContext.Provider value={setLastContent}>
          <SetImagesToDisplayContext.Provider value={setImagesToDisplay}>
            <GetActiveUserDataContext.Provider value={getActiveUserData}>
              <SetIsMainNavigationClosedContext.Provider value={setIsMainNavigationClosed}>
                <ComponentsTransition
                  firstVisible={currentUserData.id !== null ? "UserProfile" : "AdditionalRequiredProfileInformations"}
                  parentElementRef={homeElementRef}>
                  <AdditionalRequiredProfileInformations key="AdditionalRequiredProfileInformations"></AdditionalRequiredProfileInformations>

                  {/* Every child has to have set a height a value of 'calc(100vh - 42px)'. Look any css of child */}
                  <NotificationPost key="NotificationPost" activePost={activePost}></NotificationPost>
                  <LastMessages
                    key="LastMessages"
                    currentUserData={currentUserData}
                    setLastContent={setLastContent}
                    getActiveUserData={getActiveUserData}></LastMessages>
                  <WriteMessage
                    key="WriteMessage"
                    lastContent={lastContent}
                    activeUserData={activeUserData}
                    currentUserData={currentUserData}
                    setLastContent={setLastContent}></WriteMessage>
                  <Notifications key="Notifications" setActivePost={setActivePost}></Notifications>
                  <UserProfile
                    key="UserProfile"
                    setLastContent={setLastContent}
                    activeUserData={activeUserData}
                    currentUserData={currentUserData}
                    setActivePost={setActivePost}></UserProfile>
                  <FindUsers key="FindUsers" getActiveUserData={getActiveUserData} setLastContent={setLastContent}></FindUsers>
                  <News key="News"></News>
                  <ProfileSettings key="ProfileSettings"></ProfileSettings>

                  <TransitionChildStatic renderToRef={sharePostWrapperElementRef} key="SharePost">
                    <SharePost key="SharePost" sharingPost={sharingPost}></SharePost>
                  </TransitionChildStatic>

                  <TransitionChildStatic renderToRef={displayImagesElementRef} key="DisplayImages">
                    <DisplayImages imagesToDisplay={imagesToDisplay} key="DisplayImages"></DisplayImages>
                  </TransitionChildStatic>

                  <TransitionChildStatic renderToRef={mainNavigationElementRef} key="MainNavigationWrapper">
                    <MainNavigation key="MainNavigation" getActiveUserData={getActiveUserData}></MainNavigation>
                  </TransitionChildStatic>
                </ComponentsTransition>
              </SetIsMainNavigationClosedContext.Provider>
              {<div className={`main-navigation-wrapper  ${isMainNavigationClosed ? "closed" : ""}`} ref={mainNavigationElementRef}></div>}
              {<div className={`display-images-wrapper ${imagesToDisplay.length !== 0 ? "" : "closed"}`} ref={displayImagesElementRef}></div>}
              {<div className={`share-post-wrapper ${sharingPost ? "" : "closed"}`} ref={sharePostWrapperElementRef}></div>}
            </GetActiveUserDataContext.Provider>
          </SetImagesToDisplayContext.Provider>
        </SetLastContentContext.Provider>
      </SetSharingPostContext.Provider>
    </div>
  );
};

export default Home;
