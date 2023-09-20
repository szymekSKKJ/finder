import "./News.scss";

import MainPosts from "../UserProfile/MainPosts/MainPosts";
import { useContext, useRef } from "react";
import { CurrentUserStateContext } from "../../App";
import { currentUserNotNullType } from "../../../../types";

const News = () => {
  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;

  const mergedUsersId =
    currentUserData.following && currentUserData.following.concat(currentUserData.following.filter((item) => currentUserData.following.indexOf(item) < 0));

  const newsElementRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="news" ref={newsElementRef}>
      {mergedUsersId && currentUserData.following.length !== 0 && newsElementRef.current ? (
        <MainPosts usersId={mergedUsersId} userId={currentUserData.id} scrollableElement={newsElementRef.current}></MainPosts>
      ) : (
        <p className="empty-posts">Followuj użytkowników aby być z nimi na bieżąco</p>
      )}
    </div>
  );
};

export default News;
