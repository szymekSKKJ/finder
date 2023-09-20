import { getAuth, signOut } from "firebase/auth";
import { Dispatch, SetStateAction } from "react";
import { currentUserType } from "../../../types";

const signOutUser = async (setCurrentUserData: Dispatch<SetStateAction<currentUserType>>) => {
  const auth = getAuth();
  await signOut(auth);

  setCurrentUserData((currentValue) => {
    const copiedCurrentValue = { ...currentValue };

    Object.keys(copiedCurrentValue).forEach((key) => {
      copiedCurrentValue[key as keyof currentUserType] = null;
    });

    return copiedCurrentValue;
  });
  localStorage.removeItem("currentUser");

  window.location.reload();
};

export default signOutUser;
