import {
  Timestamp,
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  onSnapshot,
  query,
  limit,
  orderBy,
  Unsubscribe,
  updateDoc,
  doc,
  increment,
  DocumentData,
  setDoc,
  where,
} from "firebase/firestore";
import Button from "../../../Global/Button/Button";
import "./WriteMessage.scss";
import { Dispatch, MutableRefObject, SetStateAction, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { db } from "../../../../firebaseInitialization";
import { SetIsMainNavigationClosedContext, SetImagesToDisplayContext } from "../Home";
import { currentUserNotNullType } from "../../../../types";
import { createCache } from "../../../../custom/cacheStorage/cacheStorage";
import { getDownloadURL, getStorage, listAll, ref, uploadBytes } from "firebase/storage";
import generateRandomName from "../../../Global/generateRandomName";
import UserOptions from "./UserOptions/UserOptions";

const processfile = async (file: File) => {
  const resizedOmage = await new Promise((resolve: (value: File) => void) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = function (event) {
      if (event.target && event.target.result) {
        const blob = new Blob([event.target.result]);
        window.URL = window.URL || window.webkitURL;
        const blobURL = window.URL.createObjectURL(blob);

        const image = new Image();
        image.src = blobURL;

        image.onload = function () {
          const resized = resizeMe(image);

          fetch(resized)
            .then((res) => res.blob())
            .then((blob) => {
              const file = new File([blob], "File name", { type: "image/png" });
              resolve(file);
            });
        };
      }
    };
  });

  return resizedOmage;
};

function resizeMe(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");

  const max_width = 1920;
  const max_height = 1080;

  let width = img.width;
  let height = img.height;

  if (width > height) {
    if (width > max_width) {
      height = Math.round((height *= max_width / width));
      width = max_width;
    }
  } else {
    if (height > max_height) {
      //width *= max_height / height;
      width = Math.round((width *= max_height / height));
      height = max_height;
    }
  }

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.7);
}

createCache("usersMessages");

const dictionary: { minuteEnds: object; hourEnds: object } = {
  minuteEnds: {
    "0": "minut",
    "1": "minutę",
    "2": "minuty",
    "3": "minuty",
    "4": "minuty",
    "5": "minut",
    "6": "minut",
    "7": "minut",
    "8": "minut",
    "9": "minut",
  },
  hourEnds: {
    "0": "godzin",
    "1": "godzinę",
    "2": "godziny",
    "3": "godziny",
    "4": "godziny",
    "5": "godzin",
    "6": "godzin",
    "7": "godzin",
    "8": "godzin",
    "9": "godzin",
  },
};

const getActiveStatus = (lastActive: Timestamp) => {
  const { seconds } = lastActive;
  const date = new Date(seconds * 1000).getTime() / 1000;
  const dateNow = new Date().getTime() / 1000;
  const secondsAgo = Math.floor(dateNow - date);
  const minutesAgo = Math.floor(secondsAgo / 60);
  const hoursAgo = Math.floor(secondsAgo / 60 / 60);
  const daysAgo = Math.floor(secondsAgo / 60 / 60 / 24);

  if (daysAgo > 0) {
    const dictionaryValue = daysAgo.toString().slice(-1) === "1" ? "Dzień" : "Dni";
    return `Dostępny ${daysAgo} ${dictionaryValue} temu`;
  } else if (hoursAgo > 0) {
    const dictionaryValueFind = hoursAgo === 21 ? 0 : (Object.keys(dictionary.hourEnds).find((key) => key === hoursAgo.toString().slice(-1)) as string);

    //@ts-ignore
    const dictionaryValue = dictionary.hourEnds[dictionaryValueFind];

    return `Dostępny ${hoursAgo} ${dictionaryValue} temu`;
  } else if (minutesAgo > 2) {
    const dictionaryValueFind = Object.keys(dictionary.minuteEnds).find((key) => key === minutesAgo.toString().slice(-1)) as string;

    //@ts-ignore
    const dictionaryValue = dictionary.minuteEnds[dictionaryValueFind];

    return `Dostępny ${minutesAgo} ${dictionaryValue} temu`;
  } else {
    return "Dostępny";
  }
};

