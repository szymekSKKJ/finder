import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import "./Comment.scss";
import { CurrentUserStateContext } from "../../../../../App";
import {
  DocumentData,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  documentId,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../../../../../firebaseInitialization";
import Button from "../../../../../../Global/Button/Button";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { currentUserNotNullType } from "../../../../../../../types";
import { GetActiveUserDataContext } from "../../../../Home";
import {
  uploadLikeCommentPostNotification,
  uploadLikeReplyCommentPostNotification,
  uploadReplyCommentPostNotification,
  uploadReplyOfReplyCommentPostNotification,
} from "../../../../../../../custom/notifications/uploadNotification";
import { activePostContext } from "../../../../NotificationPost/NotificationPost";

const likeCommment = async (
  postId: string,
  currentUser: currentUserNotNullType,
  commentId: string,
  doILikeThisComment: boolean,
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
  userId: string,
  userProfileData: currentUserNotNullType,
  userIdOfComment: string
) => {
  if (doILikeThisComment) {
    setPostComments((currentComments) => {
      const copiedCurrentComments = [...currentComments];

      const likedComment = copiedCurrentComments.find((comment) => comment.id === commentId)!;

      const doILikeThisComment = likedComment.usersIdLikes.some((usersId) => usersId === currentUser.id);

      if (doILikeThisComment) {
        const index = likedComment.usersIdLikes.indexOf(currentUser.id);

        likedComment.usersIdLikes.splice(index, 1);
      }

      return copiedCurrentComments;
    });

    await updateDoc(doc(db, "users", userId, "posts", postId, "comments", commentId), {
      usersIdLikes: arrayRemove(currentUser.id),
    });
  } else {
    setPostComments((currentComments) => {
      const copiedCurrentComments = [...currentComments];

      const likedComment = copiedCurrentComments.find((comment) => comment.id === commentId)!;

      const doILikeThisComment = likedComment.usersIdLikes.some((usersId) => usersId === currentUser.id);

      if (doILikeThisComment === false) {
        likedComment.usersIdLikes.push(currentUser.id);
      }

      return copiedCurrentComments;
    });

    await updateDoc(doc(db, "users", userId, "posts", postId, "comments", commentId), {
      usersIdLikes: arrayUnion(currentUser.id),
    });

    await uploadLikeCommentPostNotification(userProfileData.id, userProfileData.name, userIdOfComment, currentUser.name, postId, commentId, currentUser.id);
  }
};

const sendReply = async (
  postId: string,
  id: string,
  currentUserData: currentUserNotNullType,
  content: string,
  setReplies: Dispatch<
    SetStateAction<
      {
        id: string;
        usersIdLikes: string[];
        content: string;
        uploadedAt: Date;
        user: { id: string; imgUrl: string; name: string };
        replingTo: {
          id: string;
          name: string;
        } | null;
      }[]
    >
  >,
  replingUser: {
    id: string;
    name: string;
  } | null,
  userId: string,
  userProfileData: currentUserNotNullType
) => {
  const docRef = await addDoc(collection(db, "users", userId, "posts", postId, "comments", id, "replies"), {
    content: content,
    uploadedAt: serverTimestamp(),
    user: { id: currentUserData.id, name: currentUserData.name },
    usersIdLikes: [],
    replingTo: replingUser,
  });

  await updateDoc(doc(db, "users", userId, "posts", postId), {
    commentsCounter: increment(1),
  });

  await updateDoc(doc(db, "users", userId, "posts", postId, "comments", id), {
    repliesCounter: increment(1),
  });

  if (replingUser) {
    await uploadReplyOfReplyCommentPostNotification(
      userProfileData.id,
      userProfileData.name,
      replingUser.id,
      currentUserData.name,
      postId,
      id,
      docRef.id,
      currentUserData.id
    );
  } else {
    await uploadReplyCommentPostNotification(userProfileData.id, userProfileData.name, userId, currentUserData.name, postId, id, docRef.id, currentUserData.id);
  }

  setReplies((currentReplies) => {
    const copiedCurrentReplies = [...currentReplies];

    copiedCurrentReplies.unshift({
      id: docRef.id,
      content: content,
      replingTo: replingUser,
      uploadedAt: new Date(),
      user: { id: currentUserData.id, imgUrl: currentUserData.profileImage, name: currentUserData.name },
      usersIdLikes: [],
    });

    return copiedCurrentReplies;
  });
};

const getReplies = async (
  setReplies: Dispatch<
    SetStateAction<
      {
        id: string;
        usersIdLikes: string[];
        content: string;
        uploadedAt: Date;
        user: { id: string; imgUrl: string; name: string };
        replingTo: {
          id: string;
          name: string;
        } | null;
      }[]
    >
  >,
  repliesLimit: number,
  userId: string,
  postId: string,
  commentId: string,
  setIsLoadingReplies: Dispatch<SetStateAction<boolean>>,
  activePost: null | {
    postId: string;
    userIdOfCreatedPost: string;
    commentId: string;
    replyId: string;
    type: string;
  }
) => {
  const q = activePost?.replyId
    ? query(collection(db, "users", userId, "posts", postId, "comments", commentId, "replies"), limit(1), where(documentId(), "==", activePost.replyId))
    : query(collection(db, "users", userId, "posts", postId, "comments", commentId, "replies"), orderBy("uploadedAt", "desc"), limit(repliesLimit));

  const querySnapshot = await getDocs(q);

  const repliesDocs: DocumentData[] = [];

  const replies: {
    id: string;
    usersIdLikes: string[];
    content: string;
    uploadedAt: Date;
    user: { id: string; imgUrl: string; name: string };
    replingTo: {
      id: string;
      name: string;
    } | null;
  }[] = [];

  querySnapshot.forEach(async (doc) => {
    repliesDocs.push(doc);
  });

  await Promise.all(
    repliesDocs.map(async (reply) => {
      const { content, uploadedAt, user, usersIdLikes, replingTo } = reply.data();

      const storage = getStorage();

      const url = await getDownloadURL(ref(storage, `users/${user.id}/profileImage.png`));

      replies.unshift({
        id: reply.id,
        usersIdLikes: usersIdLikes,
        content: content,
        uploadedAt: new Date(uploadedAt.seconds * 1000),
        user: { id: user.id, imgUrl: url, name: user.name },
        replingTo: replingTo,
      });
    })
  );

  replies.sort((a, b) => {
    if (a.uploadedAt && b.uploadedAt) {
      return b.uploadedAt.getTime() - a.uploadedAt.getTime();
    } else {
      return 0;
    }
  });

  setReplies(replies);
  setIsLoadingReplies(false);
};

const likeReply = async (
  setReplies: Dispatch<
    SetStateAction<
      {
        id: string;
        usersIdLikes: string[];
        content: string;
        uploadedAt: Date;
        user: { id: string; imgUrl: string; name: string };
        replingTo: {
          id: string;
          name: string;
        } | null;
      }[]
    >
  >,
  doILikeThisReply: boolean,
  replyId: string,
  currentUser: currentUserNotNullType,
  postId: string,
  commentId: string,
  userId: string,
  userProfileData: currentUserNotNullType
) => {
  if (doILikeThisReply) {
    setReplies((currentReplies) => {
      const copiedCurrentReplies = [...currentReplies];

      const likedReply = copiedCurrentReplies.find((reply) => reply.id === replyId)!;

      const doILikeThisReply = likedReply.usersIdLikes.some((usersId) => usersId === currentUser.id);

      if (doILikeThisReply) {
        const index = likedReply.usersIdLikes.indexOf(currentUser.id);

        likedReply.usersIdLikes.splice(index, 1);
      }

      return copiedCurrentReplies;
    });

    await updateDoc(doc(db, "users", userId, "posts", postId, "comments", commentId, "replies", replyId), {
      usersIdLikes: arrayRemove(currentUser.id),
    });
  } else {
    setReplies((currentReplies) => {
      const copiedCurrentComments = [...currentReplies];

      const likedReply = copiedCurrentComments.find((reply) => reply.id === replyId)!;

      const doILikeThisComment = likedReply.usersIdLikes.some((usersId) => usersId === currentUser.id);

      if (doILikeThisComment === false) {
        likedReply.usersIdLikes.push(currentUser.id);
      }

      return copiedCurrentComments;
    });

    await updateDoc(doc(db, "users", userId, "posts", postId, "comments", commentId, "replies", replyId), {
      usersIdLikes: arrayUnion(currentUser.id),
    });

    await uploadLikeReplyCommentPostNotification(
      userProfileData.id,
      userProfileData.name,
      userId,
      currentUser.name,
      postId,
      commentId,
      replyId,
      currentUser.id
    );
  }
};

const createSkeletonCommentReplyElements = () => {
  const postElements = [];

  for (let i = 0; i <= 5; i++) {
    postElements.push(
      <div className="reply-skeleton" key={i}>
        <div className="image-and-username-and-comment-content-wrapper">
          <div className="image"></div>
          <div className="username-and-comment-content-wrapper">
            <p className="username"></p>
            <p className="comment-content"></p>
          </div>
        </div>
        <div className="actions">
          <button></button>
          <button></button>
        </div>
      </div>
    );
  }
  return postElements;
};

const Comment = ({
  postId,
  content,
  id,
  user,
  usersIdLikes,
  repliesCounter,
  userId,
  setPostComments,
  userProfileData,
}: {
  postId: string;
  content: string;
  id: string;
  repliesCounter: number;
  user: { imgUrl: string; name: string; id: string };
  usersIdLikes: string[];
  userId: string;
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
  >;
  userProfileData: currentUserNotNullType | null;
}) => {
  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);
  const activePost = useContext(activePostContext);

  const getActiveUserDataContext = useContext(GetActiveUserDataContext);

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;

  const [areRepliesOpened, setAreRepliesOpened] = useState(activePost?.replyId ? true : false);
  const [replies, setReplies] = useState<
    {
      id: string;
      usersIdLikes: string[];
      content: string;
      uploadedAt: Date;
      user: { id: string; imgUrl: string; name: string };
      replingTo: {
        id: string;
        name: string;
      } | null;
    }[]
  >([]);
  const [repliesLimit, setRepliesLimit] = useState(20);
  const [replyContent, setReplyContent] = useState("");
  const [isLoadingReplies, setIsLoadingReplies] = useState(true);
  const [replingUser, setReplingUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const repliesElementRef = useRef<HTMLDivElement | null>(null);
  const commentsElementRef = useRef<HTMLDivElement | null>(null);

  const doILikeThisComment = usersIdLikes.some((id) => id === currentUserData.id);

  useEffect(() => {
    if (areRepliesOpened) {
      getReplies(setReplies, repliesLimit, userId, postId, id, setIsLoadingReplies, activePost);

      activePost === null &&
        repliesElementRef.current?.parentElement?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
    }
  }, [areRepliesOpened, repliesLimit]);

  return (
    <div className={`comment ${activePost?.commentId ? "from-notification" : ""}`} ref={commentsElementRef}>
      {currentUserData.id && userProfileData && (
        <>
          <div className="image-and-username-and-comment-content-wrapper">
            <Button
              show={"UserProfile"}
              className="move-to-user-profile-button"
              animationIn={{ className: "animation-in", duration: 500 }}
              animationOut={{ className: "animation-out", duration: 500 }}
              onClick={() => {
                getActiveUserDataContext(user.id);
              }}>
              <div className="image">
                <img src={user.imgUrl}></img>
              </div>
            </Button>

            <div className="username-and-comment-content-wrapper">
              <Button
                show={"UserProfile"}
                className="move-to-user-profile-button"
                animationIn={{ className: "animation-in", duration: 500 }}
                animationOut={{ className: "animation-out", duration: 500 }}
                onClick={() => {
                  getActiveUserDataContext(user.id);
                }}>
                <p className="username">{user.name}</p>
              </Button>

              <p className="comment-content">{content}</p>
            </div>
          </div>
          <div className="comment-actions">
            <button onClick={() => likeCommment(postId, currentUserData, id, doILikeThisComment, setPostComments, userId, userProfileData, user.id)}>
              <i className={`${doILikeThisComment ? "fa-solid fa-heart" : "fa-regular fa-heart"}`}></i> {usersIdLikes.length}
            </button>
            <button
              onClick={() => {
                setAreRepliesOpened((currentValue) => (currentValue === true ? false : true));
              }}>
              Odpowiedz {repliesCounter}
            </button>
          </div>
          <div
            onTransitionEnd={() => {
              if (areRepliesOpened) {
                commentsElementRef.current?.parentElement?.scrollBy({
                  top: 200,
                  behavior: "smooth",
                });
              }
            }}
            className={`replies-wrapper ${areRepliesOpened ? "opened" : ""}`}
            onScroll={(event) => {
              const elementScrollHeight = event.currentTarget.scrollHeight - event.currentTarget.clientHeight - 100;

              if (event.currentTarget.scrollTop > elementScrollHeight && replies.length >= repliesLimit) {
                setRepliesLimit((currentValue) => currentValue + 20);
                setIsLoadingReplies(true);
              }
            }}>
            <div className="write-reply" ref={repliesElementRef}>
              <div className="image-and-username-and-comment-content-wrapper">
                <div className="image">
                  <img src={currentUserData.profileImage}></img>
                </div>
                <div className="username-and-comment-content-wrapper">
                  <p className="username">{currentUserData.name}</p>
                  <span className="repling-user" onClick={() => setReplingUser(null)}>
                    {replingUser && (
                      <>
                        {`@${replingUser.name}`}
                        <i className="fa-solid fa-xmark"></i>
                      </>
                    )}
                  </span>
                  <span
                    className="textarea"
                    role="textbox"
                    contentEditable
                    onInput={(event) => {
                      if (event.currentTarget.innerText.length === 0) {
                        setReplingUser(null);
                      }
                      setReplyContent(event.currentTarget.innerText);
                    }}></span>
                  <Button
                    onClick={async (event) => {
                      const textareaElement = event.currentTarget.parentElement?.querySelector(".textarea") as HTMLSpanElement;

                      await sendReply(postId, id, currentUserData, replyContent, setReplies, replingUser, userId, userProfileData);
                      setReplingUser(null);

                      textareaElement.innerText = "";
                    }}>
                    Wyślij
                  </Button>
                </div>
              </div>
            </div>
            <div className="replies">
              {replies.length !== 0 &&
                replies.map((reply) => {
                  const { content, usersIdLikes, user, id: replyId, replingTo } = reply;

                  const doILikeThisReply = usersIdLikes.some((id) => id === currentUserData.id);

                  return (
                    <div className={`reply ${activePost?.replyId ? "from-notification" : ""}`} key={replyId}>
                      <div className="image-and-username-and-comment-content-wrapper">
                        <Button
                          show={"UserProfile"}
                          className="move-to-user-profile-button"
                          animationIn={{ className: "animation-in", duration: 500 }}
                          animationOut={{ className: "animation-out", duration: 500 }}
                          onClick={() => {
                            getActiveUserDataContext(user.id);
                          }}>
                          <div className="image">
                            <img src={user.imgUrl}></img>
                          </div>
                        </Button>

                        <div className="username-and-comment-content-wrapper">
                          <Button
                            show={"UserProfile"}
                            className="move-to-user-profile-button"
                            animationIn={{ className: "animation-in", duration: 500 }}
                            animationOut={{ className: "animation-out", duration: 500 }}
                            onClick={() => {
                              getActiveUserDataContext(user.id);
                            }}>
                            <p className="username">{user.name}</p>
                          </Button>

                          <p className="comment-content">
                            <span className="repling-to">{replingTo ? `@${replingTo.name}` : ""}</span> {content}
                          </p>
                        </div>
                      </div>
                      <div className="actions">
                        <button onClick={() => likeReply(setReplies, doILikeThisReply, replyId, currentUserData, postId, id, userId, userProfileData)}>
                          <i className={`${doILikeThisReply ? "fa-solid fa-heart" : "fa-regular fa-heart"}`}></i> {usersIdLikes.length}
                        </button>
                        <button
                          onClick={() => {
                            setReplingUser({
                              id: user.id,
                              name: user.name,
                            });

                            if (repliesElementRef.current) {
                              repliesElementRef.current.parentElement?.scroll({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }}>
                          Odpowiedz <i className="fa-regular fa-arrow-up-from-bracket"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}
              {isLoadingReplies && <>{createSkeletonCommentReplyElements()}</>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Comment;

const CommentSkeleton = () => {
  return (
    <div className="comment-skeleton">
      <div className="image-and-username-and-comment-content-wrapper">
        <div className="image"></div>
        <div className="username-and-comment-content-wrapper">
          <p className="username"></p>
          <p className="comment-content"></p>
        </div>
      </div>
      <div className="actions">
        <button></button>
        <button></button>
      </div>
    </div>
  );
};

export { CommentSkeleton };
