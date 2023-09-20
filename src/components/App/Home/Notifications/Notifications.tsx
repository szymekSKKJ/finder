import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import "./Notifications.scss";
import { CurrentUserStateContext } from "../../App";
import { currentUserNotNullType } from "../../../../types";
import { db } from "../../../../firebaseInitialization";
import { QueryDocumentSnapshot, Timestamp, collection, doc, getDocs, limit, orderBy, query, updateDoc } from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { keyWords } from "../../../../custom/notifications/uploadNotification";
import Button from "../../../Global/Button/Button";

const getNotifications = async (
  currentUserId: string,
  setNotifications: Dispatch<
    SetStateAction<
      {
        id: string;
        profileImage: string;
        content: string;
        isRead: boolean;
        name: string;
        type: string;
        uploadedAt: Timestamp;
        userIdOfCreatedPost: string;
        postId: string;
        replyId: string;
        commentId: string;
      }[]
    >
  >,
  setIsLoadingNotifications: Dispatch<SetStateAction<boolean>>
) => {
  const notifications: {
    id: string;
    profileImage: string;
    content: string;
    isRead: boolean;
    name: string;
    type: string;
    uploadedAt: Timestamp;
    userIdOfCreatedPost: string;
    postId: string;
    replyId: string;
    commentId: string;
  }[] = [];

  const usersImages: {
    userId: string;
    profileImage: string;
  }[] = [];

  const usersIsWithourRepetition: string[] = [];

  const querySnapshot = await getDocs(query(collection(db, "users", currentUserId, "notifications"), orderBy("uploadedAt"), limit(20)));

  const querySnapshotData: QueryDocumentSnapshot[] = [];

  querySnapshot.forEach((doc) => {
    querySnapshotData.push(doc);

    const {
      data: { currentUserId: userId },
    } = doc.data();

    const doesThisIdExist = usersIsWithourRepetition.some((usersId) => usersId === userId);

    if (doesThisIdExist === false) {
      usersIsWithourRepetition.push(userId);
    }
  });

  await Promise.all(
    usersIsWithourRepetition.map(async (userId) => {
      const storage = getStorage();
      const profileImageUrl = await getDownloadURL(ref(storage, `users/${userId}/profileImage.png`));

      usersImages.push({
        userId: userId,
        profileImage: profileImageUrl,
      });
    })
  );

  querySnapshotData.map((doc) => {
    const { data, content, isRead, type, uploadedAt } = doc.data();
    const { currentUserId: userId, userIdOfCreatedPost, postId, replyId, commentId, userName } = data;

    const existedUserImage = usersImages.find((userImage) => userImage.userId === userId)!;

    notifications.push({
      id: doc.id,
      profileImage: existedUserImage.profileImage,
      content: content,
      isRead: isRead,
      name: userName,
      type: type,
      uploadedAt: uploadedAt,
      userIdOfCreatedPost: userIdOfCreatedPost,
      postId: postId,
      replyId: replyId,
      commentId: commentId,
    });
  });

  setNotifications(notifications);
  setIsLoadingNotifications(false);
};

const markAsRead = async (notificationsId: string, currentUserId: string) => {
  await updateDoc(doc(db, "users", currentUserId, "notifications", notificationsId), {
    isRead: true,
  });
};

const Notifications = ({
  setActivePost,
}: {
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
  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);

  const [notifications, setNotifications] = useState<
    {
      id: string;
      profileImage: string;
      content: string;
      isRead: boolean;
      name: string;
      type: string;
      uploadedAt: Timestamp;
      userIdOfCreatedPost: string;
      postId: string;
      replyId: string;
      commentId: string;
    }[]
  >([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;

  useEffect(() => {
    if (notifications.length === 0) {
      getNotifications(currentUserData.id, setNotifications, setIsLoadingNotifications);
    }
  }, []);

  const sortedNotifications = notifications.sort((a, b) => b.uploadedAt.seconds - a.uploadedAt.seconds);

  return (
    <div className="notifications">
      {isLoadingNotifications === false && sortedNotifications.length !== 0
        ? sortedNotifications.map((notification) => {
            const { content, profileImage, type, isRead, id, uploadedAt, userIdOfCreatedPost, postId, commentId, replyId, name } = notification;

            const splittedContent = content.split(" ");

            return (
              <Button
                show={postId ? "NotificationPost" : ""}
                key={id}
                animationIn={{ className: "animation-in", duration: 500 }}
                animationOut={{ className: "animation-out", duration: 500 }}
                onClick={() => {
                  markAsRead(id, currentUserData.id);
                  if (postId) {
                    setActivePost({
                      postId: postId,
                      userIdOfCreatedPost: userIdOfCreatedPost,
                      commentId: commentId,
                      replyId: replyId,
                      type: type,
                    });
                  }
                }}>
                <div className={`notification ${isRead ? "" : "not-read"}`}>
                  <div className="image">
                    <img src={profileImage}></img>
                  </div>
                  <div className="content-and-date-wrapper">
                    <p className="content">
                      {splittedContent.map((word) => {
                        if (word === name || word === currentUserData.name) {
                          return <span key={word} className="user-name">{`${word} `}</span>;
                        } else if (keyWords.includes(word.toLowerCase())) {
                          return <span key={word} className="key-word">{`${word} `}</span>;
                        } else {
                          return `${word} `;
                        }
                      })}
                    </p>
                    <p className="date">
                      {new Date(uploadedAt.seconds * 1000).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "short",
                        minute: "2-digit",
                        hour: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </Button>
            );
          })
        : isLoadingNotifications === false && <p className="empty-notifications">Napisz post lub dodaj zdjęcie aby inni mogli je zobaczyć</p>}
    </div>
  );
};

export default Notifications;
