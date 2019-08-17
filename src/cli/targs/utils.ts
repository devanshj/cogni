import { Targs } from "./types";

export const singularize =
	(s: string) =>
		s.replace(/ies$/, "y").replace(/(s|es)$/, "");

		type Unshift<A extends any[], X> =
		((x: X, ...a: A) => any) extends ((...r: infer R) => any)
			? R
			: never;
    
export type UnshiftN<N extends number, A extends any[], X> =
	0 extends N ? A :
	1 extends N ? Unshift<A, X> :
	2 extends N ? Unshift<Unshift<A, X>, X> :
	3 extends N ? Unshift<Unshift<Unshift<A, X>, X>, X> :
	4 extends N ? Unshift<Unshift<Unshift<Unshift<A, X>, X>, X>, X> :
	5 extends N ? Unshift<Unshift<Unshift<Unshift<Unshift<A, X>, X>, X>, X>, X> :
	A;
    