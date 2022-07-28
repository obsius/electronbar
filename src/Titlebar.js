import React from 'react';

import Menu from './Menu';
import Buttons from './Buttons';

/**
 * The main react component.
 */
export default class TitleBar extends React.Component {

	shouldComponentUpdate(nextProps) {
		return nextProps.needsUpdate;
	}

	render() {
		return (
			<div className="electronbar">
				<Favicon icon={this.props.icon} />
				<Menu menu={this.props.menu} />
				<Title title={this.props.title} />
				<Buttons browserWindow={this.props.browserWindow} />
			</div>
		);
	}
}

/* statics */

const Favicon = ({ icon, onClick }) => (
	<div className="electronbar-favicon" onClick={onClick}>
		<img src={icon} alt="" />
	</div>
);

const Title = ({ title, onClick }) => (
	<div className="electronbar-title" onClick={onClick}>
		{ title }
	</div>
);