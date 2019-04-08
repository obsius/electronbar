import React from 'react';

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

	componentWillUnmount() {
		this.clearHoverTimeout();
	}

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
				<div className={ ['electronbar-menu-item',  ...classes].join(' ') } onMouseEnter={this.handleHover} onMouseLeave={this.handleAntiHover}>
					<div className="electronbar-menu-item-label" onClick={this.handleClick}>
						<div className="electronbar-menu-item-label-text">{ translateRole(item) }</div>
						{expandOrAccelerator}
					</div>
					{itemContainer}
				</div>
			);
		// render a root item
		} else {
			return (
				<div className={ ['electronbar-top-menu-item', ...classes].join(' ') } onMouseEnter={this.handleHover} onMouseLeave={this.handleAntiHover}>
					<div className="electronbar-top-menu-item-label" onClick={this.handleClick}>{ translateRole(item) }</div>
					{itemContainer}
				</div>
			);
		}
	}
}

/* internal */

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

/* statics */

const Expander = () => <div className="electronbar-menu-item-label-expander"><IconChevron /></div>;
const Accelerator = ({ accelerator }) => <div className="electronbar-menu-item-label-accelerator">{ translateAccelerator(accelerator) }</div>;