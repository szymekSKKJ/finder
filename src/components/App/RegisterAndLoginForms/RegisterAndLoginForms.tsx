import LoginForm from "./LoginForm/LoginForm";
import RegisterForm from "./RegisterForm/RegisterForm";
import "./RegisterAndLoginForms.scss";
import { useContext, useRef } from "react";
import ComponentsTransition, { useGetTransitionContext } from "react-components-transition/ComponentsTransition";
import { CurrentUserStateContext } from "../App";

const RegisterAndLoginForms = () => {
  const RegisterAndLoginFormsElementRef = useRef<HTMLDivElement | null>(null);
  const mainContext = useGetTransitionContext();
  const [currentUserData] = useContext(CurrentUserStateContext);

  return (
    <div className="register-and-login-forms" ref={RegisterAndLoginFormsElementRef}>
      <ComponentsTransition parentElementRef={RegisterAndLoginFormsElementRef} firstVisible={currentUserData.email ? "RegisterForm" : "LoginForm"}>
        <LoginForm registerAndLoginFormsElement={RegisterAndLoginFormsElementRef} key="LoginForm"></LoginForm>
        <RegisterForm mainContext={mainContext} registerAndLoginFormsElement={RegisterAndLoginFormsElementRef} key="RegisterForm"></RegisterForm>
      </ComponentsTransition>
    </div>
  );
};

export default RegisterAndLoginForms;
