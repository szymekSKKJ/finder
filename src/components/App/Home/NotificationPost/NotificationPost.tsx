import { createContext } from "react";
import MainPosts from "../UserProfile/MainPosts/MainPosts";
import "./NotificationPost.scss";

export const activePostContext = createContext<null | {
  postId: string;
  userIdOfCreatedPost: string;
  commentId: string;
  replyId: string;
  type: string;
}>(null);

const NotificationPost = ({
  activePost,
}: {
  activePost: {
    postId: string;
    userIdOfCreatedPost: string;
    commentId: string;
    replyId: string;
    type: string;
  } | null;
}) => {
  const ownerPostUserId = activePost ? activePost.userIdOfCreatedPost : "";

  return (
    <div className="notification-post">
      {activePost && (
        <activePostContext.Provider value={activePost}>
          <MainPosts usersId={[ownerPostUserId]}></MainPosts>
        </activePostContext.Provider>
      )}
    </div>
  );
};

export default NotificationPost;
