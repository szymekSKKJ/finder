import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import "./LastMessages.scss";
import { currentUserNotNullType } from "../../../../types";
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  Unsubscribe,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../../firebaseInitialization";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import Button from "../../../Global/Button/Button";

const markAsRead = async (currentUserId: string, userId: string) => {
  await updateDoc(doc(db, "users", currentUserId, "receivedLastMessages", userId), {
    isRead: true,
  });
};

//! Trzeba to uprościć. Za dużo requestów na raz

const getUserMessages = async (
  currentUserId: string,
  setLastUsersMessages: Dispatch<
    SetStateAction<
      {
        id: string;
        sentAt: Timestamp;
        content: string;
        isReadByCurrentUser: boolean;
        isReadByThisUser: boolean;
        name: string;
        profileImage: string;
        lastActive: Timestamp;
        didEverReply: boolean;
      }[]
    >
  >,
  unsubGetUserMessagesRef: React.MutableRefObject<Unsubscribe | null>,
  setIsLoadingMessages: Dispatch<SetStateAction<boolean>>
) => {
  const lastUsersMessages: {
    id: string;
    sentAt: Timestamp;
    content: string;
    isReadByCurrentUser: boolean;
    isReadByThisUser: boolean;
    name: string;
    profileImage: string;
    lastActive: Timestamp;
    didEverReply: boolean;
  }[] = [];

  const unsub = onSnapshot(
    query(collection(db, "users", currentUserId, "receivedLastMessages"), orderBy("sentAt", "desc"), limit(20)),
    async (querySnapshot) => {
      const querySnapshotData: QueryDocumentSnapshot<DocumentData>[] = [];

      querySnapshot.forEach((doc) => querySnapshotData.push(doc));

      if (querySnapshot.size === 0) {
        setIsLoadingMessages(false);
      }

      await Promise.all(
        querySnapshotData.map(async (docData) => {
          const { sentAt: sentAtFromUser, content: contentFromUser, isRead: isReadByCurrentUser } = docData.data();
          const userId = docData.id;

          const doesThisMessageAlreadyExists = lastUsersMessages.some((lastMessage) => lastMessage.id === docData.id);

          if (doesThisMessageAlreadyExists === false) {
            const docSnap = await getDoc(doc(db, "users", userId));
            const docSnap1 = await getDoc(doc(db, "users", userId, "receivedLastMessages", currentUserId));

            const { name, lastActive } = docSnap.data()!;

            const storage = getStorage();
            const url = await getDownloadURL(ref(ref(storage, `users/${userId}/profileImage.png`)));

            if (docSnap1.exists()) {
              const { sentAt: sentAtFromCurrentUser, content: contentFromCurrentUser, isRead: isReadByThisUser } = docSnap1.data();

              sentAtFromCurrentUser.seconds > sentAtFromUser.seconds
                ? lastUsersMessages.push({
                    id: userId,
                    sentAt: sentAtFromCurrentUser,
                    content: contentFromCurrentUser,
                    isReadByCurrentUser: isReadByCurrentUser,
                    isReadByThisUser: isReadByThisUser,
                    name: name,
                    profileImage: url,
                    lastActive: lastActive,
                    didEverReply: true,
                  })
                : lastUsersMessages.push({
                    id: userId,
                    sentAt: sentAtFromUser,
                    content: contentFromUser,
                    isReadByCurrentUser: isReadByCurrentUser,
                    isReadByThisUser: isReadByThisUser,
                    name: name,
                    profileImage: url,
                    lastActive: lastActive,
                    didEverReply: true,
                  });
            } else {
              lastUsersMessages.push({
                id: userId,
                sentAt: sentAtFromUser,
                content: contentFromUser,
                isReadByCurrentUser: isReadByCurrentUser,
                isReadByThisUser: false,
                name: name,
                profileImage: url,
                lastActive: lastActive,
                didEverReply: false,
              });
            }
          } else {
            const foundUser = lastUsersMessages.find((user) => user.id === userId);

            foundUser && Object.assign(foundUser, { sentAt: sentAtFromUser, content: contentFromUser, isReadByCurrentUser: isReadByCurrentUser });
          }
        })
      );

      const sentMessagesQuerySnapshot = await getDocs(query(collection(db, "users", currentUserId, "sentMessages"), orderBy("lastMessage.sentAt"), limit(20)));

      await Promise.all(
        sentMessagesQuerySnapshot.docs.map(async (docData) => {
          const {
            lastMessage: { content, sentAt },
          } = docData.data();

          const doesThisMessageAlreadyExists = lastUsersMessages.some((lastMessage) => lastMessage.id === docData.id);

          if (doesThisMessageAlreadyExists === false) {
            const docRef = doc(db, "users", docData.id);
            const docSnap = await getDoc(docRef);
            const { name, lastActive } = docSnap.data()!;

            const storage = getStorage();
            const url = await getDownloadURL(ref(ref(storage, `users/${docData.id}/profileImage.png`)));

            lastUsersMessages.push({
              id: docData.id,
              sentAt: sentAt,
              content: content,
              isReadByCurrentUser: true,
              isReadByThisUser: false,
              name: name,
              profileImage: url,
              lastActive: lastActive,
              didEverReply: true,
            });
          }
        })
      );

      lastUsersMessages.sort((a, b) => new Date(b.sentAt.seconds * 1000).getTime() - new Date(a.sentAt.seconds * 1000).getTime());

      setLastUsersMessages([...lastUsersMessages]);
    }
  );

  unsubGetUserMessagesRef.current = unsub;
};

