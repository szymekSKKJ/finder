import { Dispatch, SetStateAction, useContext, useRef, useState } from "react";
import "./BackgroundImageEditor.scss";
// @ts-ignore
import AvatarEditor from "react-avatar-editor";
import Button from "../../../../Global/Button/Button";
import dummyImage from "../../../../../assets/dummyBackground.jpg";
import { currentUserType } from "../../../../../types";
import { CurrentUserStateContext } from "../../../App";

const BackgroundImageEditor = ({ setStatusStage }: { setStatusStage: Dispatch<SetStateAction<number>> }) => {
  const [, setCurrentUserData] = useContext(CurrentUserStateContext);

  const [avatarEditorScale, setAvatarEditorScale] = useState(1);
  const [avatarEditorRotate, setAvatarEditorRotate] = useState(0);
  const [inputImageData, setInputImageData] = useState<null | File>(null);
  const imageEditorRef = useRef(null);

  return (
    <div className="background-image-editor">
      <h1>Zdjęcie w tle</h1>
      <p>Nadaj swojemu profilowi unikalnego wyglądu</p>
      <p>(kliknij w zdjęcie aby wybrać)</p>
      <p>(Możesz pozostawić puste)</p>
      <div className="content-wrapper">
        <div className="avatar-editor-options">
          <Button onClick={() => setAvatarEditorScale((currentValue) => currentValue + 0.1)}>
            <i className="fa-solid fa-plus"></i>
          </Button>
          <Button onClick={() => setAvatarEditorScale((currentValue) => (currentValue > 1 ? currentValue - 0.1 : currentValue))}>
            <i className="fa-solid fa-minus"></i>
          </Button>
          <Button onClick={() => setAvatarEditorRotate((currentValue) => currentValue + 2)}>
            <i className="fa-solid fa-rotate-right"></i>
          </Button>
          <Button onClick={() => setAvatarEditorRotate((currentValue) => currentValue - 2)}>
            <i className="fa-solid fa-rotate-left"></i>
          </Button>
          <Button
            onClick={() => {
              setInputImageData(null);
              setAvatarEditorScale(1);
              setAvatarEditorRotate(0);
            }}>
            <i className="fa-solid fa-trash-can"></i>
          </Button>
        </div>
        <div
          className="avatar-editor-wrapper"
          onClick={(event) => {
            if (inputImageData === null) {
              const inputFileElement = event.currentTarget.nextSibling?.firstChild as HTMLInputElement;

              if (inputFileElement) {
                inputFileElement.click();
              }
            }
          }}>
          <AvatarEditor
            ref={imageEditorRef}
            image={inputImageData === null ? dummyImage : inputImageData}
            width={1280}
            height={720}
            border={10}
            color={[247, 110, 110, 0.5]} // RGBA
            scale={avatarEditorScale}
            rotate={avatarEditorRotate}
            style={{ width: "100%", height: "auto", animation: inputImageData !== null && "none" }}></AvatarEditor>
        </div>
        <form hidden>
          <input
            type="file"
            accept="image/png, image/gif, image/jpeg"
            onInput={(event) => {
              setInputImageData(() => event.currentTarget.files && event.currentTarget.files[0]);
              setAvatarEditorScale(1);
              setAvatarEditorRotate(0);
            }}></input>
        </form>
        <Button
          isValid={true}
          show={"ProfileSummary"}
          animationIn={{ className: "animationIn", duration: 500 }}
          animationOut={{ className: "animationOut", duration: 500 }}
          onClick={() => {
            setStatusStage((currentValue) => (currentValue === 7 ? currentValue + 1 : currentValue));

            if (imageEditorRef.current && inputImageData) {
              // @ts-ignore

              const canvas = imageEditorRef.current.getImage().toDataURL();
              fetch(canvas)
                .then((res) => res.blob())
                .then((blob) => {
                  const image = window.URL.createObjectURL(blob);

                  setCurrentUserData((currentValue: currentUserType) => {
                    const coppiedCurrentValue = { ...currentValue };
                    coppiedCurrentValue.backgroundImage = image;
                    return coppiedCurrentValue;
                  });
                });
            }
          }}>
          Dalej
        </Button>
      </div>
    </div>
  );
};

export default BackgroundImageEditor;
