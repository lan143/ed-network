function e(e) {
	if (e && typeof e == "object" && "error" in e) {
		let t = e.error;
		if (typeof t == "string" && t.length > 0) return t;
	}
}
function t(t = {}) {
	let n = t.baseUrl ?? "", r = t.headers ?? {};
	async function i(t, i) {
		let a;
		try {
			a = await fetch(`${n}${t}`, {
				...i,
				headers: {
					Accept: "application/json",
					...i?.body === void 0 ? {} : { "Content-Type": "application/json" },
					...r
				}
			});
		} catch (e) {
			return i?.signal?.aborted === !0 || typeof e == "object" && e && e.name === "AbortError" ? {
				ok: !1,
				message: "Request aborted."
			} : {
				ok: !1,
				message: "Network request failed. Check the device connection and try again."
			};
		}
		let o = await a.text().catch(() => ""), s, c = !1;
		if (o.length > 0) try {
			s = JSON.parse(o), c = !0;
		} catch {
			c = !1;
		}
		if (!a.ok) {
			let t = e(s);
			return {
				ok: !1,
				status: a.status,
				message: t ?? `Request failed with HTTP ${a.status}.`
			};
		}
		return c ? {
			ok: !0,
			data: s
		} : {
			ok: !1,
			status: a.status,
			message: `Unexpected response from server (HTTP ${a.status}).`
		};
	}
	return {
		getSettings(e) {
			return i("/api/network/settings", { signal: e });
		},
		saveSettings(e, t) {
			return i("/api/network/settings", {
				method: "POST",
				body: JSON.stringify(e),
				signal: t
			});
		},
		getStatus(e) {
			return i("/api/network/status", { signal: e });
		},
		wifiList(e) {
			return i("/api/wifi/list", { signal: e });
		}
	};
}
//#endregion
//#region node_modules/@lit/reactive-element/css-tag.js
var n = globalThis, r = n.ShadowRoot && (n.ShadyCSS === void 0 || n.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, i = Symbol(), a = /* @__PURE__ */ new WeakMap(), o = class {
	constructor(e, t, n) {
		if (this._$cssResult$ = !0, n !== i) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = e, this.t = t;
	}
	get styleSheet() {
		let e = this.o, t = this.t;
		if (r && e === void 0) {
			let n = t !== void 0 && t.length === 1;
			n && (e = a.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), n && a.set(t, e));
		}
		return e;
	}
	toString() {
		return this.cssText;
	}
}, s = (e) => new o(typeof e == "string" ? e : e + "", void 0, i), c = (e, ...t) => new o(e.length === 1 ? e[0] : t.reduce((t, n, r) => t + ((e) => {
	if (!0 === e._$cssResult$) return e.cssText;
	if (typeof e == "number") return e;
	throw Error("Value passed to 'css' function must be a 'css' function result: " + e + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
})(n) + e[r + 1], e[0]), e, i), l = (e, t) => {
	if (r) e.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
	else for (let r of t) {
		let t = document.createElement("style"), i = n.litNonce;
		i !== void 0 && t.setAttribute("nonce", i), t.textContent = r.cssText, e.appendChild(t);
	}
}, u = r ? (e) => e : (e) => e instanceof CSSStyleSheet ? ((e) => {
	let t = "";
	for (let n of e.cssRules) t += n.cssText;
	return s(t);
})(e) : e, { is: d, defineProperty: ee, getOwnPropertyDescriptor: te, getOwnPropertyNames: ne, getOwnPropertySymbols: re, getPrototypeOf: ie } = Object, f = globalThis, p = f.trustedTypes, ae = p ? p.emptyScript : "", oe = f.reactiveElementPolyfillSupport, m = (e, t) => e, h = {
	toAttribute(e, t) {
		switch (t) {
			case Boolean:
				e = e ? ae : null;
				break;
			case Object:
			case Array: e = e == null ? e : JSON.stringify(e);
		}
		return e;
	},
	fromAttribute(e, t) {
		let n = e;
		switch (t) {
			case Boolean:
				n = e !== null;
				break;
			case Number:
				n = e === null ? null : Number(e);
				break;
			case Object:
			case Array: try {
				n = JSON.parse(e);
			} catch {
				n = null;
			}
		}
		return n;
	}
}, g = (e, t) => !d(e, t), _ = {
	attribute: !0,
	type: String,
	converter: h,
	reflect: !1,
	useDefault: !1,
	hasChanged: g
};
Symbol.metadata ??= Symbol("metadata"), f.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var v = class extends HTMLElement {
	static addInitializer(e) {
		this._$Ei(), (this.l ??= []).push(e);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(e, t = _) {
		if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
			let n = Symbol(), r = this.getPropertyDescriptor(e, n, t);
			r !== void 0 && ee(this.prototype, e, r);
		}
	}
	static getPropertyDescriptor(e, t, n) {
		let { get: r, set: i } = te(this.prototype, e) ?? {
			get() {
				return this[t];
			},
			set(e) {
				this[t] = e;
			}
		};
		return {
			get: r,
			set(t) {
				let a = r?.call(this);
				i?.call(this, t), this.requestUpdate(e, a, n);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(e) {
		return this.elementProperties.get(e) ?? _;
	}
	static _$Ei() {
		if (this.hasOwnProperty(m("elementProperties"))) return;
		let e = ie(this);
		e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(m("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(m("properties"))) {
			let e = this.properties, t = [...ne(e), ...re(e)];
			for (let n of t) this.createProperty(n, e[n]);
		}
		let e = this[Symbol.metadata];
		if (e !== null) {
			let t = litPropertyMetadata.get(e);
			if (t !== void 0) for (let [e, n] of t) this.elementProperties.set(e, n);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (let [e, t] of this.elementProperties) {
			let n = this._$Eu(e, t);
			n !== void 0 && this._$Eh.set(n, e);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(e) {
		let t = [];
		if (Array.isArray(e)) {
			let n = new Set(e.flat(1 / 0).reverse());
			for (let e of n) t.unshift(u(e));
		} else e !== void 0 && t.push(u(e));
		return t;
	}
	static _$Eu(e, t) {
		let n = t.attribute;
		return !1 === n ? void 0 : typeof n == "string" ? n : typeof e == "string" ? e.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
	}
	addController(e) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
	}
	removeController(e) {
		this._$EO?.delete(e);
	}
	_$E_() {
		let e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
		for (let n of t.keys()) this.hasOwnProperty(n) && (e.set(n, this[n]), delete this[n]);
		e.size > 0 && (this._$Ep = e);
	}
	createRenderRoot() {
		let e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return l(e, this.constructor.elementStyles), e;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
	}
	enableUpdating(e) {}
	disconnectedCallback() {
		this._$EO?.forEach((e) => e.hostDisconnected?.());
	}
	attributeChangedCallback(e, t, n) {
		this._$AK(e, n);
	}
	_$ET(e, t) {
		let n = this.constructor.elementProperties.get(e), r = this.constructor._$Eu(e, n);
		if (r !== void 0 && !0 === n.reflect) {
			let i = (n.converter?.toAttribute === void 0 ? h : n.converter).toAttribute(t, n.type);
			this._$Em = e, i == null ? this.removeAttribute(r) : this.setAttribute(r, i), this._$Em = null;
		}
	}
	_$AK(e, t) {
		let n = this.constructor, r = n._$Eh.get(e);
		if (r !== void 0 && this._$Em !== r) {
			let e = n.getPropertyOptions(r), i = typeof e.converter == "function" ? { fromAttribute: e.converter } : e.converter?.fromAttribute === void 0 ? h : e.converter;
			this._$Em = r;
			let a = i.fromAttribute(t, e.type);
			this[r] = a ?? this._$Ej?.get(r) ?? a, this._$Em = null;
		}
	}
	requestUpdate(e, t, n, r = !1, i) {
		if (e !== void 0) {
			let a = this.constructor;
			if (!1 === r && (i = this[e]), n ??= a.getPropertyOptions(e), !((n.hasChanged ?? g)(i, t) || n.useDefault && n.reflect && i === this._$Ej?.get(e) && !this.hasAttribute(a._$Eu(e, n)))) return;
			this.C(e, t, n);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(e, t, { useDefault: n, reflect: r, wrapped: i }, a) {
		n && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, a ?? t ?? this[e]), !0 !== i || a !== void 0) || (this._$AL.has(e) || (this.hasUpdated || n || (t = void 0), this._$AL.set(e, t)), !0 === r && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (e) {
			Promise.reject(e);
		}
		let e = this.scheduleUpdate();
		return e != null && await e, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (let [e, t] of this._$Ep) this[e] = t;
				this._$Ep = void 0;
			}
			let e = this.constructor.elementProperties;
			if (e.size > 0) for (let [t, n] of e) {
				let { wrapped: e } = n, r = this[t];
				!0 !== e || this._$AL.has(t) || r === void 0 || this.C(t, void 0, n, r);
			}
		}
		let e = !1, t = this._$AL;
		try {
			e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((e) => e.hostUpdate?.()), this.update(t)) : this._$EM();
		} catch (t) {
			throw e = !1, this._$EM(), t;
		}
		e && this._$AE(t);
	}
	willUpdate(e) {}
	_$AE(e) {
		this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(e) {
		return !0;
	}
	update(e) {
		this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
	}
	updated(e) {}
	firstUpdated(e) {}
};
v.elementStyles = [], v.shadowRootOptions = { mode: "open" }, v[m("elementProperties")] = /* @__PURE__ */ new Map(), v[m("finalized")] = /* @__PURE__ */ new Map(), oe?.({ ReactiveElement: v }), (f.reactiveElementVersions ??= []).push("2.1.2");
//#endregion
//#region node_modules/lit-html/lit-html.js
var y = globalThis, b = (e) => e, x = y.trustedTypes, S = x ? x.createPolicy("lit-html", { createHTML: (e) => e }) : void 0, C = "$lit$", w = `lit$${Math.random().toFixed(9).slice(2)}$`, T = "?" + w, se = `<${T}>`, E = document, D = () => E.createComment(""), O = (e) => e === null || typeof e != "object" && typeof e != "function", k = Array.isArray, ce = (e) => k(e) || typeof e?.[Symbol.iterator] == "function", A = "[ 	\n\f\r]", j = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, le = /-->/g, M = />/g, N = RegExp(`>|${A}(?:([^\\s"'>=/]+)(${A}*=${A}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g"), P = /'/g, F = /"/g, I = /^(?:script|style|textarea|title)$/i, L = ((e) => (t, ...n) => ({
	_$litType$: e,
	strings: t,
	values: n
}))(1), R = Symbol.for("lit-noChange"), z = Symbol.for("lit-nothing"), B = /* @__PURE__ */ new WeakMap(), V = E.createTreeWalker(E, 129);
function H(e, t) {
	if (!k(e) || !e.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return S === void 0 ? t : S.createHTML(t);
}
var ue = (e, t) => {
	let n = e.length - 1, r = [], i, a = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = j;
	for (let t = 0; t < n; t++) {
		let n = e[t], s, c, l = -1, u = 0;
		for (; u < n.length && (o.lastIndex = u, c = o.exec(n), c !== null);) u = o.lastIndex, o === j ? c[1] === "!--" ? o = le : c[1] === void 0 ? c[2] === void 0 ? c[3] !== void 0 && (o = N) : (I.test(c[2]) && (i = RegExp("</" + c[2], "g")), o = N) : o = M : o === N ? c[0] === ">" ? (o = i ?? j, l = -1) : c[1] === void 0 ? l = -2 : (l = o.lastIndex - c[2].length, s = c[1], o = c[3] === void 0 ? N : c[3] === "\"" ? F : P) : o === F || o === P ? o = N : o === le || o === M ? o = j : (o = N, i = void 0);
		let d = o === N && e[t + 1].startsWith("/>") ? " " : "";
		a += o === j ? n + se : l >= 0 ? (r.push(s), n.slice(0, l) + C + n.slice(l) + w + d) : n + w + (l === -2 ? t : d);
	}
	return [H(e, a + (e[n] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), r];
}, U = class e {
	constructor({ strings: t, _$litType$: n }, r) {
		let i;
		this.parts = [];
		let a = 0, o = 0, s = t.length - 1, c = this.parts, [l, u] = ue(t, n);
		if (this.el = e.createElement(l, r), V.currentNode = this.el.content, n === 2 || n === 3) {
			let e = this.el.content.firstChild;
			e.replaceWith(...e.childNodes);
		}
		for (; (i = V.nextNode()) !== null && c.length < s;) {
			if (i.nodeType === 1) {
				if (i.hasAttributes()) for (let e of i.getAttributeNames()) if (e.endsWith(C)) {
					let t = u[o++], n = i.getAttribute(e).split(w), r = /([.?@])?(.*)/.exec(t);
					c.push({
						type: 1,
						index: a,
						name: r[2],
						strings: n,
						ctor: r[1] === "." ? fe : r[1] === "?" ? pe : r[1] === "@" ? me : K
					}), i.removeAttribute(e);
				} else e.startsWith(w) && (c.push({
					type: 6,
					index: a
				}), i.removeAttribute(e));
				if (I.test(i.tagName)) {
					let e = i.textContent.split(w), t = e.length - 1;
					if (t > 0) {
						i.textContent = x ? x.emptyScript : "";
						for (let n = 0; n < t; n++) i.append(e[n], D()), V.nextNode(), c.push({
							type: 2,
							index: ++a
						});
						i.append(e[t], D());
					}
				}
			} else if (i.nodeType === 8) {
				if (i.data === T) c.push({
					type: 2,
					index: a
				});
				else {
					let e = -1;
					for (; (e = i.data.indexOf(w, e + 1)) !== -1;) c.push({
						type: 7,
						index: a
					}), e += w.length - 1;
				}
			}
			a++;
		}
	}
	static createElement(e, t) {
		let n = E.createElement("template");
		return n.innerHTML = e, n;
	}
};
function W(e, t, n = e, r) {
	if (t === R) return t;
	let i = r === void 0 ? n._$Cl : n._$Co?.[r], a = O(t) ? void 0 : t._$litDirective$;
	return i?.constructor !== a && (i?._$AO?.(!1), a === void 0 ? i = void 0 : (i = new a(e), i._$AT(e, n, r)), r === void 0 ? n._$Cl = i : (n._$Co ??= [])[r] = i), i !== void 0 && (t = W(e, i._$AS(e, t.values), i, r)), t;
}
var de = class {
	constructor(e, t) {
		this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(e) {
		let { el: { content: t }, parts: n } = this._$AD, r = (e?.creationScope ?? E).importNode(t, !0);
		V.currentNode = r;
		let i = V.nextNode(), a = 0, o = 0, s = n[0];
		for (; s !== void 0;) {
			if (a === s.index) {
				let t;
				s.type === 2 ? t = new G(i, i.nextSibling, this, e) : s.type === 1 ? t = new s.ctor(i, s.name, s.strings, this, e) : s.type === 6 && (t = new he(i, this, e)), this._$AV.push(t), s = n[++o];
			}
			a !== s?.index && (i = V.nextNode(), a++);
		}
		return V.currentNode = E, r;
	}
	p(e) {
		let t = 0;
		for (let n of this._$AV) n !== void 0 && (n.strings === void 0 ? n._$AI(e[t]) : (n._$AI(e, n, t), t += n.strings.length - 2)), t++;
	}
}, G = class e {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(e, t, n, r) {
		this.type = 2, this._$AH = z, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = n, this.options = r, this._$Cv = r?.isConnected ?? !0;
	}
	get parentNode() {
		let e = this._$AA.parentNode, t = this._$AM;
		return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(e, t = this) {
		e = W(this, e, t), O(e) ? e === z || e == null || e === "" ? (this._$AH !== z && this._$AR(), this._$AH = z) : e !== this._$AH && e !== R && this._(e) : e._$litType$ === void 0 ? e.nodeType === void 0 ? ce(e) ? this.k(e) : this._(e) : this.T(e) : this.$(e);
	}
	O(e) {
		return this._$AA.parentNode.insertBefore(e, this._$AB);
	}
	T(e) {
		this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
	}
	_(e) {
		this._$AH !== z && O(this._$AH) ? this._$AA.nextSibling.data = e : this.T(E.createTextNode(e)), this._$AH = e;
	}
	$(e) {
		let { values: t, _$litType$: n } = e, r = typeof n == "number" ? this._$AC(e) : (n.el === void 0 && (n.el = U.createElement(H(n.h, n.h[0]), this.options)), n);
		if (this._$AH?._$AD === r) this._$AH.p(t);
		else {
			let e = new de(r, this), n = e.u(this.options);
			e.p(t), this.T(n), this._$AH = e;
		}
	}
	_$AC(e) {
		let t = B.get(e.strings);
		return t === void 0 && B.set(e.strings, t = new U(e)), t;
	}
	k(t) {
		k(this._$AH) || (this._$AH = [], this._$AR());
		let n = this._$AH, r, i = 0;
		for (let a of t) i === n.length ? n.push(r = new e(this.O(D()), this.O(D()), this, this.options)) : r = n[i], r._$AI(a), i++;
		i < n.length && (this._$AR(r && r._$AB.nextSibling, i), n.length = i);
	}
	_$AR(e = this._$AA.nextSibling, t) {
		for (this._$AP?.(!1, !0, t); e !== this._$AB;) {
			let t = b(e).nextSibling;
			b(e).remove(), e = t;
		}
	}
	setConnected(e) {
		this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
	}
}, K = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(e, t, n, r, i) {
		this.type = 1, this._$AH = z, this._$AN = void 0, this.element = e, this.name = t, this._$AM = r, this.options = i, n.length > 2 || n[0] !== "" || n[1] !== "" ? (this._$AH = Array(n.length - 1).fill(/* @__PURE__ */ new String()), this.strings = n) : this._$AH = z;
	}
	_$AI(e, t = this, n, r) {
		let i = this.strings, a = !1;
		if (i === void 0) e = W(this, e, t, 0), a = !O(e) || e !== this._$AH && e !== R, a && (this._$AH = e);
		else {
			let r = e, o, s;
			for (e = i[0], o = 0; o < i.length - 1; o++) s = W(this, r[n + o], t, o), s === R && (s = this._$AH[o]), a ||= !O(s) || s !== this._$AH[o], s === z ? e = z : e !== z && (e += (s ?? "") + i[o + 1]), this._$AH[o] = s;
		}
		a && !r && this.j(e);
	}
	j(e) {
		e === z ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
	}
}, fe = class extends K {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(e) {
		this.element[this.name] = e === z ? void 0 : e;
	}
}, pe = class extends K {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(e) {
		this.element.toggleAttribute(this.name, !!e && e !== z);
	}
}, me = class extends K {
	constructor(e, t, n, r, i) {
		super(e, t, n, r, i), this.type = 5;
	}
	_$AI(e, t = this) {
		if ((e = W(this, e, t, 0) ?? z) === R) return;
		let n = this._$AH, r = e === z && n !== z || e.capture !== n.capture || e.once !== n.once || e.passive !== n.passive, i = e !== z && (n === z || r);
		r && this.element.removeEventListener(this.name, this, n), i && this.element.addEventListener(this.name, this, e), this._$AH = e;
	}
	handleEvent(e) {
		typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
	}
}, he = class {
	constructor(e, t, n) {
		this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = n;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(e) {
		W(this, e);
	}
}, ge = y.litHtmlPolyfillSupport;
ge?.(U, G), (y.litHtmlVersions ??= []).push("3.3.3");
var _e = (e, t, n) => {
	let r = n?.renderBefore ?? t, i = r._$litPart$;
	if (i === void 0) {
		let e = n?.renderBefore ?? null;
		r._$litPart$ = i = new G(t.insertBefore(D(), e), e, void 0, n ?? {});
	}
	return i._$AI(e), i;
}, q = globalThis, J = class extends v {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		let e = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= e.firstChild, e;
	}
	update(e) {
		let t = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = _e(t, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return R;
	}
};
J._$litElement$ = !0, J.finalized = !0, q.litElementHydrateSupport?.({ LitElement: J });
var ve = q.litElementPolyfillSupport;
ve?.({ LitElement: J }), (q.litElementVersions ??= []).push("4.2.2");
//#endregion
//#region src/components/network-status.ts
var ye = {
	ethernet: "Ethernet",
	wifi: "Wi-Fi",
	wifi_ap: "Wi-Fi AP"
};
function be(e) {
	return e === void 0 || Number.isNaN(e) ? "Unknown" : e >= -55 ? "Excellent" : e >= -67 ? "Good" : e >= -75 ? "Fair" : "Weak";
}
function xe(e) {
	return e === 1 ? "Full" : e === 0 ? "Half" : `Unknown (${e})`;
}
function Se(e) {
	let t = (e) => String(e).padStart(2, "0");
	return `${t(e.getHours())}:${t(e.getMinutes())}:${t(e.getSeconds())}`;
}
var Y = class extends J {
	constructor(...e) {
		super(...e), this.baseUrl = "", this.pollIntervalMs = 1e4, this.errorMessage = "", this.loading = !1, this.refreshSeq = 0, this.handleRetry = () => {
			this.refresh();
		};
	}
	static {
		this.properties = {
			baseUrl: {
				type: String,
				attribute: "base-url"
			},
			pollIntervalMs: {
				type: Number,
				attribute: "poll-interval-ms"
			},
			status: { state: !0 },
			errorMessage: { state: !0 },
			lastUpdated: { state: !0 },
			loading: { state: !0 }
		};
	}
	static {
		this.styles = c`
    :host {
      display: block;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #1f2430;
      --_accent: var(--edn-accent, #2563eb);
      --_danger: var(--edn-danger, #dc2626);
      --_muted: var(--edn-muted, #6b7280);
      --_border: #e2e5ea;
      --_surface: #ffffff;
    }

    .card {
      background: var(--_surface);
      border: 1px solid var(--_border);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      max-width: 28rem;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    }

    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .badge {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      background: #eef2ff;
      color: var(--_accent);
    }

    .badge-ethernet {
      background: #e0f2fe;
      color: #0369a1;
    }

    .badge-wifi_ap {
      background: #fef3c7;
      color: #b45309;
    }

    .badge-unknown {
      background: #f3f4f6;
      color: var(--_muted);
    }

    .state {
      font-size: 0.85rem;
      font-weight: 600;
    }

    .state-up {
      color: #15803d;
    }

    .state-down {
      color: var(--_muted);
    }

    .loading {
      font-size: 0.8rem;
      margin-left: auto;
    }

    .banner {
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: space-between;
    }

    .banner-warn {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
    }

    .banner-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: var(--_danger);
    }

    section {
      margin-top: 1rem;
    }

    h2 {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--_muted);
      margin: 0 0 0.5rem;
    }

    .rows {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.35rem 0.75rem;
      margin: 0;
    }

    dt {
      color: var(--_muted);
      font-size: 0.85rem;
    }

    dd {
      margin: 0;
      font-size: 0.9rem;
      word-break: break-word;
    }

    .muted {
      color: var(--_muted);
    }

    .foot {
      margin-top: 1rem;
      font-size: 0.75rem;
    }

    button {
      font: inherit;
      font-size: 0.8rem;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
      border: 1px solid currentColor;
      background: transparent;
      color: var(--_accent);
      cursor: pointer;
    }

    button:hover {
      background: rgba(37, 99, 235, 0.08);
    }
  `;
	}
	connectedCallback() {
		super.connectedCallback(), this.refresh(), this.startPolling();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.stopPolling();
	}
	updated(e) {
		e.has("pollIntervalMs") && this.startPolling();
		let t = e.get("baseUrl");
		e.has("baseUrl") && t !== void 0 && t !== this.baseUrl && (this.client = void 0, this.refresh());
	}
	render() {
		let e = this.status;
		return L`
      <div class="card">
        <header class="head">
          ${e ? L`<span class="badge badge-${e.mode}">${ye[e.mode]}</span>` : L`<span class="badge badge-unknown">Unknown</span>`}
          ${e ? L`<span class="state ${e.connected ? "state-up" : "state-down"}">
                ${e.connected ? "Connected" : "Disconnected"}
              </span>` : z}
          ${this.loading ? L`<span class="muted loading">Refreshing…</span>` : z}
        </header>

        ${e?.fallbackAP ? L`<div class="banner banner-warn" role="alert">
              Fallback AP active — the device could not reach the configured network.
            </div>` : z}
        ${this.errorMessage ? L`<div class="banner banner-error" role="alert">
              <span>${this.errorMessage}</span>
              <button type="button" @click=${this.handleRetry}>Retry</button>
            </div>` : z}
        ${e ? this.renderSections(e) : L`<p class="muted">Loading network status…</p>`}

        <footer class="muted foot">
          ${this.lastUpdated ? L`Updated ${Se(this.lastUpdated)}` : L`Waiting for data…`}
        </footer>
      </div>
    `;
	}
	renderSections(e) {
		switch (e.mode) {
			case "wifi": return this.renderWifi(e);
			case "wifi_ap": return this.renderAp(e);
			case "ethernet": return this.renderEthernet(e);
		}
	}
	renderWifi(e) {
		return L`
      <section>
        <h2>Wi-Fi</h2>
        <dl class="rows">
          ${this.row("SSID", e.ssid)}
          ${this.row("Signal", e.rssi === void 0 ? void 0 : `${e.rssi} dBm (${be(e.rssi)})`)}
          ${this.row("IP address", e.ip)} ${this.row("MAC address", e.mac)}
        </dl>
      </section>
    `;
	}
	renderAp(e) {
		let t = e.ap;
		return L`
      <section>
        <h2>Access point</h2>
        <dl class="rows">
          ${this.row("SSID", t?.ssid)} ${this.row("IP address", t?.ip)}
          ${this.row("Stations", t?.stations)}
        </dl>
      </section>
    `;
	}
	renderEthernet(e) {
		let t = e.eth;
		return L`
      <section>
        <h2>Ethernet</h2>
        <dl class="rows">
          ${this.row("IP address", t?.ip)} ${this.row("MAC address", t?.mac)}
          ${this.row("Link", t === void 0 ? void 0 : t.linkUp ? "Up" : "Down")}
          ${this.row("Speed", t === void 0 ? void 0 : `${t.speed} Mbps`)}
          ${this.row("Duplex", t === void 0 ? void 0 : xe(t.duplex))}
        </dl>
      </section>
    `;
	}
	row(e, t) {
		return t === void 0 || t === "" ? z : L`<dt>${e}</dt>
          <dd>${t}</dd>`;
	}
	ensureClient() {
		return (!this.client || this.clientBaseUrl !== this.baseUrl) && (this.client = t({ baseUrl: this.baseUrl }), this.clientBaseUrl = this.baseUrl), this.client;
	}
	async refresh() {
		let e = ++this.refreshSeq;
		this.loading = !0;
		let t = await this.ensureClient().getStatus();
		if (e === this.refreshSeq) {
			if (this.loading = !1, t.ok) {
				this.status = t.data, this.errorMessage = "", this.lastUpdated = /* @__PURE__ */ new Date();
				return;
			}
			this.errorMessage = t.message, this.dispatchEvent(new CustomEvent("edn-error", {
				detail: { message: t.message },
				bubbles: !0,
				composed: !0
			}));
		}
	}
	startPolling() {
		this.stopPolling();
		let e = Number(this.pollIntervalMs);
		!Number.isFinite(e) || e <= 0 || (this.timerId = setInterval(() => {
			typeof document < "u" && document.hidden || this.refresh();
		}, e));
	}
	stopPolling() {
		this.timerId !== void 0 && (clearInterval(this.timerId), this.timerId = void 0);
	}
};
typeof customElements < "u" && !customElements.get("edn-network-status") && customElements.define("edn-network-status", Y);
//#endregion
//#region src/components/network-settings.ts
var X = 32, Z = 64, Q = 8, Ce = 5e3, we = new TextEncoder();
function $(e) {
	return we.encode(e).length;
}
function Te(e) {
	return e.isAPMode ? "ap" : "station";
}
var Ee = class extends J {
	constructor(...e) {
		super(...e), this.baseUrl = "", this.settings = null, this.loading = !1, this.submitting = !1, this.errorMessage = "", this.successMessage = "", this.draftMode = "station", this.draftWifiSSID = "", this.draftWifiPassword = "", this.draftWifiPasswordDirty = !1, this.draftApSSID = "", this.draftApHasPassword = !1, this.draftApPassword = "", this.draftApPasswordDirty = !1, this.fieldErrors = {}, this.scanning = !1, this.scanResults = [], this.scanError = "", this.loadToken = 0, this.settingsBaseUrl = null, this.handleWifiSSIDInput = (e) => {
			this.draftWifiSSID = e.target.value;
		}, this.handleWifiPasswordInput = (e) => {
			this.draftWifiPassword = e.target.value, this.draftWifiPasswordDirty = !0;
		}, this.handleApSSIDInput = (e) => {
			this.draftApSSID = e.target.value;
		}, this.handleApPasswordInput = (e) => {
			this.draftApPassword = e.target.value, this.draftApPasswordDirty = !0;
		}, this.handleApHasPasswordChange = (e) => {
			this.draftApHasPassword = e.target.checked, this.draftApHasPassword || (this.draftApPassword = "", this.draftApPasswordDirty = !1, this.fieldErrors = {
				...this.fieldErrors,
				wifiAPPassword: void 0
			});
		}, this.handlePickSsid = (e) => {
			this.draftMode !== "station" && (this.draftMode = "station"), this.draftWifiSSID = e, this.fieldErrors = {
				...this.fieldErrors,
				wifiSSID: void 0
			};
		}, this.handleSubmit = (e) => {
			e.preventDefault(), this.handleSave();
		}, this.handleRetry = () => {
			this.load();
		};
	}
	static {
		this.properties = {
			baseUrl: {
				type: String,
				attribute: "base-url"
			},
			settings: { state: !0 },
			loading: { state: !0 },
			submitting: { state: !0 },
			errorMessage: { state: !0 },
			successMessage: { state: !0 },
			draftMode: { state: !0 },
			draftWifiSSID: { state: !0 },
			draftWifiPassword: { state: !0 },
			draftWifiPasswordDirty: { state: !0 },
			draftApSSID: { state: !0 },
			draftApHasPassword: { state: !0 },
			draftApPassword: { state: !0 },
			draftApPasswordDirty: { state: !0 },
			fieldErrors: { state: !0 },
			scanning: { state: !0 },
			scanResults: { state: !0 },
			scanError: { state: !0 }
		};
	}
	static {
		this.styles = c`
    :host {
      display: block;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #1f2430;
      --_accent: var(--edn-accent, #2563eb);
      --_danger: var(--edn-danger, #dc2626);
      --_muted: var(--edn-muted, #6b7280);
      --_border: #e2e5ea;
      --_surface: #ffffff;
    }

    .card {
      background: var(--_surface);
      border: 1px solid var(--_border);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      max-width: 30rem;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    }

    h1 {
      font-size: 1rem;
      margin: 0 0 0.75rem;
    }

    h2 {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--_muted);
      margin: 0 0 0.5rem;
    }

    .banner {
      margin: 0 0 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: space-between;
    }

    .banner-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: var(--_danger);
    }

    .banner-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
    }

    fieldset {
      border: 0;
      padding: 0;
      margin: 0 0 0.75rem;
    }

    legend {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--_muted);
      margin-bottom: 0.35rem;
    }

    .segmented {
      display: inline-flex;
      border: 1px solid var(--_border);
      border-radius: 8px;
      overflow: hidden;
    }

    .seg {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.35rem 0.85rem;
      border: 0;
      background: transparent;
      color: var(--_muted);
      cursor: pointer;
    }

    .seg.active {
      background: var(--_accent);
      color: #ffffff;
    }

    .group {
      border-top: 1px solid var(--_border);
      padding-top: 0.75rem;
      margin-bottom: 0.75rem;
    }

    label {
      display: block;
      font-size: 0.85rem;
      margin-bottom: 0.6rem;
    }

    input[type='text'],
    input[type='password'] {
      display: block;
      width: 100%;
      box-sizing: border-box;
      margin-top: 0.25rem;
      font: inherit;
      font-size: 0.9rem;
      padding: 0.4rem 0.55rem;
      border: 1px solid var(--_border);
      border-radius: 6px;
      background: #fff;
      color: inherit;
    }

    input[type='text']:focus,
    input[type='password']:focus {
      outline: 2px solid color-mix(in srgb, var(--_accent) 45%, transparent);
      outline-offset: 1px;
      border-color: var(--_accent);
    }

    .check {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.85rem;
    }

    .hint {
      font-size: 0.78rem;
      color: var(--_muted);
      margin: -0.3rem 0 0.5rem;
    }

    .field-error {
      font-size: 0.78rem;
      color: var(--_danger);
      margin: -0.3rem 0 0.6rem;
    }

    .clear-warning {
      font-size: 0.78rem;
      color: var(--_danger);
      margin: -0.3rem 0 0.6rem;
    }

    .actions {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      border-top: 1px solid var(--_border);
      padding-top: 0.75rem;
    }

    button {
      font: inherit;
      font-size: 0.8rem;
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      border: 1px solid currentColor;
      background: transparent;
      color: var(--_accent);
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: rgba(37, 99, 235, 0.08);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .primary {
      background: var(--_accent);
      border-color: var(--_accent);
      color: #ffffff;
    }

    .primary:hover:not(:disabled) {
      background: color-mix(in srgb, var(--_accent) 88%, #000);
    }

    .scan-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .scan-head h2 {
      margin: 0;
    }

    ul.networks {
      list-style: none;
      margin: 0.5rem 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .network {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
      text-align: left;
      border: 1px solid var(--_border);
      border-radius: 6px;
      padding: 0.35rem 0.55rem;
      color: inherit;
    }

    .network .ssid {
      font-size: 0.85rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .network .meta {
      font-size: 0.75rem;
      color: var(--_muted);
      white-space: nowrap;
    }

    .lock {
      color: var(--_muted);
    }

    .muted {
      color: var(--_muted);
    }

    .status {
      font-size: 0.85rem;
      color: var(--_muted);
    }
  `;
	}
	connectedCallback() {
		super.connectedCallback(), this.load();
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this.scanController?.abort(), this.scanController = void 0;
	}
	updated(e) {
		let t = e.get("baseUrl");
		e.has("baseUrl") && t !== void 0 && t !== this.baseUrl && (this.client = void 0, this.scanResults = [], this.scanError = "", this.load());
	}
	render() {
		let e = this.settings;
		return L`
      <div class="card">
        <h1>Network settings</h1>
        ${this.errorMessage ? L`<div class="banner banner-error" role="alert">
              <span>${this.errorMessage}</span>
              <button type="button" @click=${this.handleRetry}>Retry</button>
            </div>` : z}
        ${this.successMessage ? L`<div class="banner banner-success" role="status">${this.successMessage}</div>` : z}
        ${e ? L`${this.renderForm(e)} ${this.renderScan()}` : this.loading ? L`<p class="status">Loading settings…</p>` : L`<p class="status">Settings unavailable.</p>`}
      </div>
    `;
	}
	renderForm(e) {
		return L`
      <form @submit=${this.handleSubmit}>
        <fieldset>
          <legend>Mode</legend>
          <div class="segmented" role="group" aria-label="Network mode">
            <button
              type="button"
              class="seg ${this.draftMode === "station" ? "active" : ""}"
              aria-pressed=${this.draftMode === "station"}
              @click=${() => this.setMode("station")}
            >
              Station
            </button>
            <button
              type="button"
              class="seg ${this.draftMode === "ap" ? "active" : ""}"
              aria-pressed=${this.draftMode === "ap"}
              @click=${() => this.setMode("ap")}
            >
              Access Point
            </button>
          </div>
        </fieldset>

        ${this.draftMode === "station" ? this.renderStation(e) : this.renderAccessPoint(e)}

        <div class="actions">
          <button class="primary" type="submit" ?disabled=${this.submitting || !this.dirty}>
            ${this.submitting ? "Saving…" : "Save"}
          </button>
          ${this.dirty ? L`<span class="muted">Unsaved changes</span>` : z}
        </div>
      </form>
    `;
	}
	renderStation(e) {
		return L`
      <section class="group">
        <h2>Station</h2>
        <label>
          Wi-Fi name
          <input
            name="wifiSSID"
            type="text"
            autocomplete="off"
            .value=${this.draftWifiSSID}
            @input=${this.handleWifiSSIDInput}
          />
        </label>
        ${this.renderFieldError("wifiSSID")}
        <label>
          Wi-Fi password
          <input
            name="wifiPassword"
            type="password"
            autocomplete="new-password"
            placeholder=${e.hasWifiPassword ? "Leave blank to keep saved password" : "No password set"}
            .value=${this.draftWifiPassword}
            @input=${this.handleWifiPasswordInput}
          />
        </label>
        ${e.hasWifiPassword ? L`<p class="hint">Password saved •••• (leave blank to keep)</p>` : z}
        ${this.renderPasswordClearWarning("wifiPassword")}
        ${this.renderFieldError("wifiPassword")}
      </section>
    `;
	}
	renderAccessPoint(e) {
		return L`
      <section class="group">
        <h2>Access point</h2>
        <label>
          Access point name
          <input
            name="wifiAPSSID"
            type="text"
            autocomplete="off"
            .value=${this.draftApSSID}
            @input=${this.handleApSSIDInput}
          />
        </label>
        ${this.renderFieldError("wifiAPSSID")}
        <label class="check">
          <input
            type="checkbox"
            .checked=${this.draftApHasPassword}
            @change=${this.handleApHasPasswordChange}
          />
          Require password
        </label>
        ${this.draftApHasPassword ? L`
              <label>
                Access point password
                <input
                  name="wifiAPPassword"
                  type="password"
                  autocomplete="new-password"
                  placeholder=${e.hasWifiAPPassword ? "Leave blank to keep saved password" : "At least 8 characters"}
                  .value=${this.draftApPassword}
                  @input=${this.handleApPasswordInput}
                />
              </label>
              ${e.hasWifiAPPassword ? L`<p class="hint">Password saved •••• (leave blank to keep)</p>` : z}
              ${this.renderPasswordClearWarning("wifiAPPassword")}
              ${this.renderFieldError("wifiAPPassword")}
            ` : z}
      </section>
    `;
	}
	renderScan() {
		return L`
      <section class="group">
        <div class="scan-head">
          <h2>Wi-Fi scan</h2>
          <button type="button" @click=${this.handleScan} ?disabled=${this.scanning}>
            ${this.scanning ? "Scanning…" : "Scan"}
          </button>
        </div>
        ${this.scanError ? L`<div class="banner banner-error" role="alert">${this.scanError}</div>` : z}
        ${this.scanResults.length > 0 ? L`<ul class="networks">
              ${this.scanResults.map((e) => this.renderNetwork(e))}
            </ul>` : z}
      </section>
    `;
	}
	renderNetwork(e) {
		return L`
      <li>
        <button type="button" class="network" @click=${() => this.handlePickSsid(e.ssid)}>
          <span class="ssid">${e.ssid}</span>
          <span class="meta">
            ${e.encrypted ? L`<span class="lock" title="Encrypted" aria-label="Encrypted">🔒</span>` : z}
            ${e.rssi} dBm · Ch ${e.channel}
          </span>
        </button>
      </li>
    `;
	}
	renderFieldError(e) {
		let t = this.fieldErrors[e];
		return t ? L`<p class="field-error" role="alert">${t}</p>` : z;
	}
	renderPasswordClearWarning(e) {
		return (e === "wifiPassword" ? this.draftWifiPasswordDirty && this.draftWifiPassword === "" && this.settings?.hasWifiPassword === !0 : this.draftApPasswordDirty && this.draftApPassword === "" && this.draftApHasPassword && this.settings?.hasWifiAPPassword === !0) ? L`<p class="clear-warning" role="alert">
          Warning: saving now will remove the stored password.
        </p>` : z;
	}
	get dirty() {
		let e = this.settings;
		return e ? this.draftMode !== Te(e) || this.draftWifiSSID !== e.wifiSSID || this.draftApSSID !== e.wifiAPSSID || this.draftApHasPassword !== e.wifiAPHasPassword || this.draftWifiPasswordDirty || this.draftApPasswordDirty : !1;
	}
	ensureClient() {
		return (!this.client || this.clientBaseUrl !== this.baseUrl) && (this.client = t({ baseUrl: this.baseUrl }), this.clientBaseUrl = this.baseUrl), this.client;
	}
	async load() {
		let e = ++this.loadToken;
		this.loading = !0;
		let t = await this.ensureClient().getSettings();
		if (e !== this.loadToken) {
			this.settingsBaseUrl !== this.baseUrl && (this.settings = null);
			return;
		}
		if (this.loading = !1, t.ok) {
			this.applyServerSettings(t.data), this.errorMessage = "";
			return;
		}
		this.settingsBaseUrl !== this.baseUrl && (this.settings = null), this.errorMessage = t.message, this.emitError(t.message);
	}
	applyServerSettings(e) {
		this.settings = e, this.settingsBaseUrl = this.baseUrl, this.draftMode = Te(e), this.draftWifiSSID = e.wifiSSID, this.draftApSSID = e.wifiAPSSID, this.draftApHasPassword = e.wifiAPHasPassword, this.draftWifiPassword = "", this.draftWifiPasswordDirty = !1, this.draftApPassword = "", this.draftApPasswordDirty = !1, this.fieldErrors = {};
	}
	validate() {
		let e = this.settings, t = {};
		if (!e) return t;
		let n = this.draftMode === "ap";
		if ($(this.draftWifiSSID) > X && (t.wifiSSID = `Wi-Fi name must be ${X} characters or fewer.`), $(this.draftApSSID) > X && (t.wifiAPSSID = `Access point name must be ${X} characters or fewer.`), n ? this.draftApSSID.length === 0 && (t.wifiAPSSID = "Access point name is required in AP mode.") : this.draftWifiSSID.length === 0 && (t.wifiSSID = "Wi-Fi name is required in station mode."), this.draftWifiPasswordDirty && $(this.draftWifiPassword) > Z && (t.wifiPassword = `Wi-Fi password must be ${Z} characters or fewer.`), this.draftApHasPassword) {
			if (this.draftApPasswordDirty) {
				let e = $(this.draftApPassword);
				(e < Q || e > Z) && (t.wifiAPPassword = `Access point password must be ${Q}–${Z} characters.`);
			} else e.hasWifiAPPassword || (t.wifiAPPassword = `Enter an access point password (${Q}–${Z} characters).`);
		}
		return t;
	}
	buildPatch() {
		let e = this.settings, t = {};
		if (!e) return t;
		let n = this.draftMode === "ap";
		return n !== e.isAPMode && (t.isAPMode = n), this.draftWifiSSID !== e.wifiSSID && (t.wifiSSID = this.draftWifiSSID), this.draftWifiPasswordDirty && (t.wifiPassword = this.draftWifiPassword), this.draftApSSID !== e.wifiAPSSID && (t.wifiAPSSID = this.draftApSSID), this.draftApHasPassword !== e.wifiAPHasPassword && (t.wifiAPHasPassword = this.draftApHasPassword), this.draftApHasPassword && this.draftApPasswordDirty && (t.wifiAPPassword = this.draftApPassword), t;
	}
	async handleSave() {
		if (this.submitting || !this.settings) return;
		let e = this.validate();
		if (this.fieldErrors = e, Object.keys(e).length > 0) return;
		let t = this.buildPatch();
		if (Object.keys(t).length === 0) return;
		this.submitting = !0, this.errorMessage = "", this.successMessage = "";
		let n = await this.ensureClient().saveSettings(t);
		if (this.submitting = !1, n.ok) {
			this.applyServerSettings(n.data), this.successMessage = "Settings saved.", this.dispatchEvent(new CustomEvent("edn-saved", {
				detail: n.data,
				bubbles: !0,
				composed: !0
			}));
			return;
		}
		let r = n.status === void 0 ? "Could not confirm the save — the device may have applied the changes and reconnected. Check the status widget or retry." : n.message;
		this.errorMessage = r, this.emitError(r);
	}
	async handleScan() {
		if (this.scanning) return;
		this.scanning = !0, this.scanError = "";
		let e = new AbortController();
		this.scanController = e;
		let t, n = new Promise((n) => {
			t = setTimeout(() => {
				e.abort(), n({
					ok: !1,
					message: "Wi-Fi scan timed out after 5 seconds."
				});
			}, Ce);
		}), r = await Promise.race([this.ensureClient().wifiList(e.signal), n]);
		if (t !== void 0 && clearTimeout(t), this.scanController === e && (this.scanController = void 0), this.scanning = !1, r.ok) {
			this.scanResults = [...r.data.networks].sort((e, t) => t.rssi - e.rssi);
			return;
		}
		r.message !== "Request aborted." && (this.scanError = r.message, this.emitError(r.message));
	}
	emitError(e) {
		this.dispatchEvent(new CustomEvent("edn-error", {
			detail: { message: e },
			bubbles: !0,
			composed: !0
		}));
	}
	setMode(e) {
		this.draftMode !== e && (this.draftMode = e, this.fieldErrors = {});
	}
};
typeof customElements < "u" && !customElements.get("edn-network-settings") && customElements.define("edn-network-settings", Ee);
//#endregion
//#region src/components/network-page.ts
var De = [{
	id: "status",
	label: "Status"
}, {
	id: "settings",
	label: "Network settings"
}], Oe = class extends J {
	constructor(...e) {
		super(...e), this.baseUrl = "", this.pollIntervalMs = 1e4, this.activeTab = "status";
	}
	static {
		this.properties = {
			baseUrl: {
				type: String,
				attribute: "base-url"
			},
			pollIntervalMs: {
				type: Number,
				attribute: "poll-interval-ms"
			},
			activeTab: { state: !0 }
		};
	}
	static {
		this.styles = c`
    :host {
      display: block;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      color: #1f2430;
      --_accent: var(--edn-accent, #2563eb);
      --_border: #e2e5ea;
    }

    .tabs {
      display: flex;
      gap: 0.25rem;
      border-bottom: 1px solid var(--_border);
      max-width: 30rem;
    }

    [role='tab'] {
      font: inherit;
      font-size: 0.85rem;
      padding: 0.45rem 0.8rem;
      border: 0;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: var(--edn-muted, #6b7280);
      cursor: pointer;
      margin-bottom: -1px;
    }

    [role='tab'][aria-selected='true'] {
      color: var(--_accent);
      border-bottom-color: var(--_accent);
      font-weight: 600;
    }

    .panel {
      margin-top: 1rem;
    }
  `;
	}
	render() {
		return L`
      <div class="tabs" role="tablist" aria-label="Network">
        ${De.map((e) => L`
            <button
              type="button"
              role="tab"
              id="tab-${e.id}"
              aria-controls="panel-${e.id}"
              aria-selected=${this.activeTab === e.id}
              @click=${() => this.selectTab(e.id)}
            >
              ${e.label}
            </button>
          `)}
      </div>
      <div class="panel" id="panel-${this.activeTab}" role="tabpanel">
        ${this.renderActive()}
      </div>
    `;
	}
	renderActive() {
		return this.activeTab === "settings" ? L`<edn-network-settings base-url=${this.baseUrl}></edn-network-settings>` : L`
      <edn-network-status
        base-url=${this.baseUrl}
        poll-interval-ms=${this.pollIntervalMs}
      ></edn-network-status>
    `;
	}
	selectTab(e) {
		this.activeTab !== e && (this.activeTab = e, this.dispatchEvent(new CustomEvent("edn-tab-change", {
			detail: { tab: e },
			bubbles: !0,
			composed: !0
		})));
	}
};
typeof customElements < "u" && !customElements.get("edn-network-page") && customElements.define("edn-network-page", Oe);
//#endregion
export { Oe as EdnNetworkPage, Ee as EdnNetworkSettings, Y as EdnNetworkStatus, t as createNetworkApiClient };