const setListenerForReadStatus = (
  lastUsersMessages: {
    id: string;
    sentAt: Timestamp;
    content: string;
    isReadByCurrentUser: boolean;
    isReadByThisUser: boolean;
    name: string;
    profileImage: string;
    lastActive: Timestamp;
    didEverReply: boolean;
  }[],
  setLastUsersMessages: Dispatch<
    SetStateAction<
      {
        id: string;
        sentAt: Timestamp;
        content: string;
        isReadByCurrentUser: boolean;
        isReadByThisUser: boolean;
        name: string;
        profileImage: string;
        lastActive: Timestamp;
        didEverReply: boolean;
      }[]
    >
  >,
  currentUserId: string,
  unsubGetUsersReadStatusRef: React.MutableRefObject<Unsubscribe | null>,
  setIsLoadingMessages: Dispatch<SetStateAction<boolean>>
) => {
  const lastUserMessagesId = lastUsersMessages.map((user) => user.id);

  const unsub = onSnapshot(query(collection(db, "users", currentUserId, "sentMessages"), where(documentId(), "in", lastUserMessagesId)), (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const { thisUserUnreadMessages } = doc.data()!;

      const updatedUser = lastUsersMessages.find((user) => user.id === doc.id)!;

      updatedUser.isReadByThisUser = thisUserUnreadMessages === 0 ? true : false;
    });

    setLastUsersMessages([...lastUsersMessages]);
  });

  unsubGetUsersReadStatusRef.current = unsub;

  setIsLoadingMessages(false);
};

const LastMessages = ({
  currentUserData,
  setLastContent,
  getActiveUserData,
}: {
  currentUserData: currentUserNotNullType;
  setLastContent: Dispatch<SetStateAction<string>>;
  getActiveUserData: (userId: string) => void;
}) => {
  const [lastUsersMessages, setLastUsersMessages] = useState<
    {
      id: string;
      sentAt: Timestamp;
      content: string;
      isReadByCurrentUser: boolean;
      isReadByThisUser: boolean;
      name: string;
      profileImage: string;
      lastActive: Timestamp;
      didEverReply: boolean;
    }[]
  >([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const unsubGetUserMessagesRef = useRef<null | Unsubscribe>(null);
  const unsubGetUsersReadStatusRef = useRef<null | Unsubscribe>(null);

  useEffect(() => {
    if (lastUsersMessages.length === 0 && isLoadingMessages) {
      getUserMessages(currentUserData.id, setLastUsersMessages, unsubGetUserMessagesRef, setIsLoadingMessages);
    }

    return () => {
      unsubGetUserMessagesRef.current && unsubGetUserMessagesRef.current();
      unsubGetUsersReadStatusRef.current && unsubGetUsersReadStatusRef.current();
    };
  }, []);

  useEffect(() => {
    if (isLoadingMessages && lastUsersMessages.length !== 0) {
      setListenerForReadStatus(lastUsersMessages, setLastUsersMessages, currentUserData.id, unsubGetUsersReadStatusRef, setIsLoadingMessages);
    }
  }, [lastUsersMessages]);

  return (
    <div className="last-messages">
      {isLoadingMessages === false && lastUsersMessages.length !== 0
        ? lastUsersMessages.map((lastUserMessage) => {
            const { id, content, name, profileImage, isReadByCurrentUser, isReadByThisUser, lastActive, sentAt, didEverReply } = lastUserMessage;

            const lastActiveDateSeconds = new Date(lastActive.seconds * 1000).getTime() / 1000;

            const isActiveNow = new Date(new Date().setMinutes(new Date().getMinutes() - 2)).getTime() / 1000 - lastActiveDateSeconds <= 2 * 60 ? true : false;

            return (
              <Button
                show="WriteMessage"
                animationIn={{ className: "animation-in", duration: 500 }}
                className={`message ${didEverReply === false ? "not-replyed" : ""}`}
                onClick={() => {
                  markAsRead(currentUserData.id, id);
                  setLastContent("LastMessages");
                  getActiveUserData(id);
                }}
                key={id}>
                <div className={`user-image ${isActiveNow ? "active" : ""}`}>
                  <img src={profileImage}></img>
                </div>
                <div className={`username-and-last-message-wrapper ${isReadByCurrentUser ? "" : "not-read"}`}>
                  <p className="username">
                    {name} {didEverReply === false && <span className="exclamation-mark">!</span>}
                  </p>
                  <p className="last-message">{content}</p>
                  <span className="sent-at">
                    {new Date(sentAt.seconds * 1000).toLocaleDateString("pl-PL", {
                      day: "2-digit",
                      month: "short",
                      minute: "2-digit",
                      hour: "2-digit",
                    })}
                  </span>
                </div>
                <div className="is-read-by-this-user">{isReadByCurrentUser && isReadByThisUser && <img src={profileImage}></img>}</div>
                {didEverReply === false && <p className="did-not-reply">Ten użytkownik Ci nie odpowiedział</p>}
              </Button>
            );
          })
        : isLoadingMessages === false && (
            <div className="empty-messages">
              <p>Poznawaj więcej ludzi i wymieniajcie się wiadomościami</p>
            </div>
          )}
    </div>
  );
};

export default LastMessages;
