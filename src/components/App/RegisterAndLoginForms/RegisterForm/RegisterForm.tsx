import "./RegisterForm.scss";
import { FormEvent, MutableRefObject, useContext, useRef, useState } from "react";
import Input from "../../../Global/Input/Input";
import Button from "../../../Global/Button/Button";
import { currentUserType } from "../../../../types";
import { CreateNotificationContext, CurrentUserStateContext, SetIsLoadingContext } from "../../App";
import { createUser } from "../../Home/AdditionalRequiredProfileInformations/ProfileSummary/ProfileSummary";

const isEmpty = (str: string) => !str.trim().length;

const giveFocusToNotCorrectFilledInput = (
  event: FormEvent<HTMLFormElement>,
  inputElementsState: { id: number; type: string; placeholder: string; isCorrect: boolean }[]
) => {
  const inputElements = event.currentTarget.querySelectorAll("input");

  // This data cannot be undefined because all values are from rendering

  const notCorrectInput = inputElementsState.find((input) => input.isCorrect === false);

  if (notCorrectInput) {
    inputElements[notCorrectInput.id - 1].focus();
  }
};

const RegisterForm = ({
  registerAndLoginFormsElement,
  mainContext,
}: {
  registerAndLoginFormsElement: MutableRefObject<HTMLDivElement | null>;
  mainContext: any;
}) => {
  const [currentUserData, setCurrentUserData] = useContext(CurrentUserStateContext);
  const createNotification = useContext(CreateNotificationContext);
  const setIsLoading = useContext(SetIsLoadingContext);

  const [inputElementsState, setInputElementsState] = useState<
    { id: number; type: string; placeholder: string; isCorrect: boolean; defaultValue: string | null | undefined }[]
  >([
    { id: 1, type: "text", placeholder: "Email", isCorrect: currentUserData.email ? true : false, defaultValue: currentUserData.email },
    { id: 2, type: "text", placeholder: "Nazwa", isCorrect: currentUserData.name ? true : false, defaultValue: currentUserData.name },
    { id: 3, type: "password", placeholder: "Hasło", isCorrect: currentUserData.password ? true : false, defaultValue: currentUserData.password },
  ]);

  const formElementRef = useRef<HTMLFormElement | null>(null);

  const isFormCorrect = inputElementsState.every((input) => input.isCorrect === true);

  return (
    <div className="register-form-wrapper">
      <h1>Zarejestruj się</h1>
      <form
        className="register-form"
        noValidate
        ref={formElementRef}
        onSubmit={(event) => {
          event.preventDefault();
          giveFocusToNotCorrectFilledInput(event, inputElementsState);
        }}>
        {inputElementsState.map((input) => {
          const { id, type, placeholder, defaultValue } = input;

          return (
            <Input
              type={type}
              placeholder={placeholder}
              key={id}
              defaultValue={defaultValue ? defaultValue : undefined}
              onChange={(event) => {
                const inputElement = event.currentTarget as HTMLInputElement;

                setInputElementsState((currentValues) => {
                  const copiedCurrentValues = [...currentValues];
                  const foundInput = copiedCurrentValues.find((input) => input.id === id)!;

                  if (foundInput.placeholder === "Email") {
                    const splittedInputValue = inputElement.value.split("");
                    if (
                      inputElement.value.includes("@") &&
                      inputElement.value.includes(".") &&
                      splittedInputValue.at(-1) !== "." &&
                      isEmpty(inputElement.value) === false
                    ) {
                      foundInput.isCorrect = true;
                    } else {
                      foundInput.isCorrect = false;
                    }
                  } else if (foundInput.placeholder === "Hasło") {
                    if (inputElement.value.includes(" ") === false && isEmpty(inputElement.value) === false) {
                      foundInput.isCorrect = true;
                    } else {
                      foundInput.isCorrect = false;
                    }
                  } else if (isEmpty(inputElement.value) === false) {
                    foundInput.isCorrect = true;
                  } else {
                    foundInput.isCorrect = false;
                  }

                  return copiedCurrentValues;
                });
              }}></Input>
          );
        })}
        <Button
          isValid={isFormCorrect}
          context={mainContext}
          show={currentUserData.profileImage ? "" : "Home"}
          animationIn={{ className: "animationIn", duration: 500 }}
          animationOut={{ className: "animationOut", duration: 500 }}
          style={{ marginTop: "50px" }}
          onClick={() => {
            if (isFormCorrect && registerAndLoginFormsElement && registerAndLoginFormsElement.current) {
              setCurrentUserData((currentValue) => {
                const copiedCurrentValue = { ...currentValue } as currentUserType;
                const emailInputElement = formElementRef.current?.elements[0] as HTMLInputElement;
                const nameInputElement = formElementRef.current?.elements[1] as HTMLInputElement;
                const passwordInputElement = formElementRef.current?.elements[2] as HTMLInputElement;

                copiedCurrentValue.email = emailInputElement.value.trim();
                copiedCurrentValue.name = nameInputElement.value;
                copiedCurrentValue.password = passwordInputElement.value.trim();

                if (currentUserData.profileImage) {
                  setIsLoading(true);
                  createUser(copiedCurrentValue, createNotification);
                }
                return copiedCurrentValue;
              });
            }
          }}>
          Zarejestruj się
        </Button>
      </form>
      <div className="separator-line">
        <p>Masz już konto?</p>
      </div>
      <Button
        style={{ marginTop: "32px" }}
        show="LoginForm"
        animationIn={{ className: "animationIn", duration: 500 }}
        animationOut={{ className: "animationOut", duration: 500 }}>
        Zaloguj się!
      </Button>
    </div>
  );
};

export default RegisterForm;
