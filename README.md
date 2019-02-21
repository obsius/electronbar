# Electronbar

Electronbar is a react component and handler for frameless Electron windows that need a browser rendered titlebar and menu. It is completely customizable and renders faster than some of the alternatives.

**MIT License**


## Notes
This package has been made for Windows, although anyone wishing to modify this to match a Linux or Mac look and feel is encourged to do so and contribute. The source is small, so it should be simple to make any necessary modifications.


## Features

##### Window
Maximize, minimize, restore, and close buttons are provided.

##### Electron Menu support
Uses the native Electron.Menu object to build from. Prevent clicking/expanding and use a different style for disabled or invisible Electron menu items.

##### Updating
Menus, title, and icon can be updated at any time.

##### Accelerators
Passes the menu to Electron to bind accelerator shortcuts.

##### Accelerator Translations
Convert things like `CtrlOrCmd` to the appropriate button for the system. Cmd icon `&#8984;` on Mac or `Ctrl` on Windows, etc.

##### Fullscreen
Detects fullsceen and preserves the titlebar with a different button layout to leave fullscreen.

##### Handler
Has a reference to Electron so it can manage different OS's, listeners to window changes (focus, etc). *Feel free to contribute and build more support for Electron window states.*


## Layout
The titlebar has four main components listed below with the corresponding CSS class names for each.
Icon | Menu | Title | Buttons
---|---
electronbar-icon | electronbar-menu | electronbar-title | electronbar-buttons


## Integrating
Electronbar exposes a class to make a new Electonbar, the constructor for this takes a DOM element as a mounting point. See below for an explanation.

### Reference
```js
import Electronbar from 'Electronbar';
const Electronbar = require('Electronbar');

const electronbar = new Electronbar({
	electron: <pass the electron reference here>,
	menu: <pass a reference to your menu, not the template, but the Menu.buildFromTemplate() object>,
	mountNode: <DOM element container that will hold Electronbar, use document.getElementById() or make a ref in React for this>,
	title: <text for title>,
	icon: <app icon>
});
```

### Working Sample
```js
import React from 'react';
import Electronbar from 'Electronbar';

import 'electronbar/lib/electronbar.css';
import './my-electronbar-style-override.css';

const electron = window.require('electron');

const menuTemplate = [
	{
		label: 'Hello',
		submenu: [
			{
				label: 'World',
				click: () => console.log('Hello World'),
				accelerator: 'Ctrl+H'
			}
		]
	},
	{
		role: 'quit'
	}
];

class App extends React.Component {
	constructor(props) {
		super(props);
		
		this.electronbarMount = React.createRef();
		
		this.electronbar = new Electronbar({
			electron: electron,
			menu: Menu.buildFromTemplate(menuTemplate),
			mountNode: this.electronMount,
			title: 'Hello World',
			icon: 'public/imags/favicon.ico'
		});
	}
	
	render() {
		return (
			<div>
				<div ref={this.electronMount} />
				<div>Hellow World</div>
			</div>
		);
	}
}
```

## Methods

##### setMenu(menu)
Call this with an Electron menu object. Make sure to use the object and not the template (`electron.remote.Menu.buidlFromTempalte()` for example).

##### setTitle(title)
Call this with a title string to set the titlebar's title.

##### setIcon(path)
Call this with a path to an icon to set the titlebar's icon.


## Customizing
This package offers almost no custmomization via JS in the library integration. Rather it's encouraged that you modify the CSS directly so that you have a completely uniform look and feel in your app. This library is really small and very straightforward. Just open the eletronbar.css and override the CSS classes in your own CSS.


## Performance
The Electon menu is a bit slow to read from, lots of seemingly unecessary properties, and accessing getters is slow for some reason.  So much so that there is actually noticable lag when using the Electron Menu.buidlFromTempalte() menu as the menu source.  If you have tried alternatices, this package may be faster.  It builds a liteweight version of the Electron Menu that it uses as it's underlying source.

## Dependencies
Electronbar is pretty liteweight. It has three dependencies:
- react
- reacton-dom
- classnames

## Contributing
Feel free to make changes and submit pull requests whenever.