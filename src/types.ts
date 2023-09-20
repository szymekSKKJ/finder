import { Timestamp } from "firebase/firestore";

export type currentUserType = {
  id: string | null;
  name: string | null;
  dateOfBirthday: Date | null;
  profileImage: string | null;
  backgroundImage: string | null;
  skills: number[] | null;
  description: string | null;
  email: string | null;
  following: string[] | null;
  followers: number | null;
  lastActive: Timestamp | null;
  password?: string | null;
  gender: string | null;
  stars: number | null;
  givenStarsTo: string[] | null;
  leftStars: number | null;
};

export type currentUserNotNullType = {
  id: string;
  name: string;
  dateOfBirthday: Date;
  profileImage: string;
  backgroundImage: string;
  skills: number[];
  description: string;
  email?: string;
  following: string[];
  followers: number;
  lastActive: Timestamp;
  password?: string;
  gender: string;
  stars: number;
  givenStarsTo: string[];
  leftStars: number;
};
