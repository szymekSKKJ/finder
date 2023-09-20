import "./Button.scss";
import React, { ReactNode } from "react";
import { TransitionButton } from "react-components-transition/ComponentsTransition";

// {
//   children,
//   show,
//   isValid,
//   animationIn,
//   animationOut,
//   className = "",
//   onClick,
// }: {
//   children: ReactNode;
//   isValid?: boolean;
//   show?: string;

//   className: string;
//   onClick: React.MouseEventHandler<HTMLButtonElement>;
// },

const Button = ({
  show,
  isValid = true,
  children,
  animationIn,
  animationOut,
  className = "",
  context = null,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  show?: string;
  isValid?: boolean;
  children?: ReactNode;
  animationIn?:
    | {
        className: string;
        duration: number;
      }
    | null
    | undefined;
  animationOut?:
    | {
        className: string;
        duration: number;
      }
    | null
    | undefined;
  className?: string;
  context?: null | any;
}) => {
  if (show) {
    return (
      <TransitionButton
        show={show}
        context={context}
        animationIn={animationIn}
        animationOut={animationOut}
        className={`${className} ${isValid ? "valid" : "not-valid"} default-button`}
        {...props}>
        {children}
      </TransitionButton>
    );
  } else {
    return (
      <button className={`${className} ${isValid ? "valid" : "not-valid"} default-button`} {...props}>
        {children}
      </button>
    );
  }
};

export default Button;
