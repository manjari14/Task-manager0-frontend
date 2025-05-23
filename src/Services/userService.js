import axios from "axios";
import {
  registrationStart,
  registrationEnd,
  loginStart,
  loginFailure,
  loginSuccess,
  loadSuccess,
  loadFailure,
  loadStart,
  fetchingStart,
  fetchingFinish,
} from "../Redux/Slices/userSlice";
import { openAlert } from "../Redux/Slices/alertSlice";
import setBearer from "../Utils/setBearer";

const baseUrl = "https://project-manager-backend-afgb.onrender.com/user/";

export const register = async (
  { name, surname, email, password, repassword },
  dispatch
) => {
  dispatch(registrationStart());
  if (password !== repassword) {
    dispatch(
      openAlert({
        message: "Your passwords does not match!",
        severity: "error",
      })
    );
  } else {
    try {
      const res = await axios.post(`${baseUrl}register`, {
        name,
        surname,
        email,
        password,
      });
      console.log("===consoe", res);
      if (res && res.data.createdAt) {
        localStorage.setItem("signupTime", res.data.createdAt);
      }
      dispatch(
        openAlert({
          message: res.data.message,
          severity: "success",
          nextRoute: "/login",
          duration: 1500,
        })
      );
    } catch (error) {
      dispatch(
        openAlert({
          message: error?.response?.data?.errMessage
            ? error.response.data.errMessage
            : error.message,
          severity: "error",
        })
      );
    }
  }
  dispatch(registrationEnd());
};

export const login = async ({ email, password }, dispatch) => {
  dispatch(loginStart());
  try {
    const res = await axios.post(baseUrl + "login", { email, password });
    const { user, message } = res.data;
    localStorage.setItem("token", user.token);
    setBearer(user.token);
    dispatch(loginSuccess({ user }));
    dispatch(
      openAlert({
        message,
        severity: "success",
        duration: 500,
        nextRoute: "/boards",
      })
    );
  } catch (error) {
    dispatch(loginFailure());
    dispatch(
      openAlert({
        message: error?.response?.data?.errMessage
          ? error.response.data.errMessage
          : error.message,
        severity: "error",
      })
    );
  }
};

export const loadUser = async (dispatch) => {
  dispatch(loadStart());

  const token = localStorage.getItem("token");
  if (!token) {
    dispatch(loadFailure());
    return;
  }

  try {
    const res = await axios.get(baseUrl + "get-user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    dispatch(loadSuccess({ user: res.data }));
  } catch (error) {
    console.error("Error fetching user:", error.response?.data || error);

    // If unauthorized, redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("token"); // Clear invalid token
      window.location.href = "/login"; // Redirect to login
    }

    dispatch(loadFailure());
  }
};

export const getUserFromEmail = async (email, dispatch) => {
  dispatch(fetchingStart());
  if (!email) {
    dispatch(
      openAlert({
        message: "Please write an email to invite",
        severity: "warning",
      })
    );
    dispatch(fetchingFinish());
    return null;
  }

  try {
    const res = await axios.post(baseUrl + "get-user-with-email", { email });
    dispatch(fetchingFinish());
    return res.data;
  } catch (error) {
    dispatch(
      openAlert({
        message: error?.response?.data?.errMessage
          ? error.response.data.errMessage
          : error.message,
        severity: "error",
      })
    );
    dispatch(fetchingFinish());
    return null;
  }
};
