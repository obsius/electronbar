# Electronbar

Electronbar is a react component and handler for frameless Electron windows that need a browser rendered titlebar and menu. It is completely customizable and renders faster than some of the alternatives.


## Notes
This package has been made for Windows, although anyone wishing to modify this to match a Linux or Mac look and feel is encouraged to do so and contribute. The source is small, so it should be simple to make any modifications or enhancements.


## Screenshots
![screenshot1](https://raw.githubusercontent.com/obsius/electronbar/master/doc/1.png "Disabled Example")
![screenshot2](https://raw.githubusercontent.com/obsius/electronbar/master/doc/2.png "Enabled Example")
![screenshot3](https://raw.githubusercontent.com/obsius/electronbar/master/doc/3.gif "Moving Example")


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
Convert things like `CtrlOrCmd` to the appropriate button for the system. Cmd icon **&#8984;** on Mac or **Ctrl** on Windows, etc.

##### Fullscreen
Detects fullsceen and preserves the titlebar with a different button layout to leave fullscreen.

##### Handler
Has a reference to Electron so it can manage different OS's, listeners to window changes (focus, etc). *Feel free to contribute and build more support for Electron window states.*


## Layout
The titlebar has four main components listed below with the corresponding CSS class names for each.

Icon | Menu | Title | Buttons
-|-|-|-
electronbar-favicon | electronbar-menu | electronbar-title | electronbar-buttons


## Integrating
Electronbar exposes a class to make a new Electronbar, the constructor for this takes a DOM element as a mounting point. See below for an explanation.

### Reference
```js
import Electronbar from 'electronbar';
const Electronbar = require('electronbar');

const electronbar = new Electronbar({
	electron: '<pass the electron reference here>',
	window: '<pass the reference to the electron window here>',
	menu: '<pass a reference to your menu, not the template, but the Menu.buildFromTemplate() object>',
	mountNode: '<DOM element container that will hold Electronbar, use document.getElementById() or make a ref in React for this>',
	title: '<text for title>',
	icon: '<app icon>'
});

electronbar.setMenu(menu); // update the menu
electronbar.setIcon(path); // update the icon
electronbar.setTitle(title); // update the title
```

### Working Example
```js
import React from 'react';
import Electronbar from 'electronbar';

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
				accelerator: 'CmdOrCtrl+H'
			}
		]
	},
	{ type: 'separator' },
	{
		role: 'quit',
		accelerator: 'Alt+F4'
	}
];

class App extends React.Component {
	constructor(props) {
		super(props);
		this.electronbarMount = React.createRef();
	}

	componentDidMount() {
		this.electronbar = new Electronbar({
			electron: electron,
			window: electron.remote.getCurrentWindow(),
			menu: electron.remote.Menu.buildFromTemplate(menuTemplate),
			mountNode: this.electronbarMount,
			title: 'Hello World',
			icon: 'public/imgs/favicon.ico'
		});
	}

	render() {
		return (
			<div>
				<div ref={this.electronbarMount} />
				<div>Hello World</div>
			</div>
		);
	}
}
```


## Methods

##### setMenu(menu)
Call this with an Electron menu object. Make sure to use the object and not the template (`electron.remote.Menu.buildFromTemplate()` for example).

##### setTitle(title)
Call this with a title string to set the titlebar's title.

##### setIcon(path)
Call this with a path to an icon to set the titlebar's icon.


## Customizing
This package offers almost no customization via JS in the library integration. Rather it's encouraged that you modify the CSS directly so that you have a completely uniform look and feel in your app. This library is really small and very straightforward. Just open the eletronbar.css to see what classes are available and override them in your own custom CSS.


## Performance
The Electron menu is a bit slow to read from, lots of properties, and accessing getters is very slow, so much so, that there is actually noticeable lag when using the Electron Menu.buidlFromTempalte() as the menu source.  If you have tried alternatives, this package may be faster.  It builds a lightweight version of the Electron Menu that it uses as it's underlying source.


## Dependencies
Electronbar is lightweight. It has two dependencies:
- react
- reacton-dom


## TODO
Although the basic use case of a single window for Windows is implemented, the folling improvements should be made:
- support for mac and linux
- support for additional roles (add Electron.Menu roles in the role map)
- support for additional OS accelerator translations (add supported Electron.Menu accelerators to the accelerator map)
- move icons out of code and into CSS so customization is easier
- add more Electron event handlers to fully support all Eletron window events
- aria support for menu items
- alt support for menu tooltips


## Contributing
Feel free to make changes and submit pull requests whenever.


## License
Electronbar uses the [MIT](https://opensource.org/licenses/MIT) license.