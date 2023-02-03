import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';

export default function useAppDispatch() {
  return useDispatch<AppDispatch>();
}
