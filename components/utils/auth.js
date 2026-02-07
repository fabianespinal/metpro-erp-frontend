export const getAuthHeaders = () => {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token')
    : null

  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
}