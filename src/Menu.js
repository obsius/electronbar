import React from 'react';

import MenuItem from './MenuItem';

/**
 * Menu react component. Contains all menu items.
 */
export default class Menu extends React.Component {

	state = {
		selectedItemKey: null,
	};

	constructor(props) {

		super(props);

		this.ref = React.createRef();

		window.addEventListener('click', this.handleWindowClick, true);
		window.addEventListener('contextmenu', this.handleWindowClick, true);
	}

	componentWillUnmount() {
		window.removeEventListener('click', this.handleWindowClick, true);
		window.removeEventListener('contextmenu', this.handleWindowClick, true);
	}

	componentDidMount() {

		// check if offscreen
		if (this.props.context && this.ref.current) {

			let bounds = this.ref.current.getBoundingClientRect();

			let maxX = bounds.x + bounds.width;

			if (maxX > window.innerWidth) {
				this.ref.current.style.left = `${window.innerWidth - (bounds.width + 10)}px`;
			}
		}
	}

	close() {

		if (this.state.selectedItemKey != null) {
			this.setState({
				selectedItemKey: null
			});
		}

		if (this.props.onClose) {
			this.props.onClose();
		}
	}

	handleClose = () => {
		this.close();
	};

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

	handleWindowClick = (e) => {
		if (!e.composedPath().includes(this.ref.current)) {
			this.close();
		}
	};

	render() {

		let { context, menu, x, y } = this.props;

		let items = [];

		// context menu
		if (context) {
			items.push(
				<MenuItem open item={menu} onClose={this.handleClose} />
			);

		// top-level menu
		} else {
			for (let i = 0; i < menu.length; ++i) {
				if (menu[i].visible) {
					items.push(
						<MenuItem
							key={i}
							iKey={i}
							depth={context ? 1 : 0}
							item={menu[i]}
							open={i == this.state.selectedItemKey}
							onClick={this.handleItemClick}
							onHover={this.handleItemHover}
							onClose={this.handleClose}
						/>
					);
				}
			}
		}

		let className = context ? 'electronbar-context-menu' : 'electronbar-menu';

		let style = context && {
			left: x,
			top: y
		};

		return (
			<div ref={this.ref} className={className} style={style}>
				{ items }
			</div>
		);
	}
}