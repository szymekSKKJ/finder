import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import Button from "../../../../../Global/Button/Button";
import "./Post.scss";
import { CurrentUserStateContext } from "../../../../App";
import { currentUserNotNullType } from "../../../../../../types";
import { collection, addDoc, serverTimestamp, getDocs, increment, getDoc, where, documentId } from "firebase/firestore";
import { db } from "../../../../../../firebaseInitialization";
import { query, orderBy, limit, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Comment, { CommentSkeleton } from "./Comment/Comment";
import { GetActiveUserDataContext, SetImagesToDisplayContext, SetSharingPostContext } from "../../../Home";
import { uploadCommentPostNotification, uploadLikePostNotification } from "../../../../../../custom/notifications/uploadNotification";
import { activePostContext } from "../../../NotificationPost/NotificationPost";

const sendComment = async (
  commentContent: string,
  postId: string,
  currentUserData: currentUserNotNullType,
  setPostComments: Dispatch<
    SetStateAction<
      {
        id: string;
        repliesCounter: number;
        usersIdLikes: string[];
        content: string;
        uploadedAt: Date;
        user: { imgUrl: string; name: string; id: string };
      }[]
    >
  >,
  userId: string
) => {
  const docRef = await addDoc(collection(db, "users", userId, "posts", postId, "comments"), {
    user: { id: currentUserData.id, name: currentUserData.name },
    usersIdLikes: [],
    content: commentContent,
    uploadedAt: serverTimestamp(),
    repliesCounter: 0,
  });

  await updateDoc(doc(db, "users", userId, "posts", postId), {
    commentsCounter: increment(1),
  });

  await uploadCommentPostNotification(userId, currentUserData.name, postId, docRef.id, currentUserData.id);

  setPostComments((currentComments) => {
    const copiedCurrentComments = [...currentComments];

    copiedCurrentComments.unshift({
      repliesCounter: 0,
      id: docRef.id,
      usersIdLikes: [],
      content: commentContent,
      uploadedAt: new Date(),
      user: { imgUrl: currentUserData.profileImage, name: currentUserData.name, id: currentUserData.id },
    });

    return copiedCurrentComments;
  });
};

const getPostComments = async (
  userId: string,
  postId: string,
  commentsLimit: number,
  setPostComments: Dispatch<
    SetStateAction<
      {
        id: string;
        repliesCounter: number;
        usersIdLikes: string[];
        content: string;
        uploadedAt: Date;
        user: { imgUrl: string; name: string; id: string };
      }[]
    >
  >,
  setIsLoadingComments: Dispatch<SetStateAction<boolean>>,
  activePost: null | {
    postId: string;
    userIdOfCreatedPost: string;
    commentId: string;
    replyId: string;
    type: string;
  }
) => {
  const q = activePost?.commentId
    ? query(collection(db, "users", userId, "posts", postId, "comments"), limit(1), where(documentId(), "==", activePost.commentId))
    : query(collection(db, "users", userId, "posts", postId, "comments"), orderBy("uploadedAt", "desc"), limit(commentsLimit));
  const querySnapshot = await getDocs(q);
  const postComments: {
    id: string;
    usersIdLikes: string[];
    content: string;
    repliesCounter: number;
    uploadedAt: Date;
    user: { id: string; imgUrl: string; name: string };
  }[] = [];

  querySnapshot.forEach((doc) => {
    const { content, uploadedAt, user, usersIdLikes, repliesCounter } = doc.data();

    postComments.push({
      repliesCounter: repliesCounter,
      id: doc.id,
      usersIdLikes: usersIdLikes,
      user: { id: user.id, imgUrl: "", name: user.name },
      content: content,
      uploadedAt: new Date(uploadedAt.seconds * 1000),
    });
  });

  await Promise.all(
    postComments.map(async (post) => {
      const { user } = post;
      const storage = getStorage();

      const userImageUrl = await getDownloadURL(ref(storage, `users/${user.id}/profileImage.png`));

      user.imgUrl = userImageUrl;
    })
  );

  postComments.sort((a, b) => {
    if (a.uploadedAt && b.uploadedAt) {
      return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    } else {
      return 0;
    }
  });

  setPostComments(postComments);
  setIsLoadingComments(false);
};

const likePost = async (
  userId: string,
  currentUser: currentUserNotNullType,
  postId: string,
  doILikeThisPost: boolean,
  setPostData: Dispatch<
    SetStateAction<{
      userId: string;
      usersIdLikes: string[];
      commentsCounter: number;
      id: string;
      content: string;
      uploadedAt: Date;
      images: { id: string; url: string; updatedAt: Date }[];
      sharingPostsCounter: number;
      sharingPost: {
        id: string;
        userId: string;
        commentsCounter: number;
        usersIdLikes: string[];
        content: string;
        uploadedAt: Date;
        images: { id: string; url: string; updatedAt: Date }[];
        sharingPost: null;
        sharingPostsCounter: number;
      } | null;
    }>
  >
) => {
  if (doILikeThisPost) {
    setPostData((currentData) => {
      const copiedCurrentData = { ...currentData };

      const doILikeThisPost = copiedCurrentData.usersIdLikes.some((currentUsersId) => currentUsersId === currentUser.id);

      if (doILikeThisPost) {
        const index = copiedCurrentData.usersIdLikes.indexOf(currentUser.id);

        copiedCurrentData.usersIdLikes.splice(index, 1);

        copiedCurrentData.usersIdLikes;
      }

      return copiedCurrentData;
    });

    await updateDoc(doc(db, "users", userId, "posts", postId), {
      usersIdLikes: arrayRemove(currentUser.id),
    });
  } else {
    setPostData((currentData) => {
      const copiedCurrentData = { ...currentData };

      const doILikeThisPost = copiedCurrentData.usersIdLikes.some((currentUsersId) => currentUsersId === currentUser.id);

      if (doILikeThisPost === false) {
        copiedCurrentData.usersIdLikes.push(currentUser.id);

        copiedCurrentData.usersIdLikes;
      }

      return copiedCurrentData;
    });

    await updateDoc(doc(db, "users", userId, "posts", postId), {
      usersIdLikes: arrayUnion(currentUser.id),
    });

    await uploadLikePostNotification(userId, currentUser.name, postId, currentUser.id);
  }
};

const getUserProfileData = async (userId: string, setUserProfileData: Dispatch<SetStateAction<currentUserNotNullType | null>>) => {
  const docSnap = await getDoc(doc(db, "users", userId));

  const { description, name, skills, followers, lastActive, dateOfBirthday, stars, following, gender, givenStarsTo, leftStars } = docSnap.data()!;

  const storage = getStorage();
  const profileImageUrl = await getDownloadURL(ref(storage, `users/${userId}/profileImage.png`));

  try {
    const backgroundImageUrl = await getDownloadURL(ref(storage, `users/${userId}/backgroundImage.png`));
    setUserProfileData({
      id: userId,
      followers: followers,
      profileImage: profileImageUrl,
      backgroundImage: backgroundImageUrl,
      description: description,
      name: name,
      skills: skills,
      lastActive: lastActive,
      dateOfBirthday: new Date(dateOfBirthday.seconds * 1000),
      stars: stars,
      following: following,
      gender: gender,
      givenStarsTo: givenStarsTo,
      leftStars: leftStars,
    });
  } catch {
    setUserProfileData({
      id: userId,
      followers: followers,
      profileImage: profileImageUrl,
      backgroundImage: "",
      description: description,
      name: name,
      skills: skills,
      lastActive: lastActive,
      dateOfBirthday: new Date(dateOfBirthday.seconds * 1000),
      stars: stars,
      following: following,
      gender: gender,
      givenStarsTo: givenStarsTo,
      leftStars: leftStars,
    });
  }
};

const Post = ({
  postData: oldPostData,
}: {
  postData: {
    userId: string;
    commentsCounter: number;
    usersIdLikes: string[];
    id: string;
    content: string;
    uploadedAt: Date;
    images: { id: string; url: string; updatedAt: Date }[];
    sharingPostsCounter: number;
    sharingPost: {
      id: string;
      userId: string;
      commentsCounter: number;
      usersIdLikes: string[];
      content: string;
      uploadedAt: Date;
      images: { id: string; url: string; updatedAt: Date }[];
      sharingPost: null;
      sharingPostsCounter: number;
    } | null;
  };
}) => {
  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);
  const activePost = useContext(activePostContext);
  const setImagesToDisplay = useContext(SetImagesToDisplayContext);
  const setSharingPost = useContext(SetSharingPostContext);

  const getActiveUserDataContext = useContext(GetActiveUserDataContext);

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;

  const [postData, setPostData] = useState<{
    userId: string;
    usersIdLikes: string[];
    commentsCounter: number;
    id: string;
    content: string;
    uploadedAt: Date;
    images: { id: string; url: string; updatedAt: Date }[];
    sharingPostsCounter: number;
    sharingPost: {
      id: string;
      userId: string;
      commentsCounter: number;
      usersIdLikes: string[];
      content: string;
      uploadedAt: Date;
      images: { id: string; url: string; updatedAt: Date }[];
      sharingPost: null;
      sharingPostsCounter: number;
    } | null;
  }>(oldPostData);

  const { images, content, id, usersIdLikes } = postData;

  const [areCommentsOpened, setAreCommentsOpened] = useState(activePost?.commentId ? true : false);
  const [commentsLimit, setCommentsLimit] = useState(20);
  const [isLoadnigComments, setIsLoadingComments] = useState(true);
  const [writeCommentContent, setWriteCommentContent] = useState("");
  const [postComments, setPostComments] = useState<
    {
      id: string;
      usersIdLikes: string[];
      content: string;
      uploadedAt: Date;
      repliesCounter: number;
      user: { imgUrl: string; name: string; id: string };
    }[]
  >([]);
  const [userProfileData, setUserProfileData] = useState<currentUserNotNullType | null>(null);

  const sharingPostData = { ...postData } as {
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

  sharingPostData.sharingPost = null;

  useEffect(() => {
    if (userProfileData === null) {
      getUserProfileData(postData.userId, setUserProfileData);
    }
  }, []);

  useEffect(() => {
    if (areCommentsOpened) {
      getPostComments(postData.userId, id, commentsLimit, setPostComments, setIsLoadingComments, activePost);
    }
  }, [commentsLimit, areCommentsOpened]);

  const doILikeThisPost = usersIdLikes.some((userId) => userId === currentUserData.id);

  const isStarUserPost = currentUserData.givenStarsTo.some((starUserId) => starUserId === postData.userId);

  return (
    <div className={`post-wrapper ${isStarUserPost ? "star" : ""}`}>
      {isStarUserPost && (
        <div className="star-post">
          <i className="fa-solid fa-star"></i>
        </div>
      )}
      {currentUserData && userProfileData && (
        <div className="post">
          <Button
            show={"UserProfile"}
            className="move-to-user-profile-button"
            animationIn={{ className: "animation-in", duration: 500 }}
            animationOut={{ className: "animation-out", duration: 500 }}
            onClick={() => {
              getActiveUserDataContext(userProfileData.id);
            }}>
            <div className="user">
              <div className="image">
                <img src={userProfileData.profileImage}></img>
              </div>
              <div className="username-and-date-wrapper">
                <p className="username">{userProfileData.name}</p>
                <p className="uploaded-date">
                  {postData.uploadedAt.toLocaleDateString("pl-PL", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </Button>

          <p className="content">
            {postData.sharingPost && (
              <span className="shared">
                <i className="fa-light fa-share"></i>
              </span>
            )}
            {content}
          </p>
          <div className="attached-images">
            {images.length !== 0 &&
              images.map((image) => {
                if (image) {
                  return (
                    <div
                      className="image loaded"
                      key={image.id}
                      onClick={() => {
                        // setLastContent("News"); //!
                        const imagesUrl = images.map((image) => image.url);
                        setImagesToDisplay(imagesUrl);
                      }}>
                      <img
                        style={{ backgroundImage: `url("${image.url}")` }}
                        loading="lazy"
                        onLoad={(event) => {
                          const imageElemenet = event.currentTarget.parentElement as HTMLDivElement;
                          setTimeout(() => {
                            imageElemenet.classList.add("loaded");
                          });
                        }}></img>
                    </div>
                  );
                }
              })}
          </div>
          {postData.sharingPost && (
            <div className="sharing-post">
              <Post postData={postData.sharingPost}></Post>
            </div>
          )}
          <div className="actions">
            <button onClick={() => likePost(postData.userId, currentUserData, id, doILikeThisPost, setPostData)}>
              <i className={`${doILikeThisPost ? "fa-solid fa-heart" : "fa-regular fa-heart"}`}></i> {usersIdLikes.length}
            </button>
            <button onClick={() => setAreCommentsOpened((currentValue) => (currentValue === true ? false : true))}>
              <i className="fa-regular fa-bars-staggered"></i> {postData.commentsCounter}
            </button>
            {postData.sharingPost === null && (
              <button onClick={() => setSharingPost(sharingPostData)}>
                <i className="fa-light fa-share"></i> {postData.sharingPostsCounter}
              </button>
            )}
          </div>
          <div
            className={`comments ${areCommentsOpened ? "showed" : ""}`}
            onScroll={(event) => {
              const elementScrollHeight = event.currentTarget.scrollHeight - event.currentTarget.clientHeight - 100;

              if (event.currentTarget.scrollTop > elementScrollHeight && postComments.length >= commentsLimit) {
                setCommentsLimit((currentValue) => currentValue + 20);
                setIsLoadingComments(true);
              }
            }}>
            <div className="write-comment">
              <div className="image-and-username-and-comment-content-wrapper">
                <div className="image">
                  <img src={currentUserData.profileImage}></img>
                </div>
                <div className="username-and-comment-content-wrapper">
                  <p className="username">{currentUserData.name}</p>
                  <span className="textarea" role="textbox" contentEditable onInput={(event) => setWriteCommentContent(event.currentTarget.innerHTML)}></span>
                  <Button
                    onClick={async (event) => {
                      const textareaElement = event.currentTarget.parentElement?.querySelector(".textarea") as HTMLSpanElement;

                      await sendComment(writeCommentContent, id, currentUserData, setPostComments, postData.userId);

                      textareaElement.innerHTML = ""; // :(
                    }}>
                    Wyślij
                  </Button>
                </div>
              </div>
            </div>
            {postComments.length !== 0 &&
              postComments.map((comment) => {
                const { content, usersIdLikes, id: commentId, user, repliesCounter } = comment;

                return (
                  <Comment
                    key={commentId}
                    setPostComments={setPostComments}
                    repliesCounter={repliesCounter}
                    postId={id}
                    content={content}
                    id={commentId}
                    user={user}
                    userId={postData.userId}
                    userProfileData={userProfileData}
                    usersIdLikes={usersIdLikes}></Comment>
                );
              })}
            {isLoadnigComments && (
              <>
                <CommentSkeleton></CommentSkeleton>
                <CommentSkeleton></CommentSkeleton>
                <CommentSkeleton></CommentSkeleton>
                <CommentSkeleton></CommentSkeleton>
                <CommentSkeleton></CommentSkeleton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;
