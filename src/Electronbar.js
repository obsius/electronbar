import React from 'react';
import reactDom from 'react-dom';

import TitleBar from './Titlebar';

/** 
 * Default class to manage electron state and mount the React component.
 */
export default class Electronbar {

	constructor({ electron, window, menu, title, icon, mountNode }) {
		this.electron = electron;
		this.window = window;
		this.title = title;
		this.icon = icon;
		this.mountNode = mountNode;

		this.setMenu(menu);
	}

	render() {
		reactDom.render(<TitleBar
			menu={this.menu}
			title={this.title}
			icon={this.icon}
			window={this.window}
		/>, this.mountNode);
	}

	setMenu(menu) {

		// register all accelerators
		this.electron.remote.Menu.setApplicationMenu(menu);

		// the electron menu is fucked up and really slow, make a faster version
		this.menu = parseMenu(menu);

		this.render();
	}

	setTitle(title) {
		this.title = title;
		this.render();
	}

	setIcon(icon) {
		this.icon = icon;
		this.render();
	}
}

/* internal */

/**
 * The electron menu is huge and slow, make a smaller and faster version.
 * @param {*} menu the electron menu (not the template, the built menu) 
 */
function parseMenu(menu) {

	let liteMenu = [];
	let items = menu.items ? menu.items : menu.submenu ? menu.submenu.items : [];
	
	for (let item of items) {
		let liteItem = {
			accelerator: item.accelerator,
			click: item.click ? item.click : ()=>{},
			enabled: item.enabled,
			label: item.label,
			role: item.role,
			type: item.type,
			visible: item.visible,
			submenu: parseMenu(item)
		};

		liteMenu.push(liteItem);
	}

	return liteMenu;
}