import React from 'react';

/**
 * Minimize, maximize, unfullscreen, and close button container.
 */
export default class Buttons extends React.Component {

	state = {
		maximized: false,
		fullScreen: false
	};

	constructor(props) {
		super(props);

		this.window = props.window;
		this.state.maximized = this.window.isMaximized();
		this.state.fullScreen = this.window.isFullScreen();

		['enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize'].forEach((event) => {
			this.window.on(event, this.onWindowChange);
		});

		window.addEventListener('beforeunload', this.destroy);
	}

	componentWillUnmount() {
		this.destroy();
	}

	destroy = () => {

		['enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize'].forEach((event) => {
			this.window.removeListener(event, this.onWindowChange);
		});

		if (window) {
			window.removeEventListener('beforeunload', this.destroy);
		}
	};

	onWindowChange = () => {
		this.setState({
			maximized: this.window.isMaximized(),
			fullScreen: this.window.isFullScreen()
		});
	};

	handleUnFullscreenClick = () => {
		this.window.setFullScreen(false);
	};

	handleMinimizeClick = () => {
		this.window.minimize();
	};

	handleMaximizeClick = () => {
		if (this.window.isMaximized()) {
			this.window.unmaximize();
		} else {
			this.window.maximize();
		}
	};

	handleCloseClick = () => {
		this.window.close();
	};

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

const MinimizeButton = ({ onClick }) => <div className="electronbar-button electronbar-button-minimize" onClick={onClick}><IconMinimize /></div>;
const MaximizeButton = ({ onClick, maximized = false }) => <div className="electronbar-button electronbar-button-maximize" onClick={onClick}>{ maximized ? <IconUnMaximize /> : <IconMaximize /> }</div>;
const UnFullscreenButton = ({ onClick }) => <div className="electronbar-button electronbar-button-unfullscreen" onClick={onClick}><IconUnMaximize /></div>;
const CloseButton = ({ onClick }) => <div className="electronbar-button electronbar-button-close" onClick={onClick}><IconClose /></div>;

/* icons */

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