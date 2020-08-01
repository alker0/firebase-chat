export type StateKey = symbol | string | number

type DropDownState = {
  shown: boolean
}

type DropDownStateMap<T extends StateKey> = {
  [Key in T]: DropDownState
}

export type StateMap<T extends StateKey, U> = {
  [Key in T]: U
}

export type UpdateState<T extends StateKey, U> = Record<T, U>

export type KeyMap = StateKey | Record<StateKey, StateKey>

export type InitArg<
    TKeyMap extends KeyMap,
    TKey extends StateKey,
    TAny extends unknown,
    TState extends TAny & StateMap<TKey> = TAny & StateMap<TKey>
  > = {
  key: TKeyMap,
  preProcess?: (...preArgs: any) => TState
  postProcess?: (postArg: TState) => any
}
