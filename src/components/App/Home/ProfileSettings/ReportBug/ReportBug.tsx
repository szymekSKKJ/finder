import { useContext, useState } from "react";
import Button from "../../../../Global/Button/Button";
import "./ReportBug.scss";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../firebaseInitialization";
import { SetIsLoadingContext } from "../../../App";

const sendBug = async (title: string, description: string) => {
  await addDoc(collection(db, "bugs"), {
    title: title,
    description: description,
    sentAt: serverTimestamp(),
  });
};

const ReportBug = () => {
  const [textareaValueDescription, setTextareaValueDescription] = useState("");
  const [textareaValueTitle, setTextareaValueTitle] = useState("");
  const [isBugSent, setIsBugSent] = useState(false);
  const setIsLoading = useContext(SetIsLoadingContext);

  const ifFormValid = textareaValueDescription !== "" && textareaValueTitle !== "";

  return (
    <div className="report-bug">
      <div className="header">
        <Button
          className="back"
          show={"Main"}
          animationIn={{ className: "animation-in", duration: 500 }}
          animationOut={{ className: "animation-out", duration: 500 }}>
          <i className="fa-solid fa-chevron-left"></i>
        </Button>
        <p>Zgłoś błąd</p>
      </div>
      {isBugSent === false ? (
        <>
          <div className="content">
            <p className="description">
              Opisz dokładnie gdzie wystąpił błąd, czego dotyczy i w jaki sposób do niego doszło, a my postaramy się go naprawić jak najszybciej
            </p>
            <span
              className={`textarea title ${textareaValueTitle ? "not-empty" : ""}`}
              role="textbox"
              contentEditable
              onInput={(event) => setTextareaValueTitle(event.currentTarget.innerText.trim())}></span>
            <span
              className={`textarea ${textareaValueDescription ? "not-empty" : ""}`}
              role="textbox"
              contentEditable
              onInput={(event) => setTextareaValueDescription(event.currentTarget.innerText.trim())}></span>
            <Button
              isValid={ifFormValid}
              show={"BackgroundImageEditor"}
              onClick={async () => {
                if (ifFormValid) {
                  setIsLoading(true);
                  await sendBug(textareaValueTitle, textareaValueDescription);
                  setIsLoading(false);
                  setIsBugSent(true);
                }
              }}>
              Wyślij
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="content">
            <p className="description">Dziękujemy za zgłoszenie błędu. Postaramy się go naprawić jak najszybciej</p>
            <Button
              className="back"
              show={"Main"}
              animationIn={{ className: "animation-in", duration: 500 }}
              animationOut={{ className: "animation-out", duration: 500 }}>
              Powrót
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportBug;
