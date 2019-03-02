import React from 'react';
import reactDom from 'react-dom';
import cn from 'classnames';

/**
 * How much time in ms to wait before showing or hiding a submenu.
 */
const HOVER_TIMEOUT = 200;

/**
 * Map electron menu accelerators to platform specific keys.
 */
const acceleratorMap = {
	'windows': {
		'CmdOrCtrl': 'Ctrl'
	},
	'linux': {
		'CmdOrCtrl': 'Ctrl'
	},
	'mac': {
		'CmdOrCtrl': '⌘'
	}
};

/**
 * Map electron menu roles to menu labels.
 */
const roleMap = {
	'quit': 'Close'
};

/** 
 * Default class to manage electron state and mount the React component.
 */
export default class Electronbar {

	constructor({ electron, menu, title, icon, mountNode }) {
		this.electron = electron;
		this.title = title;
		this.icon = icon;
		this.mountNode = mountNode;

		this.setMenu(menu);
	}

	getWindow() {
		let window = this.electron.remote.getCurrentWindow();
		if (window) {
			return window;
		} else {
			return {
				valid: false,
				isMaximized: () => false,
				isFullScreen: () => false,
				minimize: ()=>{},
				maximize: ()=>{},
				unmaximize: ()=>{},
				close: ()=>{}
			};
		}
	}

	render() {
		reactDom.render(<TitleBar
			menu={this.menu}
			title={this.title}
			icon={this.icon}
			getWindow={ () => this.getWindow() }
		/>, this.mountNode);
	}

	setMenu(menu) {

		// register all accelerators
		this.electron.remote.Menu.setApplicationMenu(menu)

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

/**
 * Translate electron menu accelerator names to more OS specific ones. Use the accelerator map above.
 * @param {*} accelerator electron menu item accelerator
 * @param {*} platform system's platform ("windows", "linux", "mac")
 */
function translateAccelerator(accelerator, platform = 'windows') {

	let labelParts = [];
	let parts = accelerator.split('+');

	for (let part of parts) {
		let translatedAccelerator = acceleratorMap[platform][part];
		labelParts.push(translatedAccelerator ? translatedAccelerator : part);
	}

	return labelParts.join('+');
}

/**
 * Translate electron menu role types to menu bar labels. Use the role map above.
 * @param {*} item electron menu item
 */
function translateRole(item) {
	return item.label ? item.label : roleMap[item.role];
}

/* Components */

/**
 * The main react component.
 */
class TitleBar extends React.Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="electronbar">
				<Favicon icon={this.props.icon} />
				<Menu menu={this.props.menu} />
				<Title title={this.props.title} />
				<Buttons getWindow={this.props.getWindow} />
			</div>
		);
	}
}

/**
 * Menu react component. Contains all menu items.
 */
class Menu extends React.Component {

	state = {
		selectedItemKey: null,
	};

	constructor(props) {
		super(props);
		window.addEventListener('click', this.handleWindowClick, false);
		window.addEventListener('touchstart', this.handleWindowClick, false);
	}

	componentWillUnmount() {
		window.removeEventListener('click', this.handleWindowClick);
	}

	close() {
		this.setState({
			selectedItemKey: null
		});
	}

	handleWindowClick = () => {
		this.close();
	}

	handleItemClick = (key) => {
		this.setState({
			selectedItemKey: this.state.selectedItemKey == key ? null : key
		});
	};

	handleItemHover = (key) => {
		if (this.state.selectedItemKey != null) {
			this.setState({
				selectedItemKey: key
			});
		}
	};

	render() {

		let menu = this.props.menu;

		let items = [];
		for (let i = 0; i < menu.length; ++i) {
			if (menu[i].visible) {
				items.push(<MenuItem
					key={i} iKey={i}
					depth={0}
					item={menu[i]}
					open={i == this.state.selectedItemKey}
					onClick={this.handleItemClick}
					onHover={this.handleItemHover}
					close={ () => this.close() }
				/>);
			}
		}

		return (
			<div className="electronbar-menu">
				{items}
			</div>
		);
	}

}

/**
 * A top level or nested menu item.
 */
class MenuItem extends React.Component {

	hoverTimer = null;

	state = {
		selectedItemKey: null
	};

	constructor(props) {
		super(props);
	}

