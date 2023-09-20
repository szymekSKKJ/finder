import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const loginUser = async (email?: string, password?: string) => {
  const currentUserJSON = localStorage.getItem("currentUser");

  if (currentUserJSON) {
    const currentUser = JSON.parse(currentUserJSON);

    //@ts-ignore
    const decryptedPassword = CryptoJS.AES.decrypt(currentUser.password, "Secret Passphrase");

    //@ts-ignore
    const decryptedPasswordText = decryptedPassword.toString(CryptoJS.enc.Utf8);

    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, currentUser.email, decryptedPasswordText);
    const user = userCredential.user;

    return user;
  } else if (email && password) {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    //@ts-ignore
    const encrypted = CryptoJS.AES.encrypt(password, "Secret Passphrase");

    localStorage.setItem("currentUser", `{"email": "${email}", "password": "${encrypted}"}`);

    return user;
  }
  return null;
};

export default loginUser;