const sendMessage = async (
  message: string | null,
  userId: string,
  currentUserId: string,
  attachedImages: { file: File; url: string | null }[] | null,
  replyingMessage: { id: string; content: string; state: string } | null
) => {
  try {
    await updateDoc(doc(db, "users", currentUserId, "sentMessages", userId), {
      thisUserUnreadMessages: increment(1),
      lastMessage: {
        content: message,
        sentAt: serverTimestamp(),
      },
    });
  } catch (error) {
    const errorMessage = `${error}`;
    if (errorMessage.includes("No document to update")) {
      setDoc(
        doc(db, "users", currentUserId, "sentMessages", userId),
        {
          thisUserUnreadMessages: 1,
          lastMessage: {
            content: message,
            sentAt: serverTimestamp(),
          },
        },
        { merge: true }
      );
    }
  }

  if (attachedImages) {
    const randomizedDocId = generateRandomName();

    await Promise.all(
      attachedImages.map(async (fileData) => {
        const { file } = fileData;
        const fileExtenstion = file.type.split("/")[1];

        const storage = getStorage();

        const ranomizedName = generateRandomName();

        const resizedImage = await processfile(file);

        await uploadBytes(ref(storage, `/users/${currentUserId}/sentMessages/${randomizedDocId}/${ranomizedName}.${fileExtenstion}`), resizedImage);
      })
    );

    await setDoc(doc(db, "users", currentUserId, "sentMessages", userId, "messages", randomizedDocId), {
      message: message,
      sentAt: serverTimestamp(),
      attachedImages: true,
      replyingMessage: replyingMessage,
    });
  } else {
    await addDoc(collection(db, "users", currentUserId, "sentMessages", userId, "messages"), {
      message: message,
      sentAt: serverTimestamp(),
      attachedImages: false,
      replyingMessage: replyingMessage,
    });
  }

  await setDoc(doc(db, "users", userId, "receivedLastMessages", currentUserId), {
    content: message,
    sentAt: serverTimestamp(),
    isRead: false,
  });
};

const setMessagesListener = (
  setMessagesTo: Dispatch<
    SetStateAction<
      {
        id: string;
        state: string;
        content: string;
        sentAt: Timestamp;
        imagesUrl: string[];
        replyingMessage: { id: string; content: string; state: string } | null;
      }[]
    >
  >,
  setMessagesFrom: Dispatch<
    SetStateAction<
      {
        id: string;
        state: string;
        content: string;
        sentAt: Timestamp;
        imagesUrl: string[];
        replyingMessage: { id: string; content: string; state: string } | null;
      }[]
    >
  >,
  currentUserId: string,
  userId: string,
  unsubMessagesToRef: MutableRefObject<Unsubscribe | null>,
  unsubMessagesFromRef: MutableRefObject<Unsubscribe | null>,
  messagesContentElementRef: MutableRefObject<HTMLDivElement | null>,
  setSentQueueMessages: Dispatch<
    SetStateAction<
      {
        id: string;
        state: string;
        content: string;
        sentAt: Timestamp;
        imagesUrl: string[];
        isPending: boolean;
        error: boolean;
        replyingMessage: { id: string; content: string; state: string } | null;
      }[]
    >
  >,
  queueLength: number
) => {
  let isUnsubMessagesToFired = false;

  const unsubMessagesTo = onSnapshot(
    query(collection(db, "users", currentUserId, "sentMessages", userId, "messages"), limit(queueLength === 0 ? 1 : queueLength), orderBy("sentAt", "desc")),
    (querySnapshot) => {
      if (isUnsubMessagesToFired) {
        if (!querySnapshot.metadata.hasPendingWrites) {
          querySnapshot.forEach(async (doc) => {
            const { message, sentAt, attachedImages, replyingMessage } = doc.data();

            if (attachedImages) {
              const storage = getStorage();
              const listRef = ref(storage, `users/${currentUserId}/sentMessages/${doc.id}`);

              const res = await listAll(listRef);

              res.items.forEach((itemRef) => {
                getDownloadURL(ref(storage, `${itemRef}`)).then((url) => {
                  setMessagesTo((currentMessages) => {
                    const copiedCurrentMessages = [...currentMessages];

                    const messageTo = copiedCurrentMessages.find((message) => message.id === doc.id)!;

                    if (messageTo.imagesUrl.includes(url) === false) {
                      messageTo.imagesUrl.push(url);
                    }

                    return copiedCurrentMessages;
                  });
                });
              });
            }

            setMessagesTo((currentMessages) => {
              const copiedCurrentMessages = [...currentMessages];

              copiedCurrentMessages.push({ content: message, sentAt: sentAt, state: "to", id: doc.id, imagesUrl: [], replyingMessage: replyingMessage });

              return copiedCurrentMessages;
            });

            setSentQueueMessages((currentValues) => {
              const copiedCurrentMessages = [...currentValues];

              const sentMessage = copiedCurrentMessages.find((messageData) => messageData.content === message)!;

              const indexOfSentMessage = copiedCurrentMessages.indexOf(sentMessage);

              copiedCurrentMessages.splice(indexOfSentMessage, 1);

              return copiedCurrentMessages;
            });

            setTimeout(() => {
              messagesContentElementRef.current?.scroll({
                top: messagesContentElementRef.current.scrollHeight,
                behavior: "smooth",
              });
            });
          });
        }
      }
      isUnsubMessagesToFired = true;
    }
  );

  unsubMessagesToRef.current = unsubMessagesTo;

  let isUnsubMessagesFromFired = false;

  const unsubMessagesFrom = onSnapshot(
    query(collection(db, "users", userId, "sentMessages", currentUserId, "messages"), limit(queueLength === 0 ? 1 : queueLength), orderBy("sentAt", "desc")),
    async (querySnapshot) => {
      if (isUnsubMessagesFromFired) {
        if (!querySnapshot.metadata.hasPendingWrites) {
          querySnapshot.forEach(async (doc) => {
            const { message, sentAt, attachedImages, replyingMessage } = doc.data();

            if (attachedImages) {
              const storage = getStorage();
              const listRef = ref(storage, `users/${userId}/sentMessages/${doc.id}`);

              const res = await listAll(listRef);

              res.items.forEach((itemRef) => {
                getDownloadURL(ref(storage, `${itemRef}`)).then((url) => {
                  setMessagesFrom((currentMessages) => {
                    const copiedCurrentMessages = [...currentMessages];

                    const messageFrom = copiedCurrentMessages.find((message) => message.id === doc.id)!;

                    if (messageFrom.imagesUrl.includes(url) === false) {
                      messageFrom.imagesUrl.push(url);
                    }

                    return copiedCurrentMessages;
                  });
                });
              });
            }

            setMessagesFrom((currentMessages) => {
              const copiedCurrentMessages = [...currentMessages];

              copiedCurrentMessages.push({ content: message, sentAt: sentAt, state: "from", id: doc.id, imagesUrl: [], replyingMessage: replyingMessage });

              return copiedCurrentMessages;
            });

            setTimeout(() => {
              messagesContentElementRef.current?.scroll({
                top: messagesContentElementRef.current.scrollHeight,
                behavior: "smooth",
              });
            });
          });

          await updateDoc(doc(db, "users", userId, "sentMessages", currentUserId), {
            thisUserUnreadMessages: 0,
          });

          await updateDoc(doc(db, "users", currentUserId, "receivedLastMessages", userId), {
            isRead: true,
          });
        }
      }
      isUnsubMessagesFromFired = true;
    }
  );

  unsubMessagesFromRef.current = unsubMessagesFrom;
};

