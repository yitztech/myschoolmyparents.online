export type AuthStackParams = {
  Login: undefined;
  Register: undefined;
  Recover: undefined;
};

export type AppStackParams = {
  Library: undefined;
  Book: { bookId: string };
};