	handleClick = (e) => {
		e.stopPropagation();

		if (!this.props.item.enabled) { return; }
		
		if (this.props.item.type == 'normal') {

			// set timeout so that React has a chance to update before any potemtially locking function is called.
			setTimeout(() => this.props.item.click(), 50);

			this.close();

		} else if (this.props.onClick) {
			this.props.onClick(this.props.iKey);
		}
	};

	handleHover = (e) => {
		e.stopPropagation();
		if (this.props.item.enabled && this.props.onHover) { this.props.onHover(this.props.iKey); }
	};

	handleAntiHover = () => {
		this.clearHoverTimeout();

		this.hoverTimer = setTimeout(() => {
			this.hoverTimer = null;

			this.setState({
				selectedItemKey: null
			});
		}, HOVER_TIMEOUT);
	}

	handleItemClick = (key) => {
		this.clearHoverTimeout();
		this.setState({
			selectedItemKey: key
		});
	};

	handleItemHover = (key) => {
		this.clearHoverTimeout();

		if (this.state.selectedItemKey != key) {
			this.hoverTimer = setTimeout(() => {

				this.hoverTimer = null;

				this.setState({
					selectedItemKey: key
				});
			}, HOVER_TIMEOUT);
		}
	};

	close = () => {
		this.clearHoverTimeout();
		this.setState({
			selectedItemKey: null
		});
		if (this.props.close) { this.props.close(); }
	};

	clearHoverTimeout() {
		if (this.hoverTimer) {
			clearTimeout(this.hoverTimer);
			this.hoverTimer = null;
		}
	}

	render() {

		let item = this.props.item;
		let open = this.props.open;
		let depth = this.props.depth;
		let hasChildren = item.submenu && item.submenu.length;
		let enabled = item.enabled;

		let disabledCount = 0;
		let itemContainer = [];
		let classes = [];

		if (hasChildren) {

			let items = [];

			for (let i = 0; i < item.submenu.length; ++i) {
				if (item.submenu[i].visible) {
					items.push(<MenuItem
						key={i} iKey={i}
						depth={depth + 1}
						item={item.submenu[i]}
						open={i == this.state.selectedItemKey}
						onClick={this.handleItemClick}
						onHover={this.handleItemHover}
						close={this.close}
					/>);
				}
				if (item.submenu[i].type == 'separator' || !item.submenu[i].enabled) { disabledCount++; }
			}

			if (open && enabled && items.length && disabledCount < item.submenu.length) {
				itemContainer = <div className={ cn( depth ? 'electronbar-menu-item-children' : 'electronbar-top-menu-item-children') }>{items}</div>;
			}
		}

		// set disabled if all of this menu item's children are disabled (separators don't count as active or enabled)
		if (hasChildren && disabledCount == item.submenu.length) {
			enabled = false;
		}

		// set the dynamic CSS classes
		if (enabled && hasChildren && open) { classes.push('open'); }
		if (!enabled) { classes.push('disabled'); }

		// render a separator
		if (item.type == 'separator') {
			return (
				<div className="electronbar-seperator" onClick={this.handleClick}><hr /></div>
			);
		// render a not root item
		} else if (depth) {

			let expandOrAccelerator = [];

			if (hasChildren) {
				expandOrAccelerator = <Expander />;
			} else if (item.accelerator) {
				expandOrAccelerator = <Accelerator accelerator={item.accelerator} />;
			}

			return (
				<div className={ cn('electronbar-menu-item',  ...classes) } onMouseLeave={this.handleAntiHover}>
					<div className="electronbar-menu-item-label" onClick={this.handleClick} onMouseEnter={this.handleHover}>
						<div className="electronbar-menu-item-label-text">{ translateRole(item) }</div>
						{expandOrAccelerator}
					</div>
					{itemContainer}
				</div>
			);
		// render a root item
		} else {
			return (
				<div className={ cn('electronbar-top-menu-item', ...classes) } onMouseLeave={this.handleAntiHover}>
					<div className="electronbar-top-menu-item-label" onClick={this.handleClick} onMouseEnter={this.handleHover}>{ translateRole(item) }</div>
					{itemContainer}
				</div>
			);
		}
	}
}

/**
 * Minimize, maximize, unfullscreen, and close button container.
 */
class Buttons extends React.Component {

	state = {
		maximized: false,
		fullScreen: false
	};

