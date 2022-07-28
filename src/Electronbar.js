import React from 'react';
import ReactDomClient from 'react-dom/client';

import Menu from './Menu';
import TitleBar from './Titlebar';

/** 
 * Default class to manage electron state and mount the React component.
 */
export default class Electronbar {

	contextMenu;
	contextMenuEvent;

	constructor({ electronRemote, browserWindow, menu, icon, mountNode, title }) {

		this.electronRemote = (electronRemote && electronRemote.remote) ? electronRemote.remote : electronRemote;
		this.browserWindow = browserWindow;
		this.icon = icon;

		// set a title
		if (title != null) {
			this.title = title;

		// get the title from the window
		} else if (browserWindow && browserWindow.webContents) {

			this.dynamicTitle = true;
			this.title = browserWindow.webContents.getTitle();
			
			browserWindow.on('page-title-updated', this.onTitleChange);
		}

		this.setMenu(menu);
		this.mount(mountNode);
	}

	destroy() {

		this.unmount();

		if (this.dynamicTitle) {
			this.browserWindow.removeEventListener('page-title-updated', this.onTitleChange);
		}

		this.electronRemote = null;
		this.window	= null;
	}

	onTitleChange = (e, title) => {
		this.setTitle(title);
	};

	onContextMenuClose = () => {

		this.contextMenu = null;
		this.contextMenuEvent = null;

		this.render();
	};

	render(titleBarNeedsUpdate = false) {
		if (this.mountNode && this.browserWindow) {

			let contextMenu = (this.contextMenu && this.contextMenuEvent) && (
				<Menu
					context
					menu={this.contextMenu}
					x={this.contextMenuEvent.clientX}
					y={this.contextMenuEvent.clientY}
					onClose={this.onContextMenuClose}
				/>
			);

			this.mountNode.render(
				<React.Fragment>
					<TitleBar
						needsUpdate={titleBarNeedsUpdate}
						menu={this.menu}
						title={this.title}
						icon={this.icon}
						browserWindow={this.browserWindow}
					/>
					{ contextMenu }
				</React.Fragment>
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

		// the electron menu is fucked up and really slow, make a faster version (also required for the electron built menu)
		this.menu = parseMenu(menu);

		this.render(true);
	}

	setIcon(icon) {
		this.icon = icon;
		this.render(true);
	}

	setContextMenu(event, menu) {

		this.contextMenuEvent = event;
		this.contextMenu = menu;

		this.render();
	}

	setTitle(title) {

		if (this.dynamicTitle) {
			this.dynamicTitle = false;
			this.browserWindow.removeEventListener('page-title-updated', this.onTitleChange);
		}

		this.title = title;
		this.render(true);
	}

	mount(mountNode) {
		if (mountNode) {
			this.unmount();
			this.mountNode = ReactDomClient.createRoot(mountNode);
		}
	}

	unmount() {
		if (this.mountNode) {
			this.mountNode.unmount()
			this.mountNode = null;
		}
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

		template.enabled = template.enabled != null ? !!template.enabled : true;
		template.visible = template.visible != null ? !!template.visible : true;
		template.type = template.type || (template.submenu ? 'submenu' : 'normal');

		return template;
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
			checked: item.checked,
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