const setUnreadMessagesListener = async (
  setUnreadMessages: Dispatch<SetStateAction<number>>,
  currentUserId: string,
  userId: string,
  unsubUnreadMessagesRef: MutableRefObject<Unsubscribe | null>
) => {
  let isAfterFirstSnapshot = false;

  const unsubMessagesTo = onSnapshot(doc(db, "users", currentUserId, "sentMessages", userId), (querySnapshot) => {
    const data = querySnapshot.data() as DocumentData;
    if (data) {
      const unreadMessages = data.thisUserUnreadMessages;

      if (!querySnapshot.metadata.hasPendingWrites) {
        if (unreadMessages === 0) {
          setUnreadMessages(unreadMessages);
        }
        if (isAfterFirstSnapshot === false) {
          isAfterFirstSnapshot = true;
          setUnreadMessages(unreadMessages);
        }
      }
    }
  });

  unsubUnreadMessagesRef.current = unsubMessagesTo;
};

const getMessages = async (
  setMessagesTo: Dispatch<
    SetStateAction<
      {
        id: string;
        state: string;
        content: string;
        sentAt: Timestamp;
        imagesUrl: string[];
        replyingMessage: { id: string; content: string; state: string } | null;
      }[]
    >
  >,
  setMessagesFrom: Dispatch<
    SetStateAction<
      {
        id: string;
        state: string;
        content: string;
        sentAt: Timestamp;
        imagesUrl: string[];
        replyingMessage: { id: string; content: string; state: string } | null;
      }[]
    >
  >,
  currentUserId: string,
  userId: string,
  lastMessage: {
    id: string;
    state: string;
    content: string;
    sentAt: Timestamp;
    imagesUrl: string[];
    replyingMessage: {
      id: string;
      content: string;
      state: string;
    } | null;
  } | null,
  setAreAllMessagesLoaded: Dispatch<SetStateAction<boolean>>
) => {
  try {
    await updateDoc(doc(db, "users", userId, "sentMessages", currentUserId), {
      thisUserUnreadMessages: 0,
    });
  } catch (error) {
    const errorMessage = `${error}`;
    if (errorMessage.includes("No document to update")) {
      setDoc(doc(db, "users", userId, "sentMessages", currentUserId), { thisUserUnreadMessages: 0 }, { merge: true });
    }
  }

  const querySnapshotMessagesTo = await getDocs(
    query(
      collection(db, "users", currentUserId, "sentMessages", userId, "messages"),
      limit(20),
      where("sentAt", "<", lastMessage ? lastMessage.sentAt : Timestamp.fromDate(new Date())),
      orderBy("sentAt", "desc")
    )
  );

  const messagesTo: {
    content: string;
    sentAt: Timestamp;
    state: string;
    id: string;
    imagesUrl: string[];
    replyingMessage: { id: string; content: string; state: string } | null;
  }[] = [];

  querySnapshotMessagesTo.forEach(async (doc) => {
    const { message, sentAt, attachedImages, replyingMessage } = doc.data();

    if (attachedImages) {
      const storage = getStorage();
      const listRef = ref(storage, `users/${currentUserId}/sentMessages/${doc.id}`);

      const res = await listAll(listRef);

      res.items.forEach((itemRef) => {
        getDownloadURL(ref(storage, `${itemRef}`)).then((url) => {
          const messageTo = messagesTo.find((message) => message.id === doc.id)!;
          messageTo.imagesUrl.push(url);

          setMessagesTo([...messagesTo]);
        });
      });
    }

    messagesTo.push({ content: message, sentAt: sentAt, state: "to", id: doc.id, imagesUrl: [], replyingMessage: replyingMessage });
  });

  setMessagesTo((currentValues) => {
    const copiedCurrentValues = [...currentValues];

    const ids = new Set(copiedCurrentValues.map((d) => d.id));
    const merged = [...copiedCurrentValues, ...messagesTo.filter((d) => !ids.has(d.id))];

    merged.sort((a, b) => b.sentAt.seconds - a.sentAt.seconds);

    return merged;
  });

  const querySnapshotMessagesFrom = await getDocs(
    query(
      collection(db, "users", userId, "sentMessages", currentUserId, "messages"),
      limit(20),
      where("sentAt", "<", lastMessage ? lastMessage.sentAt : Timestamp.fromDate(new Date())),
      orderBy("sentAt", "desc")
    )
  );
  const messagesFrom: {
    content: string;
    sentAt: Timestamp;
    state: string;
    id: string;
    imagesUrl: string[];
    replyingMessage: { id: string; content: string; state: string } | null;
  }[] = [];

  querySnapshotMessagesFrom.forEach(async (doc) => {
    const { message, sentAt, attachedImages, replyingMessage } = doc.data();

    if (attachedImages) {
      const storage = getStorage();
      const listRef = ref(storage, `users/${userId}/sentMessages/${doc.id}`);

      const res = await listAll(listRef);

      res.items.forEach((itemRef) => {
        getDownloadURL(ref(storage, `${itemRef}`)).then((url) => {
          const messageFrom = messagesFrom.find((message) => message.id === doc.id)!;

          messageFrom.imagesUrl.push(url);

          setMessagesFrom(() => [...messagesFrom]);
        });
      });
    }

    messagesFrom.push({ content: message, sentAt: sentAt, state: "from", id: doc.id, imagesUrl: [], replyingMessage });
  });

  setMessagesFrom((currentValues) => {
    const copiedCurrentValues = [...currentValues];

    const ids = new Set(copiedCurrentValues.map((d) => d.id));
    const merged = [...copiedCurrentValues, ...messagesFrom.filter((d) => !ids.has(d.id))];

    merged.sort((a, b) => b.sentAt.seconds - a.sentAt.seconds);

    return merged;
  });

  querySnapshotMessagesFrom.size === 0 && querySnapshotMessagesTo.size === 0 && setAreAllMessagesLoaded(true);
};

