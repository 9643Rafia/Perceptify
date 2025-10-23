// Compatibility wrapper for migration: re-export named helpers from auth.api
import AuthAPI from './auth.api';

export const register = AuthAPI.register;
export const login = AuthAPI.login;
export const logout = AuthAPI.logout;
export const getCurrentUser = AuthAPI.getCurrentUser;
export const approveAccount = AuthAPI.approveAccount;

export default AuthAPI;
