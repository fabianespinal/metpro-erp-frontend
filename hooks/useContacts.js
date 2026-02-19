import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getContactsByCompany,
  createContact,
  updateContact,
  deleteContact,
} from "../lib/api/contacts";

export const useContacts = (companyId) => {
  const queryClient = useQueryClient();

  const contactsQuery = useQuery({
    queryKey: ["contacts", companyId],
    queryFn: () => getContactsByCompany(companyId).then((res) => res.data),
    enabled: !!companyId,
  });

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries(["contacts", companyId]);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["contacts", companyId]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries(["contacts", companyId]);
    },
  });

  return {
    contactsQuery,
    createMutation,
    updateMutation,
    deleteMutation,
  };
};