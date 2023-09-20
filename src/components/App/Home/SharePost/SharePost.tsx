import { useContext, useRef } from "react";
import MainPosts from "../UserProfile/MainPosts/MainPosts";
import { CurrentUserStateContext } from "../../App";
import { currentUserNotNullType } from "../../../../types";
import "./SharePost.scss";

const SharePost = ({
  sharingPost,
}: {
  sharingPost: null | {
    id: string;
    userId: string;
    commentsCounter: number;
    usersIdLikes: string[];
    content: string;
    uploadedAt: Date;
    images: { id: string; url: string; updatedAt: Date }[];
    sharingPost: null;
    sharingPostsCounter: number;
  };
}) => {
  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;

  const sharePostElementRef = useRef<null | HTMLDivElement>(null);

  return (
    <div className="share-post" ref={sharePostElementRef}>
      {sharingPost && (
        <MainPosts
          usersId={[sharingPost.userId]}
          sharingPost={sharingPost}
          scrollableElement={sharePostElementRef.current}
          userId={currentUserData.id}></MainPosts>
      )}
    </div>
  );
};

export default SharePost;
