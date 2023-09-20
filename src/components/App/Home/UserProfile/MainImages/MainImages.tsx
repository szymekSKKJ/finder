import { Dispatch, SetStateAction, useContext } from "react";
import "./MainImages.scss";
import { CurrentUserStateContext } from "../../../App";

const MainImages = ({
  images,
  setActivePost,
}: {
  images: { id: number; url: string; uploadedAt: Date; postId: string }[];
  setActivePost: Dispatch<
    SetStateAction<{
      postId: string;
      userIdOfCreatedPost: string;
      commentId: string;
      replyId: string;
      type: string;
    } | null>
  >;
}) => {
  const [currentUserData] = useContext(CurrentUserStateContext);

  return (
    <div className="main-images">
      {images &&
        currentUserData.id &&
        images.map((image) => {
          return (
            <div
              className="item"
              key={image.id}
              onClick={() => {
                const showNotificationPostButton = document.querySelector(".user-profile-wrapper .show-notification-post-button") as HTMLButtonElement;
                showNotificationPostButton.click();
                setActivePost({
                  postId: image.postId,
                  userIdOfCreatedPost: currentUserData.id!,
                  commentId: "",
                  replyId: "",
                  type: "",
                });
              }}>
              <img style={{ backgroundImage: `url("${image.url}")` }}></img>
            </div>
          );
        })}
    </div>
  );
};

export default MainImages;
