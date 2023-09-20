import { Dispatch, SetStateAction, useEffect } from "react";
import "./NotificationGlobal.scss";

type notification = {
  response: string;
  isPositive: boolean;
};

const NotificationGlobal = ({
  response,
  isPositive,
  setNotifications,
}: {
  response: string;
  isPositive: boolean;
  setNotifications: Dispatch<SetStateAction<notification[]>>;
}) => {
  useEffect(() => {
    setTimeout(() => {
      setNotifications((currentValues) => {
        const copiedCurrentValues = [...currentValues];

        const foundNotification = copiedCurrentValues.find((notification) => notification.response === response)!;

        const indexOfNotification = copiedCurrentValues.indexOf(foundNotification);

        copiedCurrentValues.splice(indexOfNotification, 1);

        return copiedCurrentValues;
      });
    }, 4000);
  }, []);
  return (
    <div className={`notification-global ${isPositive ? "positive" : ""}`}>
      <p className="content">{response}</p>
    </div>
  );
};

export default NotificationGlobal;
