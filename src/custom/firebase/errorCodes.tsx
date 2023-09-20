const errorCodes: { code: string; response: string }[] = [
  { code: "auth/email-already-exists", response: "Adres email jest zajęty" },
  { code: "auth/invalid-email", response: "Adres email jest nieprawidłowy" },
  { code: "auth/invalid-password", response: "Hasło musi zaweirać przynajmniej 6 znaków" },
  { code: "auth/user-not-found", response: "Żadne konto nie jest przypisane do tego adresu email" },
  { code: "auth/wrong-password", response: "Hasło jest nieprawidłowe" },
  { code: "auth/weak-password", response: "Hasło musi zaweirać przynajmniej 6 znaków lub jest zbyt słabe" },
  { code: "auth/email-already-in-use", response: "Adres email jest zajęty" },
  { code: "auth/invalid-email", response: "Adres email jest nieprawidłowy" },
  { code: "auth/name-alreadt-in-use", response: "Nazwa jest zajęta" },
];

export default errorCodes;
