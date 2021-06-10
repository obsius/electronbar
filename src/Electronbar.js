import React from 'react';
import reactDom from 'react-dom';

import TitleBar from './Titlebar';

/** 
 * Default class to manage electron state and mount the React component.
 */
export default class Electronbar {

	constructor({ electronRemote, window, menu, icon, mountNode, title }) {
		
		this.electronRemote = (electronRemote && electronRemote.remote) ? electronRemote.remote : electronRemote;
		this.window = window;
		this.icon = icon;
		this.mountNode = mountNode;

		// set a title
		if (title != null) {
			this.title = title;

		// get the title from the window
		} else if (window && window.webContents) {

			this.dynamicTitle = true;
			this.title = window.webContents.getTitle();
			
			window.on('page-title-updated', this.onTitleChange);
		}

		this.setMenu(menu);
	}

	destroy() {

		this.unmount();

		if (this.dynamicTitle) {
			window.removeEventListener('page-title-updated', this.onTitleChange);
		}

		this.electronRemote = null;
		this.window	= null;
		this.mountNode = null;
	}

	onTitleChange = (e, title) => {
		this.setTitle(title);
	};

	render() {
		if (this.window) {
			reactDom.render(
				<TitleBar
					menu={this.menu}
					title={this.title}
					icon={this.icon}
					window={this.window}
				/>,
				this.mountNode
			);
		}
	}

	setMenu(menu) {

		// check if an electron or electronbar built menu was passed (check append property)
		let prebuiltMenu = !!menu.append;

		// set electron menu if an electron built menu was provided
		if (prebuiltMenu) {
			this.electronRemote.Menu.setApplicationMenu(menu);

		// hijack the menu to create hidden menu item acceleartors
		} else {
			let acceleratorMenu = this.electronRemote.Menu.buildFromTemplate(buildAcceleratorMenuTemplate(menu));
			this.electronRemote.Menu.setApplicationMenu(acceleratorMenu);
		}

		// the electron menu is fucked up and really slow, make a faster version
		this.menu = parseMenu(menu);

		this.render();
	}

	setIcon(icon) {
		this.icon = icon;
		this.render();
	}

	setTitle(title) {

		if (this.dynamicTitle) {
			this.dynamicTitle = false;
			window.removeEventListener('page-title-updated', this.onTitleChange);
		}

		this.title = title;
		this.render();
	}

	unmount() {
		reactDom.unmountComponentAtNode(this.mountNode);
	}
}

/**
 * The electron menu uses IPC for getters and setters and is really slow.
 * Use this function instead if electronbar will handle your menu entirely.
 * 
 * @param {*} template - the electron menu template
 */
Electronbar.buildMenuFromTemplate = (template) => {

	if (!template) { return {}; }

	// root
	if (Array.isArray(template)) {
		return {
			items: template.map((template) => Electronbar.buildMenuFromTemplate(template))
		};

	// branch
	} else {

		if (template.submenu) {
			template.submenu = {
				items: template.submenu.map((template) => Electronbar.buildMenuFromTemplate(template))
			};
		}

		return {
			enabled: true,
			visible: true,
			type: template.submenu ? 'submenu' : 'normal',
			...template
		};
	}
};

/* internal */

/**
 * The electron menu is huge and slow, make a smaller and faster version.
 * @param {*} menu - the electron menu (not the template, the built menu)
 */
function parseMenu(menu) {

	let liteMenu = [];
	
	for (let item of menu.items) {
		liteMenu.push({
			accelerator: item.accelerator,
			click: item.click ? item.click : ()=>{},
			enabled: item.enabled,
			label: item.label,
			role: item.role,
			type: item.type,
			visible: item.visible,
			submenu: item.submenu ? parseMenu(item.submenu) : undefined
		});
	}

	return liteMenu;
}

/**
 * When using an electronbar menu, accelerators need to be made on a virtual menu.
 * @param {*} menu - the electronbar menu
 */
function buildAcceleratorMenuTemplate(menu) {

	let items = [];

	for (let item of menu.items) {

		if (item.visible && item.enabled) {

			if (item.accelerator && item.click) {
				items.push({
					label: '',
					accelerator: item.accelerator,
					click: item.click,
					visible: false
				});
			}

			if (item.submenu) {
				items = items.concat(buildAcceleratorMenuTemplate(item.submenu));
			}
		}
	}

	return items;
}