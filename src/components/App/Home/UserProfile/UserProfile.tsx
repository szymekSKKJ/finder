import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import "./UserProfile.scss";
import skillsData from "../../../../skills";
import Button from "../../../Global/Button/Button";
import MainImages from "./MainImages/MainImages";
import MainPosts from "./MainPosts/MainPosts";
import "firebase/storage";
import { StorageReference, getDownloadURL, getMetadata, getStorage, listAll, ref } from "firebase/storage";
import { arrayRemove, arrayUnion, doc, increment, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebaseInitialization";
import { currentUserNotNullType } from "../../../../types";
import ComponentsTransition, { TransitionChildStatic } from "react-components-transition/ComponentsTransition";
import { followUserProfileNotification, giveStarToUserProfileNotification } from "../../../../custom/notifications/uploadNotification";

const revokeStar = async (
  userId: string,
  currentUserId: string,
  setCurrentUserDataStarsLeft: Dispatch<SetStateAction<number>>,
  setUserProfileData: Dispatch<SetStateAction<currentUserNotNullType | null>>
) => {
  setCurrentUserDataStarsLeft((currentValue) => currentValue + 1);

  setUserProfileData((currentValue) => {
    const copiedCurrentValue = { ...currentValue } as typeof currentValue;

    if (copiedCurrentValue) {
      copiedCurrentValue.stars = copiedCurrentValue.stars - 1;
    }

    return copiedCurrentValue;
  });

  await updateDoc(doc(db, "users", userId), {
    stars: increment(-1),
  });

  await updateDoc(doc(db, "users", currentUserId), {
    leftStars: increment(1),
    givenStarsTo: arrayRemove(userId),
  });
};

const giveStar = async (
  userId: string,
  currentUserId: string,

  currentUserDataStarsLeft: number,
  setUserProfileData: Dispatch<SetStateAction<currentUserNotNullType | null>>,
  setCurrentUserDataStarsLeft: Dispatch<SetStateAction<number>>
) => {
  if (currentUserDataStarsLeft !== 0) {
    setCurrentUserDataStarsLeft((currentValue) => currentValue - 1);

    setUserProfileData((currentValue) => {
      const copiedCurrentValue = { ...currentValue } as typeof currentValue;

      if (copiedCurrentValue) {
        copiedCurrentValue.stars = copiedCurrentValue.stars + 1;
      }

      return copiedCurrentValue;
    });

    await updateDoc(doc(db, "users", userId), {
      stars: increment(1),
    });

    await updateDoc(doc(db, "users", currentUserId), {
      leftStars: increment(-1),
      givenStarsTo: arrayUnion(userId),
    });
  } else {
    //! error
    console.log("ksks");
  }
};

const getAgeName = (lastDigitAge: number) => {
  if (lastDigitAge > 1 && lastDigitAge < 5) {
    return "lata";
  }
  if (lastDigitAge > 4 || lastDigitAge <= 1) {
    return "lat";
  }
};

const getImages = async (setImages: Dispatch<SetStateAction<{ id: number; url: string; uploadedAt: Date; postId: string }[]>>, userId: string) => {
  const storage = getStorage();
  const images: { id: number; url: string; uploadedAt: Date; postId: string }[] = [];

  const result = await listAll(ref(storage, `users/${userId}/posts`));

  await Promise.all(
    result.prefixes.map(async (postRef: StorageReference) => {
      const result = await listAll(ref(storage, `${postRef}`));

      const postId = postRef.toString().split("/").at(-1)!;

      const randomizedIndex = Math.floor(Math.random() * result.items.length);

      const url = await getDownloadURL(ref(storage, `${result.items[randomizedIndex]}`));
      const metadata = await getMetadata(result.items[randomizedIndex]);

      images.push({ url: url, id: Math.random(), uploadedAt: new Date(metadata.updated), postId: postId });
    })
  );

  const sortedImages = images.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

  setImages(sortedImages);
};

const giveFollow = async (userId: string, currentUserId: string, setUserProfileData: Dispatch<SetStateAction<currentUserNotNullType | null>>) => {
  setUserProfileData((currentValue) => {
    const copiedCurrentValue = { ...currentValue } as typeof currentValue;

    if (copiedCurrentValue) {
      copiedCurrentValue.followers = copiedCurrentValue.followers + 1;
    }

    return copiedCurrentValue;
  });

  await updateDoc(doc(db, "users", userId), {
    followers: increment(1),
  });

  await updateDoc(doc(db, "users", currentUserId), {
    following: arrayUnion(userId),
  });
};

const revokeFollow = async (userId: string, currentUserId: string, setUserProfileData: Dispatch<SetStateAction<currentUserNotNullType | null>>) => {
  setUserProfileData((currentValue) => {
    const copiedCurrentValue = { ...currentValue } as typeof currentValue;

    if (copiedCurrentValue) {
      copiedCurrentValue.followers = copiedCurrentValue.followers - 1;
    }

    return copiedCurrentValue;
  });

  await updateDoc(doc(db, "users", userId), {
    followers: increment(-1),
  });

  await updateDoc(doc(db, "users", currentUserId), {
    following: arrayRemove(userId),
  });
};

const UserProfile = ({
  setLastContent,
  activeUserData,
  currentUserData,
  setActivePost,
}: {
  setLastContent: Dispatch<SetStateAction<string>>;
  activeUserData: currentUserNotNullType | null;
  currentUserData: currentUserNotNullType;
  setActivePost: Dispatch<
    SetStateAction<{
      postId: string;
      userIdOfCreatedPost: string;
      commentId: string;
      replyId: string;
      type: string;
    } | null>
  >;
}) => {
  // For giving star and follow purpose
  const [userProfileData, setUserProfileData] = useState<currentUserNotNullType | null>(activeUserData);

  const [currentUserDataStarsLeft, setCurrentUserDataStarsLeft] = useState(currentUserData.leftStars);

  const [choosenContent, setChoosenContent] = useState("MainImages");

  //! Ze zdjęciami tak samo jak z postami trzeba zrobić
  const [images, setImages] = useState<{ id: number; url: string; uploadedAt: Date; postId: string }[]>([]);

  const contentElementRef = useRef(null);
  const chooseContentRef = useRef<HTMLDivElement | null>(null);
  const userProfileWrapperElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeUserData) {
      getImages(setImages, activeUserData.id);
    }

    return () => {
      setUserProfileData(null);
    };
  }, [activeUserData]);

  useEffect(() => {
    setUserProfileData(activeUserData);
  }, [activeUserData]);

  return (
    <div className="user-profile-wrapper" ref={userProfileWrapperElementRef}>
      {userProfileData && (
        <div className="user-profile">
          <div className="background-and-profile-image-wrapper">
            <Button
              show="ProfileSettings"
              animationIn={{ className: "animation-in", duration: 500 }}
              animationOut={{ className: "animation-out", duration: 500 }}>
              <i className="fa-regular fa-gear"></i>
            </Button>
            <div className="background" style={{ backgroundImage: `url(${userProfileData.backgroundImage})` }}></div>
            <div className="profile-image">
              <img src={userProfileData.profileImage}></img>
            </div>
          </div>
          <div className="user-data">
            <p className="name">{userProfileData.name}</p>
            <p className="additional">
              <span className="location"></span>
              <span className="age">
                {new Date().getFullYear() - userProfileData.dateOfBirthday.getFullYear()}{" "}
                {getAgeName(Number((new Date().getFullYear() - userProfileData.dateOfBirthday.getFullYear()).toString().slice(1)))}
              </span>
            </p>
            <div className="skills">
              {userProfileData.skills.map((skill) => {
                const currentSkill = skillsData.find((skillData) => skillData.id === skill)!;

                return (
                  <span className="skill" key={currentSkill?.id}>
                    <span>{currentSkill.name}</span>
                    <i className={currentSkill.iconClass}></i>
                  </span>
                );
              })}
            </div>
            {currentUserData.id !== userProfileData.id && (
              <div className="actions">
                <Button
                  show="WriteMessage"
                  animationOut={{ className: "animation-out", duration: 500 }}
                  animationIn={{ className: "animation-in", duration: 500 }}
                  onClick={() => {
                    setLastContent("UserProfile");
                  }}>
                  <i className="fa-regular fa-messages"></i>Wiadmość
                </Button>
                <Button
                  className={`${currentUserData.following.includes(userProfileData.id) ? "following" : ""}`}
                  onClick={() => {
                    currentUserData.following.includes(userProfileData.id) === false
                      ? giveFollow(userProfileData.id, currentUserData.id, setUserProfileData)
                      : revokeFollow(userProfileData.id, currentUserData.id, setUserProfileData);
                    followUserProfileNotification(currentUserData.id, currentUserData.name, userProfileData.id);
                  }}>
                  <i className={`${currentUserData.following.includes(userProfileData.id) ? "fa-solid" : "fa-regular"} fa-heart`}></i>
                </Button>
                <Button
                  className={`${currentUserData.givenStarsTo.includes(userProfileData.id) ? "star-given" : ""}`}
                  onClick={() => {
                    currentUserData.givenStarsTo.includes(userProfileData.id) === false
                      ? giveStar(userProfileData.id, currentUserData.id, currentUserDataStarsLeft, setUserProfileData, setCurrentUserDataStarsLeft)
                      : revokeStar(userProfileData.id, currentUserData.id, setCurrentUserDataStarsLeft, setUserProfileData);
                    giveStarToUserProfileNotification(currentUserData.id, currentUserData.name, userProfileData.id);
                  }}>
                  <i className={`${currentUserData.givenStarsTo.includes(userProfileData.id) ? "fa-solid" : "fa-regular"} fa-star`}></i>
                </Button>
              </div>
            )}
            <div className="stats">
              <p className="follows">
                <i className="fa-sharp fa-regular fa-heart"></i> {userProfileData.followers}
              </p>
              <p className="stars">
                <i className="fa-sharp fa-regular fa-star"></i> {userProfileData.stars}
              </p>
            </div>
            <p className="description">{userProfileData.description}</p>
          </div>
          <div className="choose-content" ref={chooseContentRef}></div>
          <div className="content" ref={contentElementRef}>
            <Button
              show="NotificationPost"
              animationIn={{ className: "animation-in", duration: 500 }}
              animationOut={{ className: "animation-out", duration: 500 }}
              className="show-notification-post-button"
              style={{ display: "none" }}
              hidden></Button>
            <ComponentsTransition parentElementRef={contentElementRef}>
              <TransitionChildStatic renderToRef={chooseContentRef}>
                <>
                  <Button
                    className={`${choosenContent === "MainImages" ? "choosen" : ""}`}
                    show="MainImages"
                    animationIn={{ className: "animationIn", duration: 333 }}
                    animationOut={{ className: "animationOut", duration: 333 }}
                    onClick={() => setChoosenContent("MainImages")}>
                    <i className="fa-regular fa-image"></i>
                  </Button>
                  <Button
                    className={`${choosenContent === "MainPosts" ? "choosen" : ""}`}
                    show="MainPosts"
                    animationOut={{ className: "animationOut", duration: 333 }}
                    animationIn={{ className: "animationIn", duration: 333 }}
                    onClick={() => setChoosenContent("MainPosts")}>
                    <i className="fa-regular fa-pen-to-square"></i>
                  </Button>
                </>
              </TransitionChildStatic>
              <MainImages images={images} setActivePost={setActivePost} key="MainImages"></MainImages>
              <MainPosts
                userId={userProfileData.id}
                usersId={[userProfileData.id]}
                scrollableElement={userProfileWrapperElementRef.current!}
                key="MainPosts"></MainPosts>
            </ComponentsTransition>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
