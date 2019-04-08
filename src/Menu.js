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
		window.addEventListener('click', this.handleWindowClick, false);
		window.addEventListener('touchstart', this.handleWindowClick, false);
	}

	componentWillUnmount() {
		window.removeEventListener('click', this.handleWindowClick);
		window.removeEventListener('touchstart', this.handleWindowClick);
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