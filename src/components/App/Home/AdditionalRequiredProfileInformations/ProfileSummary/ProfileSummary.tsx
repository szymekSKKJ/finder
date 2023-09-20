import { useContext } from "react";
import "./ProfileSummary.scss";
import Button from "../../../../Global/Button/Button";
import { CreateNotificationContext, CurrentUserStateContext, SetIsLoadingContext } from "../../../App";
import { currentUserNotNullType, currentUserType } from "../../../../../types";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db } from "../../../../../firebaseInitialization";
import skillsData from "../../../../../skills";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import loginUser from "../../../../../custom/firebase/user/loginUser";
import { FirebaseError } from "firebase/app";

export const createUser = async (currentUserData: currentUserType, createNotification: (errorCode: string, isPositive?: boolean) => void) => {
  const { email, password, name, dateOfBirthday, skills, description, profileImage, backgroundImage, gender } = currentUserData as currentUserNotNullType;

  if (email && password && profileImage) {
    const querySnapshot = await getDocs(query(collection(db, "users"), where("nameToLowerCase", "==", name.toLowerCase())));

    if (querySnapshot.size === 0) {
      try {
        const auth = getAuth();

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
          name: name,
          nameToLowerCase: name.toLowerCase(),
          dateOfBirthday: dateOfBirthday,
          skills: skills,
          description: description,
          followers: 0,
          following: [],
          gender: gender,
          leftStars: 3,
          givenStarsTo: [],
          stars: 0,
          lastActive: serverTimestamp(),
        });

        const storage = getStorage();

        // We know it is png bcs its from canvas, which has set 'png' type

        const storageRef = ref(storage, `users/${user.uid}/profileImage.png`);

        const profileImageBlob = await fetch(profileImage).then((response) => response.blob());

        await uploadBytes(storageRef, profileImageBlob);

        if (backgroundImage) {
          const storage = getStorage();
          const storageRef = ref(storage, `users/${user.uid}/backgroundImage.png`);

          const backgroundImageBlob = await fetch(backgroundImage).then((response) => response.blob());

          uploadBytes(storageRef, backgroundImageBlob).then(async () => {
            await loginUser(email.trim(), password.trim());
            window.location.reload();
          });
        } else {
          await loginUser(email.trim(), password.trim());
          window.location.reload();
        }
      } catch (error: unknown) {
        const errorData = error as FirebaseError;
        const registerAndLoginFormsButton = document.querySelector(".show-register-and-login-forms-button") as HTMLButtonElement;
        registerAndLoginFormsButton.click();
        createNotification(errorData.code);
      }
    } else {
      const registerAndLoginFormsButton = document.querySelector(".show-register-and-login-forms-button") as HTMLButtonElement;
      registerAndLoginFormsButton.click();
      const errorCode = "auth/name-alreadt-in-use";
      createNotification(errorCode);
    }
  }
};

const ProfileSummary = () => {
  const [currentUserData] = useContext(CurrentUserStateContext);
  const createNotification = useContext(CreateNotificationContext);
  const setIsLoading = useContext(SetIsLoadingContext);

  return (
    <div className="profile-summary">
      {currentUserData ? (
        <>
          <div className="background-and-profile-image-wrapper">
            <div className="background" style={{ backgroundImage: `url(${currentUserData.backgroundImage})` }}></div>
            <div className="profile-image">
              <img src={`${currentUserData.profileImage}`}></img>
            </div>
          </div>
          <div className="user-data">
            <p className="name">{currentUserData.name}</p>
            <div className="skills">
              {currentUserData.skills?.map((skill) => {
                const currentSkillData = skillsData.find((skillData) => skillData.id === skill)!;

                return (
                  <span className="skill" key={currentSkillData.name}>
                    <span>{currentSkillData.name}</span>
                    <i className={currentSkillData.iconClass}></i>
                  </span>
                );
              })}
            </div>
            <div className="description">
              <p>{currentUserData.description}</p>
            </div>
          </div>
          <div className="content">
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
            <div className="item"></div>
          </div>
          <Button
            onClick={() => {
              setIsLoading(true);

              createUser(currentUserData, createNotification);
            }}>
            Zatwierdź
          </Button>
        </>
      ) : null}
    </div>
  );
};

export default ProfileSummary;
