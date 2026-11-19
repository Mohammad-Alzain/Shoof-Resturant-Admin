/* eslint-disable @typescript-eslint/no-explicit-any */
const isValid = (value: any): value is string =>
  value !== null && value !== undefined && value !== "";

export const getUserDisplay = (user: any) => {
  if (!user) return null;
  if (typeof user === "string") return user;
  return isValid(user.username)
    ? user.username
    : isValid(user.fullname)
    ? user.fullname
    : isValid(user.email)
    ? user.email
    : user.id;
};
