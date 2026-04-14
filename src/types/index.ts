//user registration
export interface UserType {
  userID: string;
  userName: string;
  userEmail: string;
  password: string;
  role: string;
}
//user login
export interface IUserLogin {
  userEmail: string;
  password: string;
}
//pagination types
export interface PaginationRequest {
  Email: string;
  page: number;
  size: number;
  search: string;
  filters: { [key: string]: string };
  sortBy?: string;
  sortOrder?: string;
}