const readURL = (file: File) => {
  return new Promise((res: (value: string | ArrayBuffer) => void, rej) => {
    const reader = new FileReader();
    reader.onload = (e) => e.target && e.target.result && res(e.target.result);
    reader.onerror = (e) => rej(e);
    reader.readAsDataURL(file);
  });
};

const WriteMessage = ({
  lastContent,
  activeUserData,
  currentUserData,
  setLastContent,
}: {
  lastContent: string;
  activeUserData: currentUserNotNullType | null;
  currentUserData: currentUserNotNullType;
  setLastContent: Dispatch<SetStateAction<string>>;
}) => {
  const setIsMainNavigationClosed = useContext(SetIsMainNavigationClosedContext);
  const setImagesToDisplay = useContext(SetImagesToDisplayContext);

  const [activeStatus, setActiveStatus] = useState<null | string>(null);
  const [lastContentBefore] = useState(lastContent);

  const [message, setMessage] = useState<null | string>(null);
  const [messagesFrom, setMessagesFrom] = useState<
    {
      id: string;
      state: string;
      content: string;
      sentAt: Timestamp;
      imagesUrl: string[];
      isPending?: boolean;
      error?: boolean;
      replyingMessage: { id: string; content: string; state: string } | null;
    }[]
  >([]);
  const [messagesTo, setMessagesTo] = useState<
    {
      id: string;
      state: string;
      content: string;
      sentAt: Timestamp;
      imagesUrl: string[];
      isPending?: boolean;
      error?: boolean;
      replyingMessage: { id: string; content: string; state: string } | null;
    }[]
  >([]);

  const [sentQueueMessages, setSentQueueMessages] = useState<
    {
      id: string;
      state: string;
      content: string;
      sentAt: Timestamp;
      imagesUrl: string[];
      isPending: boolean;
      error: boolean;
      replyingMessage: { id: string; content: string; state: string } | null;
    }[]
  >([]);

  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const [unreadMessages, setUnreadMessages] = useState(0);

  const [attachedImages, setAttachedImages] = useState<{ url: string | null; file: File }[] | null>(null);

  const [firstTouch, setFirstTouch] = useState<number | null>(null);

  const [replyingMessage, setReplyingMessage] = useState<{ id: string; content: string; state: string } | null>(null);

  const [areAllMessagesLoaded, setAreAllMessagesLoaded] = useState(false);

  const [clickedReplyingMessage, setClickedReplyingMessage] = useState<null | {
    element: HTMLDivElement;
    startAnimation: boolean;
    id: string;
  }>(null);

  const [areUserOptionsOpen, setAreUserOptionsOpen] = useState(false);

  const unsubMessagesToRef = useRef<Unsubscribe | null>(null);
  const unsubMessagesFromRef = useRef<Unsubscribe | null>(null);
  const unsubUnreadMessagesRef = useRef<Unsubscribe | null>(null);
  const messagesContentElementRef = useRef<HTMLDivElement | null>(null);
  const intervalActiveStatusRef = useRef<null | ReturnType<typeof setTimeout>>(null);

  const sortedMessages = [...messagesFrom, ...messagesTo, ...sentQueueMessages];

  sortedMessages.sort((a, b) => a.sentAt.seconds - b.sentAt.seconds);

  useLayoutEffect(() => {
    setIsMainNavigationClosed && setIsMainNavigationClosed(true);
  }, []);

  useEffect(() => {
    if (isLoadingMessages === false && clickedReplyingMessage && clickedReplyingMessage.startAnimation === false) {
      messagesContentElementRef.current?.scrollBy({
        top: -50,
        behavior: "smooth",
      });

      clickedReplyingMessage.element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      messagesContentElementRef.current?.addEventListener(
        "scrollend",
        () => {
          setClickedReplyingMessage((currentValue) => {
            if (currentValue) {
              const copiedCurrentValue = { ...currentValue };

              copiedCurrentValue.startAnimation = true;
              return copiedCurrentValue;
            } else {
              return currentValue;
            }
          });
          setTimeout(() => {
            setClickedReplyingMessage(null);
          }, 1000); // Delay of brigthness animation
        },
        { once: true }
      );
    }
  }, [clickedReplyingMessage, isLoadingMessages]);

  useEffect(() => {
    if (activeUserData && intervalActiveStatusRef.current === null) {
      const activeStatus = getActiveStatus(activeUserData.lastActive);

      setActiveStatus(activeStatus);

      intervalActiveStatusRef.current = setInterval(() => {
        const activeStatus = getActiveStatus(activeUserData.lastActive);

        setActiveStatus(activeStatus);
      }, 1000 * 60 * 1);
    }

    return () => {
      if (intervalActiveStatusRef.current) {
        clearInterval(intervalActiveStatusRef.current);
      }
    };
  }, [activeUserData]);

  useEffect(() => {
    if (activeUserData) {
      const getMessagesAsync = async () => {
        setMessagesListener(
          setMessagesTo,
          setMessagesFrom,
          currentUserData.id,
          activeUserData.id,
          unsubMessagesToRef,
          unsubMessagesFromRef,
          messagesContentElementRef,
          setSentQueueMessages,
          sentQueueMessages.length
        );

        const lastMessage = null;
        if (sortedMessages.length === 0) {
          await getMessages(setMessagesTo, setMessagesFrom, currentUserData.id, activeUserData.id, lastMessage, setAreAllMessagesLoaded);
        }

        setIsLoadingMessages(false);
      };

      setUnreadMessagesListener(setUnreadMessages, currentUserData.id, activeUserData.id, unsubUnreadMessagesRef);

      getMessagesAsync();
    }

    return () => {
      unsubMessagesToRef.current && unsubMessagesToRef.current();
      unsubMessagesFromRef.current && unsubMessagesFromRef.current();
      unsubUnreadMessagesRef.current && unsubUnreadMessagesRef.current();
    };
  }, [activeUserData]);

  useEffect(() => {
    if (messagesFrom.length <= 20 && messagesTo.length <= 20 && isLoadingMessages === false) {
      messagesContentElementRef.current?.scroll({
        top: messagesContentElementRef.current?.scrollHeight,
      });
    }
  }, [messagesFrom, messagesTo]);

  useEffect(() => {
    if (activeUserData && isLoadingMessages === true) {
      const getMessagesAsync = async () => {
        const lastMessage = sortedMessages[0];
        if (isLoadingMessages && lastMessage) {
          await getMessages(setMessagesTo, setMessagesFrom, currentUserData.id, activeUserData.id, lastMessage, setAreAllMessagesLoaded);
          setIsLoadingMessages(false);
        }
      };

      getMessagesAsync();
    }
  }, [isLoadingMessages]);

  useEffect(() => {
    messagesContentElementRef.current?.scroll({
      top: messagesContentElementRef.current?.scrollHeight,
    });
  }, [attachedImages]);

  useEffect(() => {
    const asyncConvertImages = async () => {
      if (attachedImages && attachedImages[0].url === null) {
        const copiedAttachedImages = [...attachedImages];
        await Promise.all(
          copiedAttachedImages.map(async (fileData) => {
            const { file } = fileData;
            const url = (await readURL(file)) as string;

            fileData.url = url;
          })
        );

        setAttachedImages([...copiedAttachedImages]);
      }
    };

    asyncConvertImages();
  }, [attachedImages]);

  return (
    <div className="write-message-wrapper">
      <div className="write-message">
        <div className="header">
          <Button
            className="back"
            show={lastContentBefore}
            animationOut={{ duration: 500, className: "animation-out" }}
            animationIn={{ duration: 500, className: "animation-in" }}
            onClick={() => {
              setIsMainNavigationClosed && setIsMainNavigationClosed(false);
            }}>
            <i className="fa-solid fa-chevron-left"></i>
          </Button>
          <div className={`user-image ${activeStatus === "Dostępny" ? "active" : ""}`}>
            <img src={activeUserData ? activeUserData.profileImage : ""} />
          </div>
          <Button
            className="move-to-user-profile-button"
            show="UserProfile"
            animationOut={{ duration: 500, className: "animation-out" }}
            animationIn={{ duration: 500, className: "animation-in" }}
            onClick={() => {
              setIsMainNavigationClosed && setIsMainNavigationClosed(false);
            }}>
            <div className="username-and-activity-status-wrapper">
              <p className="username">{activeUserData ? activeUserData.name : ""}</p>
              <p className="activity-status">{activeStatus}</p>
            </div>
          </Button>
          <Button onClick={() => setAreUserOptionsOpen(true)}>
            <i className="fa-regular fa-ellipsis-vertical"></i>
          </Button>
        </div>
        <div
          className={`replying-message ${replyingMessage ? "open" : ""}`}
          onClick={() => {
            setReplyingMessage(null);
          }}>
          <button className="close">
            <i className="fa-solid fa-xmark"></i>{" "}
          </button>
          <p className="user">{replyingMessage?.state === "to" ? `${currentUserData.name}` : `${activeUserData ? activeUserData.name : ""}`}</p>
          <p className="content">
            <i className="fa-solid fa-reply"></i>
            {replyingMessage?.content}
          </p>
        </div>
        <div
          className="messages-content"
          ref={messagesContentElementRef}
          onScroll={(event) => {
            if (
              event.currentTarget.scrollTop < event.currentTarget.scrollHeight * 0.5 &&
              isLoadingMessages === false &&
              clickedReplyingMessage === null &&
              areAllMessagesLoaded === false
            ) {
              setIsLoadingMessages(true);
            }
          }}>
          <div className="messages-wrapper">
            {sortedMessages.length !== 0 &&
              sortedMessages.map((message, index, array) => {
                const { content, sentAt, state, id, imagesUrl, replyingMessage: replyingMessageLocal, isPending, error } = message;

                const nextMessage = array[index + 1];

                const currentMessageDate = new Date(sentAt.seconds * 1000);
                const nextMessageDate = nextMessage && new Date(nextMessage.sentAt.seconds * 1000);
                const todayDate = new Date();

                const isNextMessageOlderByHour = nextMessage && nextMessageDate.getTime() - currentMessageDate.getTime() > 60 * 60 * 1000;

                const isNextMessageSentInNextDay = nextMessage && nextMessageDate.getDate() !== currentMessageDate.getDate();

                return (
                  <div key={id} style={{ opacity: isPending ? "0.5" : "1" }}>
                    {index === 0 && (
                      <p className="display-date">
                        {new Date(sentAt.seconds * 1000).toLocaleDateString("pl-PL", {
                          day: "2-digit",
                          month: "short",
                          minute: "2-digit",
                          hour: "2-digit",
                        })}
                      </p>
                    )}
                    <div className="message-wrapper">
                      {replyingMessageLocal && (
                        <div
                          className={`replying-message ${replyingMessageLocal.state}`}
                          onClick={() => {
                            const originalMessage = array.find((message) => message.id === replyingMessageLocal.id);
                            if (originalMessage) {
                              const originalMessageIndexOf = array.indexOf(originalMessage);

                              const messagesWraperElement = messagesContentElementRef.current?.firstChild as HTMLDivElement;

                              const originalMessageElement = messagesWraperElement.querySelectorAll(".message-wrapper")[
                                originalMessageIndexOf
                              ] as HTMLDivElement;

                              if (clickedReplyingMessage === null) {
                                setClickedReplyingMessage({
                                  element: originalMessageElement,
                                  startAnimation: false,
                                  id: replyingMessageLocal.id,
                                });
                              }
                            }
                          }}>
                          <div className="content">{replyingMessageLocal.content}</div>
                        </div>
                      )}
                      <div
                        className={`message ${state} ${
                          clickedReplyingMessage && clickedReplyingMessage.id === id && clickedReplyingMessage.startAnimation ? "moved-to-reply-message" : ""
                        }`}
                        onTouchMove={(event) => {
                          const touch = event.touches[0];
                          const currentMessageElement = event.currentTarget as HTMLDivElement;
                          const { clientX } = touch;

                          if (firstTouch === null) {
                            setFirstTouch(clientX);
                          } else if (replyingMessage === null) {
                            const difference = state === "to" ? firstTouch - clientX : clientX - firstTouch;

                            if (state === "to") {
                              currentMessageElement.style.transform = `translateX(-${difference}px)`;
                            } else {
                              currentMessageElement.style.transform = `translateX(${difference}px)`;
                            }

                            if (difference > 125) {
                              currentMessageElement.style.transform = `translateX(${0}px)`;

                              setTimeout(() => {
                                currentMessageElement.style.transition = "margin-bottom 250ms"; // Default transition
                              }, 250);
                              setReplyingMessage({ content: content, state: state, id: id });
                            }
                          }
                        }}
                        onTouchEnd={(event) => {
                          const currentMessageElement = event.currentTarget as HTMLDivElement;

                          setFirstTouch(null);

                          currentMessageElement.style.transition = "250ms";
                          currentMessageElement.style.transform = `translateX(${0}px)`;

                          setTimeout(() => {
                            currentMessageElement.style.transition = "margin-bottom 250ms"; // Default transition
                          }, 250);
                        }}>
                        <div className="content">{content}</div>
                        {index !== array.length - 1 && array[index + 1].state === state ? (
                          <></>
                        ) : (
                          <div className="user-image">
                            <img src={state === "from" ? (activeUserData ? activeUserData.profileImage : "") : currentUserData.profileImage} />
                          </div>
                        )}
                        {error && (
                          <span className="error">
                            <i className="fa-solid fa-exclamation"></i>
                          </span>
                        )}
                      </div>
                      <p className={`sent-at ${state}`}>
                        Wysłano{" "}
                        {currentMessageDate.toLocaleDateString("pl-PL", {
                          month: "short",
                          day: "numeric",
                          minute: "2-digit",
                          hour: "2-digit",
                        })}
                      </p>
                      {imagesUrl.length !== 0 && (
                        <div className="attached-images">
                          {imagesUrl.map((url) => {
                            return (
                              <div
                                className="image"
                                key={url}
                                onClick={() => {
                                  setLastContent("WriteMessage");
                                  setImagesToDisplay(imagesUrl);
                                }}>
                                <img style={{ backgroundImage: `url("${url}")` }}></img>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {array.length - 1 - unreadMessages === index && (
                        <div className="unread-messages">
                          <div className="user-image">
                            <img src={activeUserData ? activeUserData.profileImage : ""} />
                          </div>
                        </div>
                      )}
                    </div>
                    {nextMessage ? (
                      isNextMessageSentInNextDay ? (
                        <p className="display-date">
                          {nextMessageDate.toLocaleDateString("pl-PL", {
                            month: "short",
                            day: "numeric",
                            minute: "2-digit",
                            hour: "2-digit",
                          })}
                        </p>
                      ) : isNextMessageOlderByHour && nextMessageDate.getDate() === todayDate.getDate() ? (
                        <p className="display-date">
                          {nextMessageDate.toLocaleTimeString("pl-PL", {
                            minute: "2-digit",
                            hour: "2-digit",
                          })}
                        </p>
                      ) : isNextMessageOlderByHour ? (
                        <p className="display-date">
                          {nextMessageDate.toLocaleDateString("pl-PL", {
                            month: "short",
                            day: "numeric",
                            minute: "2-digit",
                            hour: "2-digit",
                          })}
                        </p>
                      ) : (
                        <></>
                      )
                    ) : (
                      <></>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
        <div className={`attached-images ${attachedImages ? "" : "hidden"}`}>
          <div className="wrapper">
            {attachedImages &&
              attachedImages.map((fileData) => {
                const { url } = fileData;

                if (url) {
                  return (
                    <div
                      className="image"
                      key={url}
                      onClick={() => {
                        setAttachedImages((currentValues) => {
                          if (currentValues) {
                            const copiedCurrentValues = [...currentValues];

                            const foundImage = copiedCurrentValues.find((imageData) => imageData.url === url)!;

                            const index = copiedCurrentValues.indexOf(foundImage);

                            copiedCurrentValues.splice(index, 1);

                            if (copiedCurrentValues.length === 0) {
                              return null;
                            }

                            return copiedCurrentValues;
                          }

                          return currentValues;
                        });
                      }}>
                      <img style={{ backgroundImage: `url("${url}")` }}></img>
                    </div>
                  );
                }
              })}
          </div>
        </div>
        <div className="send-message-wrapper">
          <div className="options">
            <input
              type="file"
              accept="image/*"
              className="attached-images-input"
              multiple
              hidden
              onInput={(event) => {
                const inputElement = event.currentTarget as HTMLInputElement;
                const files: { url: string | null; file: File }[] = [];

                inputElement.files &&
                  Object.keys(inputElement.files).forEach((key) => {
                    //@ts-ignore
                    const file = inputElement.files[key];

                    files.push({
                      url: null,
                      file: file,
                    });
                  });

                setAttachedImages([...files]);
              }}></input>
            <button
              className="option"
              onClick={(event) => {
                const inputElement = event.currentTarget.parentElement?.querySelector(".attached-images-input") as HTMLInputElement;
                inputElement.click();
              }}>
              <i className="fa-solid fa-image"></i>
            </button>
          </div>
          <span
            className="textarea"
            role="textbox"
            contentEditable
            onKeyUp={(event) => {
              if (event.key === "Enter") {
                const sendMessageButton = event.currentTarget.nextSibling as HTMLButtonElement;
                sendMessageButton.click();
              }
            }}
            onInput={(event) => event.currentTarget.innerText.trim().length !== 0 && setMessage(event.currentTarget.innerText)}></span>
          <button
            className="send-message"
            onClick={async (event) => {
              const textareaElement = event.currentTarget.parentElement?.querySelector(".textarea") as HTMLSpanElement;

              textareaElement.innerText = "";

              message !== null &&
                setSentQueueMessages((currentValues) => {
                  const copiedCurrentMessages = [...currentValues];

                  copiedCurrentMessages.push({
                    id: `${copiedCurrentMessages.length + 123}`,
                    state: "to",
                    content: message,
                    sentAt: Timestamp.fromDate(new Date()),
                    imagesUrl: attachedImages ? attachedImages.map((imageObject) => `${imageObject.url}`) : [],
                    replyingMessage: replyingMessage,
                    isPending: true,
                    error: false,
                  });

                  return copiedCurrentMessages;
                });

              message !== null && setUnreadMessages((currentValue) => currentValue + 1);

              try {
                message !== null && activeUserData && (await sendMessage(message, activeUserData.id, currentUserData.id, attachedImages, replyingMessage));
                setAttachedImages(null);
                setMessage(null);
                setReplyingMessage(null);
              } catch (error) {
                console.error(error);
                setSentQueueMessages((currentValues) => {
                  const copiedCurrentMessages = [...currentValues];

                  const sentMessage = copiedCurrentMessages.find((messageData) => messageData.content === message)!;

                  sentMessage.error = true;

                  return copiedCurrentMessages;
                });
              }
            }}>
            <i className="fa-solid fa-paper-plane-top"></i>
          </button>
        </div>
      </div>
      <UserOptions setAreUserOptionsOpen={setAreUserOptionsOpen} areUserOptionsOpen={areUserOptionsOpen} activeUserData={activeUserData}></UserOptions>
    </div>
  );
};

export default WriteMessage;
