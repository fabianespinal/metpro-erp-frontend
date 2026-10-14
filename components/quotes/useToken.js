import { useStoredItem } from '../../lib/useStoredItem'

export function useToken() {
  return useStoredItem('token')
}
