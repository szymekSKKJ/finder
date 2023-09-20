const generateRandomName = () => {
  let fileName = "";

  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;

  while (counter < 50) {
    fileName += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return fileName;
};

export default generateRandomName;
