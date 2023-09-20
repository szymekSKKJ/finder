import "./ImageEditorForm.scss";
// @ts-ignore
import AvatarEditor from "react-avatar-editor";
import Button from "../../../../Global/Button/Button";
import { Dispatch, SetStateAction, useContext, useRef, useState } from "react";
import dummyImage from "../../../../../assets/dummyImage.jpg";
import { currentUserType } from "../../../../../types";
import { CurrentUserStateContext } from "../../../App";

const ImageEditorForm = ({ setStatusStage }: { setStatusStage: Dispatch<SetStateAction<number>> }) => {
  const [, setCurrentUserData] = useContext(CurrentUserStateContext);

  const [avatarEditorScale, setAvatarEditorScale] = useState(1);
  const [avatarEditorRotate, setAvatarEditorRotate] = useState(0);
  const [inputImageData, setInputImageData] = useState<null | File>(null);
  const imageEditorRef = useRef(null);

  const isButtonValid = inputImageData !== null && inputImageData !== undefined;

  return (
    <div className="image-editor-form">
      <h1>Zdjęcie profilowe</h1>
      <p>Zawsze milej, kiedy możemy siebie nawzjem zobaczyć</p>
      <p>(kliknij w zdjęcie aby wybrać)</p>
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
            width={256}
            height={256}
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
          isValid={isButtonValid}
          show={isButtonValid ? "ChooseSkillsForm" : "ImageEditorForm"}
          animationIn={{ className: "animationIn", duration: 500 }}
          animationOut={{ className: "animationOut", duration: 500 }}
          onClick={() => {
            if (isButtonValid) {
              setStatusStage((currentValue) => (currentValue === 4 ? currentValue + 1 : currentValue));

              if (imageEditorRef.current) {
                // @ts-ignore

                const canvas = imageEditorRef.current.getImage().toDataURL();
                fetch(canvas)
                  .then((res) => res.blob())
                  .then((blob) => {
                    const image = window.URL.createObjectURL(blob);

                    setCurrentUserData((currentValue: currentUserType) => {
                      const coppiedCurrentValue = { ...currentValue };
                      coppiedCurrentValue.profileImage = image;
                      return coppiedCurrentValue;
                    });
                  });
              }
            }
          }}>
          Dalej
        </Button>
      </div>
    </div>
  );
};

export default ImageEditorForm;
