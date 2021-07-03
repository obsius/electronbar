import React from 'react';

/**
 * How much time in ms to wait before running an onClick function (used to allow the UI to respond first).
 */
const CLICK_DELAY = 50;

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
 * A top level or nested menu item.
 */
export default class MenuItem extends React.Component {

	hoverTimer = null;

	state = {
		selectedItemKey: null
	};

	constructor(props) {
		super(props);
	}

	componentWillUnmount() {
		this.clearHoverTimeout();
	}

	handleAntiHover = () => {
		this.clearHoverTimeout();

		this.hoverTimer = setTimeout(() => {
			this.hoverTimer = null;

			this.setState({
				selectedItemKey: null
			});
		}, HOVER_TIMEOUT);
	};

	handleClick = (e) => {
		e.stopPropagation();

		if (!this.props.item.enabled) { return; }
		
		if (this.props.item.type == 'normal') {

			// set timeout so that React has a chance to update before any potentially locking function is called.
			setTimeout(() => this.props.item.click(), CLICK_DELAY);

			this.close();

		} else if (this.props.onClick) {
			this.props.onClick(this.props.iKey);
		}
	};

	handleHover = (e) => {
		e.stopPropagation();
		if (this.props.item.enabled && this.props.onHover) { this.props.onHover(this.props.iKey); }
	};

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

			// iterate through submenu
			for (let i = 0; i < item.submenu.length; ++i) {

				if (item.submenu[i].visible) {
					items.push(
						<MenuItem
							key={i}
							iKey={i}
							depth={depth + 1}
							item={item.submenu[i]}
							open={i == this.state.selectedItemKey}
							onClick={this.handleItemClick}
							onHover={this.handleItemHover}
							close={this.close}
						/>
					);
				}
				
				if (item.submenu[i].type == 'separator' || !item.submenu[i].enabled) {
					disabledCount++;
				}
			}

			if (open && enabled && items.length && disabledCount < item.submenu.length) {
				itemContainer = <div className={ depth ? 'electronbar-menu-item-children' : 'electronbar-top-menu-item-children' }>{items}</div>;
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
				<div className="electronbar-seperator" onClick={this.handleClick}>
					<hr />
				</div>
			);

		// render a branch item
		} else if (depth) {

			let expandOrAccelerator = hasChildren ? (
				<Expander />
			) : (
				<Accelerator accelerator={item.accelerator} />
			);

			let checkedClassName = 'electronbar-menu-item-checkbox' +  (item.checked ? ' electronbar-menu-item-checkbox-active' : '');

			return (
				<div className={ ['electronbar-menu-item',  ...classes].join(' ') } onMouseEnter={this.handleHover} onMouseLeave={this.handleAntiHover}>
					<div className="electronbar-menu-item-label" onClick={this.handleClick}>
						<div className={checkedClassName} />
						<div className="electronbar-menu-item-label-text">
							{ translateRole(item) }
						</div>
						{expandOrAccelerator}
					</div>
					{itemContainer}
				</div>
			);

		// render a root item
		} else {
			return (
				<div className={ ['electronbar-top-menu-item', ...classes].join(' ') } onMouseEnter={this.handleHover} onMouseLeave={this.handleAntiHover}>
					<div className="electronbar-top-menu-item-label" onClick={this.handleClick}>
						{ translateRole(item) }
					</div>
					{itemContainer}
				</div>
			);
		}
	}
}

/* internal */

/**
 * Translate electron menu accelerator names to more OS specific ones. Use the accelerator map above.
 * @param {string} accelerator - electron menu item accelerator
 * @param {string} platform - system's platform ("windows", "linux", "mac")
 */
function translateAccelerator(accelerator, platform = 'windows') {

	let parts = accelerator ? ('' + accelerator).split('+') : [];

	for (let i = 0; i < parts.length; ++i) {
		parts[i] = acceleratorMap[platform][parts[i]] || parts[i];
	}

	return parts.join('+');
}

/**
 * Translate electron menu role types to menu bar labels. Use the role map above.
 * @param {obj} item - electron menu item
 */
function translateRole(item) {
	return item.label ? item.label : roleMap[item.role];
}

/* statics */

const Expander = () => (
	<div className="electronbar-menu-item-label-expander">
		<IconChevron />
	</div>
);

const Accelerator = ({ accelerator }) => {
	return accelerator ? (
		<div className="electronbar-menu-item-label-accelerator">
			{ translateAccelerator(accelerator) }
		</div>
	) : (
		null
	);
};

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