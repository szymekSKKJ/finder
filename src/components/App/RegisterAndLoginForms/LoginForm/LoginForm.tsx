import React, { Dispatch, FormEvent, MutableRefObject, SetStateAction, useContext, useState } from "react";
import Input from "../../../Global/Input/Input";
import Button from "../../../Global/Button/Button";
import "./LoginForm.scss";
import { CreateNotificationContext, CurrentUserStateContext, loginAndGetUserData, SetIsLoadingContext } from "../../App";
import { currentUserType } from "../../../../types";
import { FirebaseError } from "firebase/app";

const isEmpty = (str: string) => !str.trim().length;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const signIn = async (
  email: string,
  password: string,
  registerAndLoginFormsElement: MutableRefObject<HTMLDivElement | null>,
  setCurrentUserData: Dispatch<SetStateAction<currentUserType>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  createNotification: (errorCode: string, isPositive?: boolean) => void
) => {
  if (registerAndLoginFormsElement.current) {
    const error = await loginAndGetUserData(setCurrentUserData, setIsLoading, email, password);

    if (error) {
      const errorData = error as FirebaseError;
      createNotification(errorData.code);
    } else {
      window.location.reload();
    }
  }
};

const setInputState = (
  inputValue: string,
  setInputElementsState: React.Dispatch<SetStateAction<{ id: number; type: string; placeholder: string; isCorrect: boolean }[]>>,
  id: number
) => {
  setInputElementsState((currentValue) => {
    const copiedCurrentValue = [...currentValue];

    // foundInputObject cannot be undefind because all these values are initialized while rendering
    const foundInputObject = copiedCurrentValue.find((inputObject) => inputObject.id === id)!;

    if (!isEmpty(inputValue)) {
      foundInputObject.isCorrect = true;
    } else {
      foundInputObject.isCorrect = false;
    }

    return copiedCurrentValue;
  });
};

const giveFocusToNotCorrectFilledInput = (
  event: FormEvent<HTMLFormElement>,
  inputElementsState: { id: number; type: string; placeholder: string; isCorrect: boolean }[]
) => {
  event.preventDefault();
  const inputElements = event.currentTarget.querySelectorAll("input");

  const notCorrectInput = inputElementsState.find((inputObject: { isCorrect: boolean }) => inputObject.isCorrect === false);

  if (notCorrectInput) {
    inputElements[notCorrectInput.id - 1].focus();
  }
};

const LoginForm = ({ registerAndLoginFormsElement }: { registerAndLoginFormsElement: MutableRefObject<HTMLDivElement | null> }) => {
  const [inputElementsState, setInputElementsState] = useState<{ id: number; type: string; placeholder: string; isCorrect: boolean }[]>([
    { id: 1, type: "text", placeholder: "Email", isCorrect: false },
    { id: 2, type: "password", placeholder: "Hasło", isCorrect: false },
  ]);
  const setIsLoading = useContext(SetIsLoadingContext);

  const [, setCurrentUserData] = useContext(CurrentUserStateContext);
  const createNotification = useContext(CreateNotificationContext);

  const isFormCorrect = !inputElementsState.some((inputObject) => inputObject.isCorrect === false);

  return (
    <div className="login-form-wrapper">
      <h1>Zaloguj się!</h1>
      <form className="login-form" noValidate onSubmit={(event) => giveFocusToNotCorrectFilledInput(event, inputElementsState)}>
        {inputElementsState.map((inputObject) => {
          const { type, placeholder, id } = inputObject;

          return (
            <Input
              type={type}
              placeholder={placeholder}
              key={id}
              onChange={(event) => setInputState(event.currentTarget.value, setInputElementsState, id)}></Input>
          );
        })}
        <div className="forgot-password">
          <p>
            Zapomniałeś hasła? <span>Kliknij tutaj!</span>
          </p>
        </div>
        <Button
          isValid={isFormCorrect}
          style={{ marginTop: "50px" }}
          onClick={(event) => {
            if (isFormCorrect) {
              const formElement = event.currentTarget.closest("form");

              const emailInputElement = formElement?.elements[0] as HTMLInputElement;
              const passwordInputElement = formElement?.elements[1] as HTMLInputElement;

              setIsLoading(true);

              signIn(
                emailInputElement.value.trim(),
                passwordInputElement.value.trim(),
                registerAndLoginFormsElement,
                setCurrentUserData,
                setIsLoading,
                createNotification
              );
            }
          }}>
          Zaloguj się!
        </Button>
      </form>
      <div className="separator-line">
        <p>Nie masz konta?</p>
      </div>
      <Button
        style={{ marginTop: "32px" }}
        show="RegisterForm"
        animationIn={{ className: "animationIn", duration: 500 }}
        animationOut={{ className: "animationOut", duration: 500 }}>
        Zarejestruj się!
      </Button>
    </div>
  );
};

export default LoginForm;
