import { api } from "@/lib/api";

export interface Proyecto {
  id: number;
  project_number: string | null;
  client_id: number;
  client_name: string | null;
  name: string;
  description: string | null;
  status: string;
  start_date: string;
  end_date: string | null;
  estimated_budget: number | null;
  notes: string | null;
  job_site_address: string | null;
  quote_id: string | null;
  quote_number: number | null;
  quote_label: string | null;
  invoice_id: number | null;
  invoice_number: string | null;
}

export type ProyectoInput = {
  client_id: number;
  name: string;
  description?: string | null;
  status?: string;
  start_date: string;
  end_date?: string | null;
  estimated_budget?: number | null;
  notes?: string | null;
  job_site_address?: string | null;
};

export const listProyectos = (status?: string) =>
  api.get(`/projects/${status ? `?status=${encodeURIComponent(status)}` : ""}`) as Promise<Proyecto[]>;

export const getProyecto = (id: number | string) => api.get(`/projects/${id}`) as Promise<Proyecto>;

export const createProyecto = (data: ProyectoInput) => api.post("/projects/", data) as Promise<Proyecto>;

export const updateProyecto = (id: number | string, data: Partial<ProyectoInput>) =>
  api.put(`/projects/${id}`, data) as Promise<Proyecto>;

export const deleteProyecto = (id: number | string) => api.delete(`/projects/${id}`);