	constructor(props) {
		super(props);

		let window = this.props.getWindow();
		this.state.maximized = window.isMaximized();
		this.state.fullScreen = window.isFullScreen();

		window.on('enter-full-screen', this.onWindowChange);
		window.on('leave-full-screen', this.onWindowChange);
		window.on('maximize', this.onWindowChange);
		window.on('unmaximize', this.onWindowChange);
	}

	componentWillUnmount() {
		window.removeListener('enter-full-screen', this.onWindowChange);
		window.removeListener('leave-full-screen', this.onWindowChange);
		window.removeListener('maximize', this.onWindowChange);
		window.removeListener('unmaximize', this.onWindowChange);
	}

	onWindowChange = () => {
		let window = this.props.getWindow();
		this.setState({
			maximized: window.isMaximized(),
			fullScreen: window.isFullScreen()
		});
	}

	handleUnFullscreenClick = () => {
		this.props.getWindow().setFullScreen(false);
	}

	handleMinimizeClick = () => {
		this.props.getWindow().minimize();
	}

	handleMaximizeClick = () => {
		let window = this.props.getWindow();
		if (window.isMaximized()) {
			window.unmaximize();
		} else {
			window.maximize();
		}
	}

	handleCloseClick = () => {
		this.props.getWindow().close();
	}

	render() {

		let buttons = [];

		if (this.state.fullScreen) {
			buttons.push(<UnFullscreenButton key="fullscreen-button" onClick={this.handleUnFullscreenClick} />);
		} else {
			buttons.push(<MinimizeButton key="minimize-button" onClick={this.handleMinimizeClick} />);
			buttons.push(<MaximizeButton key="maximize-button" maximized={this.state.maximized} onClick={this.handleMaximizeClick} />);
		}

		buttons.push(<CloseButton key="close-button" onClick={this.handleCloseClick} />);

		return (
			<div className="electronbar-buttons">
				{buttons}
			</div>
		);
	}
}

/* statics */

const Favicon = ({ icon, onClick }) => <div className="electronbar-favicon" onClick={onClick}><img src={icon} alt="" /></div>;
const Title = ({ title, onClick }) => <div className="electronbar-title" onClick={onClick}>{title}</div>;

const Expander = () => <div className="electronbar-menu-item-label-expander"><IconChevron /></div>;
const Accelerator = ({ accelerator }) => <div className="electronbar-menu-item-label-accelerator">{ translateAccelerator(accelerator) }</div>;

const MinimizeButton = ({ onClick }) => <div className="electronbar-button electronbar-button-minimize" onClick={onClick}><IconMinimize /></div>;
const MaximizeButton = ({ onClick, maximized = false }) => <div className="electronbar-button electronbar-button-maximize" onClick={onClick}>{ maximized ? <IconUnMaximize /> : <IconMaximize /> }</div>;
const UnFullscreenButton = ({ onClick }) => <div className="electronbar-button electronbar-button-unfullscreen" onClick={onClick}><IconUnMaximize /></div>;
const CloseButton = ({ onClick }) => <div className="electronbar-button electronbar-button-close" onClick={onClick}><IconClose /></div>;

/* icons */

const IconChevron = () => (
	<div className="electronbar-icon">
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 14 14">
				<path
					fill="currentColor"
					d="M4.52 12.364L9.879 7 4.52 1.636l.615-.615L11.122 7l-5.986 5.98-.615-.616z">
				</path>
		</svg>
	</div>
);

const IconMinimize = () => (
	<div className="electronbar-icon">
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 10 10"
		>
			<path
				fill="currentColor"
				d="M 0,5 10,5 10,6 0,6 Z"
			/>
		</svg>
	</div>
);

const IconUnMaximize = () => (
	<div className="electronbar-icon">
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 10 10"
		>
			<path
				fill="currentColor"
				d="m 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z"
			/>
		</svg>
	</div>
);

const IconMaximize = () => (
	<div className="electronbar-icon">
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 10 10"
		>
			<path
				fill="currentColor"
				d="M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z"
			/>
		</svg>
	</div>
);

const IconClose = () => (
	<div className="electronbar-icon">
		<svg
			aria-hidden="true"
			focusable="false"
			viewBox="0 0 10 10"
		>
			<path
				fill="currentColor"
				d="M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z"
			/>
		</svg>
	</div>
);