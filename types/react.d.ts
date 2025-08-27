export namespace Children {
  function count(children: any): any;
  function forEach(children: any, forEachFunc: any, forEachContext: any): void;
  function map(children: any, func: any, context: any): any;
  function only(children: any): any;
  function toArray(children: any): any;
}
export class Component {
  constructor(props: any, context: any, updater: any);
  props: any;
  context: any;
  refs: any;
  updater: any;
  forceUpdate(callback: any): void;
  setState(partialState: any, callback: any): void;
}
export const Fragment: symbol;
export const Profiler: symbol;
export class PureComponent {
  constructor(props: any, context: any, updater: any);
  props: any;
  context: any;
  refs: any;
  updater: any;
  forceUpdate(callback: any): void;
  setState(partialState: any, callback: any): void;
}
export const StrictMode: symbol;
export const Suspense: symbol;
export function act(callback: any): any;
export function cache(fn: any): any;
export function captureOwnerStack(): any;
export function cloneElement(element: any, config: any, children: any, ...args: any[]): any;
export function createContext(defaultValue: any): any;
export function createElement(type: any, config: any, children: any, ...args: any[]): any;
export function createRef(): any;
export function forwardRef(render: any): any;
export function isValidElement(object: any): any;
export function lazy(ctor: any): any;
export function memo(type: any, compare: any): any;
export function startTransition(scope: any): void;
export function unstable_useCacheRefresh(): any;
export function use(usable: any): any;
export function useActionState(action: any, initialState: any, permalink: any): any;
export function useCallback(callback: any, deps: any): any;
export function useContext(Context: any): any;
export function useDebugValue(value: any, formatterFn: any): any;
export function useDeferredValue(value: any, initialValue: any): any;
export function useEffect(create: any, createDeps: any, update: any): any;
export function useId(): any;
export function useImperativeHandle(ref: any, create: any, deps: any): any;
export function useInsertionEffect(create: any, deps: any): any;
export function useLayoutEffect(create: any, deps: any): any;
export function useMemo(create: any, deps: any): any;
export function useOptimistic(passthrough: any, reducer: any): any;
export function useReducer(reducer: any, initialArg: any, init: any): any;
export function useRef(initialValue: any): any;
export function useState(initialState: any): any;
export function useSyncExternalStore(subscribe: any, getSnapshot: any, getServerSnapshot: any): any;
export function useTransition(): any;
export const version: string;
