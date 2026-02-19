import axios from "./axiosInstance";

export const getContactsByCompany = (companyId) =>
  axios.get(`/contacts/company/${companyId}`);

export const createContact = (data) =>
  axios.post("/contacts", data);

export const updateContact = (id, data) =>
  axios.put(`/contacts/${id}`, data);

export const deleteContact = (id) =>
  axios.delete(`/contacts/${id}`);