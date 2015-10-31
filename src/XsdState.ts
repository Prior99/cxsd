// This file is part of fast-xml, copyright (c) 2015 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import * as types from './XsdTypes';
import {Cache} from './Cache';

export class State {
	constructor(parent: State, rule: Rule) {
		if(parent) {
			this.stateStatic = parent.stateStatic;
			this.parent = parent;
			this.scope = new Scope(parent.scope);
		} else {
			this.scope = new Scope(null);
		}

		this.rule = rule;
	}

	parent: State;
	rule: Rule;
	scope: Scope;

	attributeTbl: {[name: string]: string};
	xsdElement: types.XsdBase;
	depth: number;
	index: number;

	stateStatic: {
		remoteUrl: string;
		cache: Cache;
		qName: QName;

		root: types.XsdSchema;

		namespaceTarget: Namespace;
		namespaceDefault: Namespace;
		namespaceMap: {[name: string]: Namespace};
	};
}

export class Namespace {
	constructor(id: number, name: string, url: string, short: string) {
		this.id = id;
		this.name = name;
		this.url = url;
		this.short = short;
	}

	static register(name: string, url?: string, short?: string) {
		var namespace = Namespace.tbl[name];

		if(namespace) {
			if(url && !namespace.url) namespace.url = url;
			return(namespace);
		}

		var id = Namespace.list.length;

		namespace = new Namespace(id, name, url, short);

		Namespace.list[id] = namespace;
		Namespace.tbl[name] = namespace;

		if(short) Namespace.tbl[short] = namespace;

		return(namespace);
	}

	static list: Namespace[] = [];
	static tbl: {[name: string]: Namespace} = {};

	id: number;
	name: string;
	url: string;
	short: string;
}

export class Rule {
	constructor(qName: QName, proto: any) {
		this.qName = qName;
		this.proto = proto;
	}

	qName: QName;
	proto: any;

	attributeList: string[] = [];
	followerTbl: {[id: string]: Rule} = {};
}

export class Scope {
	constructor(parent: Scope) {
		this.parent = parent;
	}

	add(name: QName, type: string, target: any) {
		var tbl = this.data[type];

		if(!tbl) {
			tbl = {} as {[name: string]: any};
			this.data[type] = tbl;
		}

		tbl[name.nameFull] = target;
	}

	lookup(name: QName, type: string): any {
		var scope: Scope = this;

		while(scope) {
			if(scope.data[type]) {
				var result = scope.data[type][name.nameFull];

				if(result) return(result);
			}

			scope = scope.parent;
		}

		return(null);
	}

	parent: Scope;

	data: {[type: string]: {[name: string]: any}} = {};

	attributeGroupTbl: {[name: string]: types.XsdAttributeGroup};
	groupTbl: {[name: string]: types.XsdGroup};
}

export class QName {
	constructor(name?: string, state?: State) {
		if(name) this.parse(name, state);
	}

	parse(name: string, state: State, namespace?: Namespace) {
		var stateStatic = state.stateStatic;
		var splitter = name.indexOf(':');

		name = name.toLowerCase();

		if(splitter >= 0) {
			namespace = stateStatic.namespaceMap[name.substr(0, splitter)];
			name = name.substr(splitter + 1);
		} else if(!namespace) {
			namespace = state.stateStatic.namespaceTarget;
		}

		this.namespace = namespace;
		this.name = name;
		this.nameFull = namespace ? (namespace.id + ':' + name) : name;

		return(this);
	}

	parseClass(name: string) {
		var partList = name.match(/([A-Za-z][a-z]*)([A-Za-z]+)/);

		this.namespace = Namespace.tbl[partList[1].toLowerCase()];
		this.name = partList[2].toLowerCase();
		this.nameFull = this.namespace.id + ':' + this.name;

		return(this);
	}

	namespace: Namespace;
	name: string;
	nameFull: string;
}