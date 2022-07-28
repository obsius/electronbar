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

	// use a timer for auto closing, but keep open if a child has been hovered open (indicated by antiHoverDisabled)
	hoverTimer = null;
	antiHoverDisabled = false;

	state = {
		selectedItemKey: null
	};

	constructor(props) {
		super(props);
		this.ref = React.createRef();
	}

	componentDidUpdate() {

		// reset state without render
		if (!this.props.open) {
			this.state.selectedItemKey = null;
			this.antiHoverDisabled = false;
		}

		// check if offscreen
		if (this.ref.current) {

			let bounds = this.ref.current.getBoundingClientRect();

			let maxX = bounds.x + bounds.width;

			if (maxX > window.innerWidth) {
				this.ref.current.style.left = `-${bounds.width + 10}px`;
			}
		}
	}

	componentWillUnmount() {
		this.clearHoverTimeout();
	}

	clearHoverTimeout() {
		if (this.hoverTimer) {
			clearTimeout(this.hoverTimer);
			this.hoverTimer = null;
		}
	}

	close() {

		this.clearHoverTimeout();

		if (this.state.selectedItemKey != null) {
			this.setState({
				selectedItemKey: null
			});
		}

		if (this.props.onClose) {
			this.props.onClose();
		}
	}

	handleAntiHover = () => {

		this.clearHoverTimeout();

		if (!this.antiHoverDisabled) {
			this.hoverTimer = setTimeout(() => {

				this.hoverTimer = null;

				this.setState({
					selectedItemKey: null
				});
			}, HOVER_TIMEOUT);
		}
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

	handleClose = () => {
		this.close();
	};

	handleHover = (e) => {

		e.stopPropagation();

		this.clearHoverTimeout();
		
		if (this.props.item.enabled && this.props.onHover) { this.props.onHover(this.props.iKey, 1); }
	};

	handleItemClick = (key) => {
		this.clearHoverTimeout();
		this.setState({
			selectedItemKey: key
		});
	};

	handleItemHover = (key, relativeDepth = 0) => {

		this.clearHoverTimeout();

		// disable menu closing if a child has been hovered over
		this.antiHoverDisabled = relativeDepth > 1;

		if (this.state.selectedItemKey != key) {
			this.hoverTimer = setTimeout(() => {

				this.hoverTimer = null;

				this.setState({
					selectedItemKey: key
				});
			}, HOVER_TIMEOUT);
		}

		// forward up the chain
		if (this.props.item.enabled && this.props.onHover) { this.props.onHover(this.props.iKey, relativeDepth + 1); }
	};

	render() {

		let { item, open, depth = 0 } = this.props;

		let hoisted = Array.isArray(item);
		let children = hoisted ? item : item.submenu;

		let hasChildren = children && children.length;
		let enabled = item.enabled;

		let disabledCount = 0;
		let itemContainer = [];
		let classes = [];

		if (hasChildren) {

			let items = [];

			// iterate through submenu
			for (let i = 0; i < children.length; ++i) {

				if (children[i].visible) {
					items.push(
						<MenuItem
							key={i}
							iKey={i}
							depth={depth + 1}
							item={children[i]}
							open={i == this.state.selectedItemKey}
							onClick={this.handleItemClick}
							onHover={this.handleItemHover}
							onClose={this.handleClose}
						/>
					);
				}
				
				if (children[i].type == 'separator' || !children[i].enabled) {
					disabledCount++;
				}
			}

			// forward items to parent container
			if (hoisted) {
				itemContainer = items;

			// check it top level
			} else if (open && enabled && items.length && disabledCount < children.length) {
				itemContainer = (
					<div ref={this.ref} style={{ zIndex: 1000 + depth }} className={ depth ? 'electronbar-menu-item-children' : 'electronbar-top-menu-item-children' }>
						{ items }
					</div>
				);
			}
		}

		// top level context menu
		if (hoisted) {
			return (
				<div ref={this.ref} className="electronbar-context-menu-children" onMouseLeave={this.handleAntiHover}>
					{ itemContainer }
				</div>
			);

		// menu item
		} else {

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
							{ expandOrAccelerator }
						</div>
						{ itemContainer }
					</div>
				);

			// render a root item
			} else {
				return (
					<div className={ ['electronbar-top-menu-item', ...classes].join(' ') } onMouseEnter={this.handleHover} onMouseLeave={this.handleAntiHover}>
						<div className="electronbar-top-menu-item-label" onClick={this.handleClick}>
							{ translateRole(item) }
						</div>
						{ itemContainer }
					</div>
				);
			}
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