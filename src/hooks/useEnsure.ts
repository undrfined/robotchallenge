import { useEffect } from 'react';
import useAppDispatch from './useAppDispatch';
import useAppSelector from './useAppSelector';
import type { RootState } from '../store';

export default function useEnsure<T extends { id: any }>(
  entityId: T['id'] | undefined,
  selector: (id: T['id']) => (state: RootState) => T | undefined,
  action: (id: T['id']) => any,
) {
  const dispatch = useAppDispatch();
  const entity = useAppSelector(selector(entityId));

  useEffect(() => {
    if (entity || !entityId) return;
    dispatch(action(entityId));
  }, [dispatch, entityId, entity, action]);

  return entity;
}
