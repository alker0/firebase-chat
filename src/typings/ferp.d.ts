type State<T> = T
type Message<T> = T
type UpdateResult<T, U> = ReturnType<AppParams<T, U>["update"]>

type EffectMessage<T=unknown> = NativeEffectMessage | Message<T>
type NativeEffectMessage = {
  effectType: Symbol
}
type NoneEffect = () => NativeEffectMessage
type DeferEffect = (promise: Promise<() => void>) => NativeEffectMessage
type ThunkEffect = (effectFunc: Effect) => NativeEffectMessage
type BatchEffect = (batchEffects: Effect[]) => NativeEffectMessage
type NativeEffect = NoneEffect | DeferEffect | ThunkEffect | BatchEffect
type Effect<T=unknown, U=undefined> = NativeEffect | ((...args: U) => EffectMessage<T>)

type NativeEffects = {
  none: NoneEffect,
  defer: DeferEffect,
  thunk: ThunkEffect,
  batch: BatchEffect,
  delay: any,
  raf: any
}

type SubscriptionRunner<T=any> = (dispatch: Dispatch<T>) => () => void
type SubscriptionFunction<T extends any[]=[], U=any> = (...args: T) => SubscriptionRunner<U>
type SubscriptionElement<T extends any[]=[], U=any> = false | List.Cons<SubscriptionFunction<T, U>, T>

type Subscriptions<M, S extends any[]=[]> = {
  [K in keyof S]: SubscriptionElement<S[K], M>
}

type SubscribeParams<T, M=unknown, S extends any[]=[]> = (state?: State<T>) => Subscriptions<M, S>

type Dispatch<T> = (effectMessage: EffectMessage<T>) => void

type AppParams<ST, MS, SB> = {
  init: [State<ST>, EffectMessage<MS>],
  update: (message: Message<MS>, previousState: State<ST>) => [State<ST>, EffectMessage<MS>],
  subscribe?: SubscribeParams<ST, MS, SB>
}

export const app: <ST, MS, SB>(appParams: AppParams<ST, MS, SB>) => void

export const effects: NativeEffects

export const subscriptions: {
  every: any
}

export const util: {
  combineReducers: (reducers: any[]) => void
}
