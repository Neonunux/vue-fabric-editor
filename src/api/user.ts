/*
 * @Author: 秦少卫
 * @Date: 2024-04-24 14:07:06
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-06-14 16:17:41
 * @Description: 用户接口登录
 */

import axios from 'axios';
const baseURL = import.meta.env.APP_APIHOST;

const instance = axios.create({ baseURL });

instance.interceptors.request.use(function (config) {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

const tokenKey = 'token';
function getToken() {
  const token = localStorage.getItem(tokenKey);
  return token;
}

// Detail
export const getUserInfo = (data: any) => instance.get('/api/users/me', data);

// Log in
export const login = (data: any) => instance.post('/api/auth/local', data);

// register
export const register = (data: any) => instance.post('/api/auth/local/register', data);

// Sign out
export const logout = () => localStorage.setItem(tokenKey, '');

// Automatic login
export const autoLogin = (data: any) => instance.post('/api/custom/autoAuthUser', data);

// Set token
export const setToken = (token: string) => localStorage.setItem(tokenKey, token);

// Obtain the list of personal materials
export const getFileList = (data: any) => instance.get('/api/user-materials?populate=*', data);

// Upload material
export const uploadImg = (data: any) => instance.post('/api/upload', data);

// Create material
export const createdMaterial = (data: any) => instance.post('/api/user-materials', data);

// Delete material
export const removeMaterial = (id: any) => instance.delete('/api/user-materials/' + id);

// Create template
export const createdTempl = (data: any) => instance.post('/api/user-templs', data);

// Delete material
export const removeTempl = (data: any) => instance.delete(`/api/user-templs/${data}`);

// Renewal
export const updataTempl = (id: any, data: any) => instance.put(`/api/user-templs/${id}`, data);

// Query material list
export const getTmplList = (data: any) => instance.get(`/api/user-templs?${data}`);

// Query material list
export const getTmplInfo = (data: any) => instance.get(`/api/user-templs/${data}`);

// Get user tree menu
export const getUserFileTypeTree = () => instance.get(`/api/user-templ/getUerFileTypeTree`);

// Get the menu tree
export const getFileTypeTree = (data: any) =>
  instance.get(`/api/custom/getUerFileTypeTree`, {
    params: data,
  });

// Get user tree menu
export const getUerFileTree = () => instance.get(`/api/user-templ/getUerFileTree`);
