import { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from "react";
import { currentUserNotNullType } from "../../../../../types";
import { CurrentUserStateContext } from "../../../App";
import "./MainPosts.scss";
import Button from "../../../../Global/Button/Button";
import {
  DocumentData,
  QueryDocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../../../firebaseInitialization";
import { StorageReference, getDownloadURL, getMetadata, getStorage, listAll, ref, uploadBytes } from "firebase/storage";
import generateRandomName from "../../../../Global/generateRandomName";
import Post from "./Post/Post";
import { activePostContext } from "../../NotificationPost/NotificationPost";
import { SetSharingPostContext } from "../../Home";

const isEmpty = (str: string) => !str?.trim().length;

const setAsFirstImageInRow = (setAttachedImagesFiles: Dispatch<SetStateAction<File[] | null>>, file: File) => {
  setAttachedImagesFiles((attachedImagesFilesCurrent) => {
    if (attachedImagesFilesCurrent) {
      const attachedImagesFilesCurrentCopied = [...attachedImagesFilesCurrent];

      const choosenFile = attachedImagesFilesCurrentCopied.find((currentFile) => currentFile === file)!;

      const indexOfChoosenFile = attachedImagesFilesCurrentCopied.indexOf(choosenFile);

      attachedImagesFilesCurrentCopied.splice(indexOfChoosenFile, 1);

      attachedImagesFilesCurrentCopied.unshift(choosenFile);

      return attachedImagesFilesCurrentCopied;
    } else {
      return null;
    }
  });
};

const createPost = async (
  attachedImagesFiles: File[] | null,
  userId: string,
  postContent: string,
  setAttachedImagesFiles: Dispatch<SetStateAction<File[] | null>>,
  setPosts: Dispatch<
    SetStateAction<
      {
        id: string;
        userId: string;
        commentsCounter: number;
        usersIdLikes: string[];
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
      }[]
    >
  >,
  sharingPost: {
    id: string;
    userId: string;
    commentsCounter: number;
    usersIdLikes: string[];
    content: string;
    uploadedAt: Date;
    sharingPostsCounter: number;
    images: {
      id: string;
      url: string;
      updatedAt: Date;
    }[];
    sharingPost: null;
  } | null
) => {
  const mainImageName = attachedImagesFiles ? generateRandomName() : null;

  const docRef = await addDoc(collection(db, "users", userId, "posts"), {
    usersIdLikes: [],
    content: postContent,
    uploadedAt: serverTimestamp(),
    mainImageName: mainImageName,
    commentsCounter: 0,
    sharingPostsCounter: 0,
    sharingPost: sharingPost ? { id: sharingPost.id, userId: sharingPost.userId } : null,
  });

  if (sharingPost) {
    await updateDoc(doc(db, "users", sharingPost.userId, "posts", sharingPost.id), {
      sharingPostsCounter: increment(1),
    });
  }

  if (attachedImagesFiles) {
    const copiedAttachedImagesFiles = [...attachedImagesFiles];
    const images: { id: string; url: string; updatedAt: Date }[] = [];

    attachedImagesFiles.forEach((file) => {
      images.push({ id: docRef.id, url: URL.createObjectURL(file), updatedAt: new Date() });
    });

    await Promise.all(
      copiedAttachedImagesFiles.map(async (file, index) => {
        const postId = docRef.id;
        const storage = getStorage();
        const fileName = index === 0 ? mainImageName : generateRandomName();
        const fileExt = file.type.split("/")[1];
        const storageRef = ref(storage, `users/${userId}/posts/${postId}/${fileName}.${fileExt}`);

        await uploadBytes(storageRef, file);
      })
    );

    setPosts((currantValue) => {
      const copiedCurrentValue = [...currantValue];

      copiedCurrentValue.unshift({
        id: docRef.id,
        userId: userId,
        usersIdLikes: [],
        content: postContent,
        images: images,
        commentsCounter: 0,
        uploadedAt: new Date(),
        sharingPost: sharingPost,
        sharingPostsCounter: 0,
      });

      return copiedCurrentValue;
    });
  } else {
    setPosts((currantValue) => {
      const copiedCurrentValue = [...currantValue];

      copiedCurrentValue.unshift({
        id: docRef.id,
        userId: userId,
        usersIdLikes: [],
        content: postContent,
        images: [],
        commentsCounter: 0,
        uploadedAt: new Date(),
        sharingPost: sharingPost,
        sharingPostsCounter: 0,
      });

      return copiedCurrentValue;
    });
  }

  setAttachedImagesFiles(null);
};

const createSkeletonPostElements = () => {
  const postElements = [];

  for (let i = 0; i <= 5; i++) {
    postElements.push(
      <div className="post-skeleton" key={i}>
        <div className="user">
          <div className="image"></div>
          <p></p>
        </div>
        <p className="content"></p>
        <div className="actions">
          <button></button>
          <button></button>
          <button></button>
        </div>
      </div>
    );
  }
  return postElements;
};

const getPosts = async (
  usersId: string[],
  setPosts: Dispatch<
    SetStateAction<
      {
        id: string;
        userId: string;
        commentsCounter: number;
        usersIdLikes: string[];
        content: string;
        uploadedAt: Date;
        sharingPostsCounter: number;
        images: { id: string; url: string; updatedAt: Date }[];
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
      }[]
    >
  >,
  lastPost: null | {
    id: string;
    userId: string;
    commentsCounter: number;
    usersIdLikes: string[];
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
  },
  setAreAllPostLoaded: Dispatch<SetStateAction<boolean>>,
  activePost?: {
    postId: string;
    userIdOfCreatedPost: string;
    commentId: string;
    replyId: string;
    type: string;
  } | null
) => {
  const usersPosts: {
    id: string;
    userId: string;
    commentsCounter: number;
    usersIdLikes: string[];
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
  }[] = [];

  const waitingSharigPosts: {
    mainPostId: string;
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
  }[] = [];

  await Promise.all(
    usersId.map(async (userId) => {
      const q = activePost
        ? query(collection(db, "users", userId, "posts"), where(documentId(), "==", activePost.postId))
        : query(
            collection(db, "users", userId, "posts"),
            where("uploadedAt", "<", lastPost ? Timestamp.fromDate(lastPost.uploadedAt) : Timestamp.fromDate(new Date())),
            orderBy("uploadedAt", "desc"),
            limit(10)
          );

      const querySnapshot = await getDocs(q);

      const postsData: QueryDocumentSnapshot<DocumentData>[] = [];

      querySnapshot.size === 0 && setAreAllPostLoaded(true);

      querySnapshot.forEach((doc) => {
        postsData.push(doc);
      });

      await Promise.all(
        postsData.map(async (docData) => {
          const { commentsCounter, content, uploadedAt, usersIdLikes, sharingPost, sharingPostsCounter } = docData.data();

          const storage = getStorage();

          const result = await listAll(ref(storage, `users/${userId}/posts/${docData.id}`));
          const images: { id: string; url: string; updatedAt: Date }[] = [];

          await Promise.all(
            result.items.map(async (imageRef: StorageReference) => {
              const url = await getDownloadURL(ref(storage, `${imageRef}`));
              const metaData = await getMetadata(imageRef);

              if (docData.data().mainImageName === metaData.name.split(".")[0]) {
                images.unshift({ id: metaData.name, url: url, updatedAt: new Date(metaData.updated) });
              } else {
                images.push({ id: metaData.name, url: url, updatedAt: new Date(metaData.updated) });
              }
            })
          );

          const mainImage = images.shift()!;

          images.sort((a, b) => {
            if (a.updatedAt && b.updatedAt) {
              return b.updatedAt.getTime() - a.updatedAt.getTime();
            } else {
              return 0;
            }
          });

          images.unshift(mainImage);

          waitingSharigPosts.push({
            mainPostId: docData.id,
            sharingPost: sharingPost,
          });

          usersPosts.push({
            userId: userId,
            commentsCounter: commentsCounter,
            usersIdLikes: usersIdLikes,
            id: docData.id,
            content: content,
            images: images,
            uploadedAt: new Date(uploadedAt.seconds * 1000),
            sharingPost: null,
            sharingPostsCounter: sharingPostsCounter,
          });
        })
      );
    })
  );

  setPosts((currentValues) => {
    const copiedCurrentValues = [...currentValues];

    const ids = new Set(copiedCurrentValues.map((d) => d.id));
    const merged = [...copiedCurrentValues, ...usersPosts.filter((d) => !ids.has(d.id))];

    merged.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());

    return merged;
  });

  waitingSharigPosts.map(async (post) => {
    const { sharingPost } = post;
    if (sharingPost) {
      const docSnap = await getDoc(doc(db, "users", sharingPost.userId, "posts", sharingPost.id));
      const docSnapData = docSnap.data()!;

      const storage = getStorage();

      const result = await listAll(ref(storage, `users/${sharingPost.userId}/posts/${sharingPost.id}`));
      const sharingPostImages: { id: string; url: string; updatedAt: Date }[] = [];

      await Promise.all(
        result.items.map(async (imageRef: StorageReference) => {
          //@ts-ignore
          const url = await getDownloadURL(ref(storage, imageRef));
          const metaData = await getMetadata(imageRef);

          if (docSnapData.mainImageName === metaData.name.split(".")[0]) {
            sharingPostImages.unshift({ id: metaData.name, url: url, updatedAt: new Date(metaData.updated) });
          } else {
            sharingPostImages.push({ id: metaData.name, url: url, updatedAt: new Date(metaData.updated) });
          }
        })
      );

      const mainImage = sharingPostImages.shift()!;

      sharingPostImages.sort((a, b) => {
        if (a.updatedAt && b.updatedAt) {
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        } else {
          return 0;
        }
      });

      sharingPostImages.unshift(mainImage);

      setPosts((currentValues) => {
        const copiedCurrentValues = [...currentValues];

        const foundPost = copiedCurrentValues.find((postLocal) => postLocal.id === post.mainPostId)!;

        foundPost.sharingPost = {
          id: docSnap.id,
          userId: sharingPost.userId,
          commentsCounter: docSnapData.commentsCounter,
          content: docSnapData.content,
          uploadedAt: new Date(docSnapData.uploadedAt.seconds * 1000),
          usersIdLikes: docSnapData.usersIdLikes,
          images: sharingPostImages,
          sharingPost: null,
          sharingPostsCounter: docSnapData.sharingPostsCounter,
        };

        return copiedCurrentValues;
      });
    }
  });
};

const MainPosts = ({
  usersId,
  userId,
  scrollableElement,
  sharingPost = null,
}: {
  usersId: string[];
  userId?: string;
  activePost?: {
    postId: string;
    userIdOfCreatedPost: string;
    commentId: string;
    replyId: string;
    type: string;
  } | null;
  scrollableElement?: HTMLDivElement | null;
  sharingPost?: null | {
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
  const activePost = useContext(activePostContext);

  const [attachedImagesFiles, setAttachedImagesFiles] = useState<File[] | null>(null);
  const [textareaValue, setTextareaVlue] = useState<string | null>(null);

  const [posts, setPosts] = useState<
    {
      id: string;
      userId: string;
      commentsCounter: number;
      usersIdLikes: string[];
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
        sharingPostsCounter: number;
        sharingPost: null;
      } | null;
    }[]
  >([]);

  const [isLoadingPosts, setIsLoadingPosts] = useState(sharingPost === null ? true : false);

  const [areAllPostLoaded, setAreAllPostLoaded] = useState(false);

  const [currentUserDataFromContext] = useContext(CurrentUserStateContext);

  const setSharingPost = useContext(SetSharingPostContext);

  const mainPostsElementRef = useRef<HTMLDivElement | null>(null);

  const currentUserData = currentUserDataFromContext as currentUserNotNullType;

  useEffect(() => {
    if (scrollableElement) {
      const scrollListener = async () => {
        //! Coś dziwne to
        if (scrollableElement.scrollTop > scrollableElement.scrollHeight * 0.3 && isLoadingPosts === false && areAllPostLoaded === false) {
          setIsLoadingPosts(true);
        }
      };

      scrollableElement.addEventListener("scroll", scrollListener);

      return () => {
        scrollableElement.removeEventListener("scroll", scrollListener);
      };
    }
  }, [posts, isLoadingPosts]);

  useEffect(() => {
    if (isLoadingPosts === true) {
      sharingPost === null && getPosts(usersId, setPosts, posts[posts.length - 1], setAreAllPostLoaded, activePost);
    }
  }, [isLoadingPosts]);

  //! Dodać odświeżanie postów

  useEffect(() => {
    setIsLoadingPosts(false);
  }, [posts]);

  return (
    <div className="main-posts" ref={mainPostsElementRef}>
      {currentUserData && (
        <>
          {userId === currentUserData.id && (
            <div className="write-post">
              <div className="user">
                <div className="image">
                  <img src={currentUserData.profileImage}></img>
                </div>
                <p>{currentUserData.name}</p>
              </div>
              <span
                className={`textarea ${textareaValue ? "not-empty" : ""}`}
                role="textbox"
                contentEditable
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    //!
                    return;
                  }
                }}
                onInput={(event) => {
                  const textareaValueFromElement = event.currentTarget.textContent?.toString() as string;

                  if (!isEmpty(textareaValueFromElement)) {
                    setTextareaVlue(event.currentTarget.textContent);
                  } else {
                    setTextareaVlue(null);
                  }
                }}></span>
              {attachedImagesFiles && attachedImagesFiles.length !== 0 && (
                <div className="attached-images">
                  {attachedImagesFiles.map((file) => {
                    return (
                      <div className="image" onClick={() => setAsFirstImageInRow(setAttachedImagesFiles, file)}>
                        <img style={{ backgroundImage: `url("${URL.createObjectURL(file)}")` }}></img>
                      </div>
                    );
                  })}
                </div>
              )}
              {sharingPost && (
                <div className="sharing-post">
                  <Post postData={sharingPost}></Post>
                </div>
              )}
              <div className="actions">
                <div
                  className="image"
                  onClick={(event) => {
                    const inputElement = event.currentTarget.querySelector("input") as HTMLInputElement;

                    inputElement.click();
                  }}>
                  <i className="fa-regular fa-image"></i>
                  <input
                    type="file"
                    multiple
                    hidden
                    accept="image/*"
                    onChange={(event) => {
                      const inputElement = event.currentTarget as HTMLInputElement;

                      if (inputElement.files) {
                        setAttachedImagesFiles([...inputElement.files]);
                      }
                    }}></input>
                </div>
                <Button
                  onClick={async (event) => {
                    if (event.currentTarget.parentElement) {
                      const textareaElement = event.currentTarget.parentElement.parentElement?.querySelector(".textarea") as HTMLSpanElement;
                      if (textareaValue) {
                        await createPost(attachedImagesFiles, currentUserData.id, textareaValue, setAttachedImagesFiles, setPosts, sharingPost);
                        setAttachedImagesFiles(null);
                        setTextareaVlue(null);
                        setSharingPost(null);
                        textareaElement.innerHTML = ""; // :(
                      }
                    }
                  }}>
                  Wyślij
                </Button>
              </div>
            </div>
          )}

          <div className="posts">
            {posts.length !== 0 &&
              posts.map((post) => {
                return <Post key={post.id} postData={post}></Post>;
              })}
            {isLoadingPosts && <>{createSkeletonPostElements()}</>}
          </div>
        </>
      )}
    </div>
  );
};

export default MainPosts;
