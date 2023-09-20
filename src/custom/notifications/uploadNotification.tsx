import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebaseInitialization";

const keyWords = ["podarował", "polubił", "skomentował", "udostępnił", "odpowiedział", "zaobserwował"];

export { keyWords };

const giveStarToUserProfileNotification = async (currentUserId: string, currentUserName: string, userId: string) => {
  const uniqueDocumentId = `${currentUserId}9giveStar`;
  const content = `${currentUserName} podarował Tobie gwiazdkę`;

  await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
    type: "followUser",
    content: content,
    data: {
      currentUserId: currentUserId,
      userName: currentUserName,
    },
    isRead: false,
    uploadedAt: serverTimestamp(),
  });
};

const followUserProfileNotification = async (currentUserId: string, currentUserName: string, userId: string) => {
  const uniqueDocumentId = `${currentUserId}8FollowProfile`;
  const content = `${currentUserName} zaobserwował Twój profil`;

  await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
    type: "followUser",
    content: content,
    data: {
      currentUserId: currentUserId,
      userName: currentUserName,
    },
    isRead: false,
    uploadedAt: serverTimestamp(),
  });
};

const uploadReplyOfReplyCommentPostNotification = async (
  userIdOfCreatedPost: string,
  postOwnerName: string,
  userId: string,
  currentUserName: string,
  postId: string,
  commentId: string,
  replyId: string,
  currentUserId: string
) => {
  if (currentUserId !== userId) {
    const uniqueDocumentId = `${userId}${replyId}7ReplyOfReply`;
    const content = `${currentUserName} odpowiedział na Twoją odpowiedź pod komentarzem posta użytkownika ${postOwnerName} `;

    await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
      type: "postReplyOfReplyComment",
      content: content,
      data: {
        userIdOfCreatedPost: userIdOfCreatedPost,
        postId: postId,
        commentId: commentId,
        replyId: replyId,
        userId: userId,
        currentUserId: currentUserId,
        userName: currentUserName,
      },
      isRead: false,
      uploadedAt: serverTimestamp(),
    });
  }
};

const uploadLikeReplyCommentPostNotification = async (
  userIdOfCreatedPost: string,
  postOwnerName: string,
  userId: string,
  name: string,
  postId: string,
  commentId: string,
  replyId: string,
  currentUserId: string
) => {
  if (currentUserId !== userId) {
    const uniqueDocumentId = `${userId}${replyId}6LikeReply`;
    const content = `${name} polubił Twoją odpowiedź pod komentarzem posta użytkownika ${postOwnerName}`;

    await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
      type: "postLikeReplyComment",
      content: content,
      data: {
        userIdOfCreatedPost: userIdOfCreatedPost,
        postId: postId,
        commentId: commentId,
        replyId: replyId,
        userId: userId,
        currentUserId: currentUserId,
        userName: name,
      },
      isRead: false,
      uploadedAt: serverTimestamp(),
    });
  }
};

const uploadReplyCommentPostNotification = async (
  userIdOfCreatedPost: string,
  postOwnerName: string,
  userId: string,
  name: string,
  postId: string,
  commentId: string,
  replyId: string,
  currentUserId: string
) => {
  if (currentUserId !== userId) {
    const uniqueDocumentId = `${userId}${replyId}5CommentReply`;
    const content = `${name} odpowiedział na Twój komentarz pod postem użytkownika ${postOwnerName}`;

    await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
      type: "postReplyComment",
      content: content,
      data: {
        userIdOfCreatedPost: userIdOfCreatedPost,
        postId: postId,
        commentId: commentId,
        replyId: replyId,
        userId: userId,
        currentUserId: currentUserId,
        userName: name,
      },
      isRead: false,
      uploadedAt: serverTimestamp(),
    });
  }
};

const uploadLikeCommentPostNotification = async (
  userIdOfCreatedPost: string,
  postOwnerName: string,
  userId: string,
  name: string,
  postId: string,
  commentId: string,
  currentUserId: string
) => {
  if (currentUserId !== userId) {
    const uniqueDocumentId = `${userId}${commentId}4LikeCommentPost`;
    const content = `${name} polubił Twój komentarz pod postem użytkownika ${postOwnerName} `;

    await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
      type: "postLikeComment",
      content: content,
      data: { userIdOfCreatedPost: userIdOfCreatedPost, postId: postId, commentId: commentId, userId: userId, currentUserId: currentUserId, userName: name },
      isRead: false,
      uploadedAt: serverTimestamp(),
    });
  }
};

const uploadSharePostNotification = async (userId: string, name: string, postId: string) => {
  const uniqueDocumentId = `${userId}${postId}3PostShare`;
  const content = `${name} udostępnił Twój post`;

  await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
    type: "postShare",
    content: content,
    data: { postId: postId, userId: userId, userIdOfCreatedPost: userId, userName: name },
    isRead: false,
    uploadedAt: serverTimestamp(),
  });
};

const uploadCommentPostNotification = async (userId: string, name: string, postId: string, commentId: string, currentUserId: string) => {
  if (currentUserId !== userId) {
    const uniqueDocumentId = `${userId}${commentId}2PostComment`;
    const content = `${name} skomentował Twój post`;

    await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
      type: "postComment",
      content: content,
      data: { postId: postId, commentId: commentId, userId: userId, currentUserId: currentUserId, userIdOfCreatedPost: userId, userName: name },
      isRead: false,
      uploadedAt: serverTimestamp(),
    });
  }
};

const uploadLikePostNotification = async (userId: string, name: string, postId: string, currentUserId: string) => {
  if (currentUserId !== userId) {
    const content = `${name} polubił Twój post`;
    const uniqueDocumentId = `${userId}${postId}1PostLike`;

    await setDoc(doc(db, "users", userId, "notifications", uniqueDocumentId), {
      type: "postLike",
      content: content,
      data: { postId: postId, userId: userId, currentUserId: currentUserId, userIdOfCreatedPost: userId, userName: name },
      isRead: false,
      uploadedAt: serverTimestamp(),
    });
  }
};

export {
  uploadLikePostNotification,
  uploadCommentPostNotification,
  uploadSharePostNotification,
  uploadLikeCommentPostNotification,
  uploadReplyCommentPostNotification,
  uploadLikeReplyCommentPostNotification,
  uploadReplyOfReplyCommentPostNotification,
  followUserProfileNotification,
  giveStarToUserProfileNotification,
};
