'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _class3, _temp, _initialiseProps;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Map electron menu accelerators to platform specific keys.
 */
var acceleratorMap = {
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
var roleMap = {
	'quit': 'Close'
};

/** 
 * Default class to manage electron state and mount the React component.
 */

var Electronbar = function () {
	function Electronbar(_ref) {
		var electron = _ref.electron,
		    menu = _ref.menu,
		    title = _ref.title,
		    icon = _ref.icon,
		    mountNode = _ref.mountNode;
		(0, _classCallCheck3.default)(this, Electronbar);

		this.electron = electron;
		this.title = title;
		this.icon = icon;
		this.mountNode = mountNode;

		this.setMenu(menu);
	}

	(0, _createClass3.default)(Electronbar, [{
		key: 'getWindow',
		value: function getWindow() {
			var window = this.electron.remote.getCurrentWindow();
			if (window) {
				return window;
			} else {
				return {
					valid: false,
					isMaximized: function isMaximized() {
						return false;
					},
					isFullScreen: function isFullScreen() {
						return false;
					},
					minimize: function minimize() {},
					maximize: function maximize() {},
					unmaximize: function unmaximize() {},
					close: function close() {}
				};
			}
		}
	}, {
		key: 'render',
		value: function render() {
			var _this = this;

			_reactDom2.default.render(_react2.default.createElement(TitleBar, {
				menu: this.menu,
				title: this.title,
				icon: this.icon,
				getWindow: function getWindow() {
					return _this.getWindow();
				}
			}), this.mountNode);
		}
	}, {
		key: 'setMenu',
		value: function setMenu(menu) {

			// register all accelerators
			this.electron.remote.Menu.setApplicationMenu(menu);

			// the electron menu is fucked up and really slow, make a faster version
			this.menu = parseMenu(menu);

			this.render();
		}
	}, {
		key: 'setTitle',
		value: function setTitle(title) {
			this.title = title;
			this.render();
		}
	}, {
		key: 'setIcon',
		value: function setIcon(icon) {
			this.icon = icon;
			this.render();
		}
	}]);
	return Electronbar;
}();

/**
 * The electron menu is huge and slow, make a smaller and faster version.
 * @param {*} menu the electron menu (not the template, the built menu) 
 */


exports.default = Electronbar;
function parseMenu(menu) {

	var liteMenu = [];
	var items = menu.items ? menu.items : menu.submenu ? menu.submenu.items : [];

	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = (0, _getIterator3.default)(items), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var item = _step.value;

			var liteItem = {
				accelerator: item.accelerator,
				click: item.click ? item.click : function () {},
				enabled: item.enabled,
				label: item.label,
				role: item.role,
				type: item.type,
				visible: item.visible,
				submenu: parseMenu(item)
			};

			liteMenu.push(liteItem);
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	return liteMenu;
}

/**
 * Translate electron menu accelerator names to more OS specific ones. Use the accelerator map above.
 * @param {*} accelerator electron menu item accelerator
 * @param {*} platform system's platform ("windows", "linux", "mac")
 */
function translateAccelerator(accelerator) {
	var platform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'windows';


	var labelParts = [];
	var parts = accelerator.split('+');

	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = (0, _getIterator3.default)(parts), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			var part = _step2.value;

			var translatedAccelerator = acceleratorMap[platform][part];
			labelParts.push(translatedAccelerator ? translatedAccelerator : part);
		}
	} catch (err) {
		_didIteratorError2 = true;
		_iteratorError2 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion2 && _iterator2.return) {
				_iterator2.return();
			}
		} finally {
			if (_didIteratorError2) {
				throw _iteratorError2;
			}
		}
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

var TitleBar = function (_React$Component) {
	(0, _inherits3.default)(TitleBar, _React$Component);

	function TitleBar(props) {
		(0, _classCallCheck3.default)(this, TitleBar);
		return (0, _possibleConstructorReturn3.default)(this, (TitleBar.__proto__ || (0, _getPrototypeOf2.default)(TitleBar)).call(this, props));
	}

	(0, _createClass3.default)(TitleBar, [{
		key: 'render',
		value: function render() {
			return _react2.default.createElement(
				'div',
				{ className: 'electronbar' },
				_react2.default.createElement(Favicon, { icon: this.props.icon }),
				_react2.default.createElement(Menu, { menu: this.props.menu }),
				_react2.default.createElement(Title, { title: this.props.title }),
				_react2.default.createElement(Buttons, { getWindow: this.props.getWindow })
			);
		}
	}]);
	return TitleBar;
}(_react2.default.Component);

/**
 * Menu react component. Contains all menu items.
 */


var Menu = function (_React$Component2) {
	(0, _inherits3.default)(Menu, _React$Component2);

	function Menu(props) {
		(0, _classCallCheck3.default)(this, Menu);

		var _this3 = (0, _possibleConstructorReturn3.default)(this, (Menu.__proto__ || (0, _getPrototypeOf2.default)(Menu)).call(this, props));

		_this3.state = {
			selectedItemKey: null
		};

		_this3.handleWindowClick = function () {
			_this3.close();
		};

		_this3.handleItemClick = function (key) {
			_this3.setState({
				selectedItemKey: _this3.state.selectedItemKey == key ? null : key
			});
		};

		_this3.handleItemHover = function (key) {
			if (_this3.state.selectedItemKey != null) {
				_this3.setState({
					selectedItemKey: key
				});
			}
		};

		window.addEventListener('click', _this3.handleWindowClick, false);
		window.addEventListener('touchstart', _this3.handleWindowClick, false);
		return _this3;
	}

	(0, _createClass3.default)(Menu, [{
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			window.removeEventListener('click', this.handleWindowClick);
		}
	}, {
		key: 'close',
		value: function close() {
			this.setState({
				selectedItemKey: null
			});
		}
	}, {
		key: 'render',
		value: function render() {
			var _this4 = this;

			var menu = this.props.menu;

			var items = [];
			for (var i = 0; i < menu.length; ++i) {
				if (menu[i].visible) {
					items.push(_react2.default.createElement(MenuItem, {
						key: i, iKey: i,
						depth: 0,
						item: menu[i],
						open: i == this.state.selectedItemKey,
						onClick: this.handleItemClick,
						onHover: this.handleItemHover,
						close: function close() {
							return _this4.close();
						}
					}));
				}
			}

			return _react2.default.createElement(
				'div',
				{ className: 'electronbar-menu' },
				items
			);
		}
	}]);
	return Menu;
}(_react2.default.Component);

/**
 * A top level or nested menu item.
 */


var MenuItem = function (_React$Component3) {
	(0, _inherits3.default)(MenuItem, _React$Component3);

	function MenuItem(props) {
		(0, _classCallCheck3.default)(this, MenuItem);

		var _this5 = (0, _possibleConstructorReturn3.default)(this, (MenuItem.__proto__ || (0, _getPrototypeOf2.default)(MenuItem)).call(this, props));

		_this5.state = {
			selectedItemKey: null
		};

		_this5.handleClick = function (e) {
			e.stopPropagation();

			if (!_this5.props.item.enabled) {
				return;
			}

			if (_this5.props.item.type == 'normal') {

				// set timeout so that React has a chance to update before any potemtially locking function is called.
				setTimeout(function () {
					return _this5.props.item.click();
				}, 50);

				if (_this5.props.close) {
					_this5.props.close();
				}
			} else if (_this5.props.onClick) {
				_this5.props.onClick(_this5.props.iKey);
			}
		};

		_this5.handleHover = function (e) {
			e.stopPropagation();
			if (_this5.props.item.enabled && _this5.props.onHover) {
				_this5.props.onHover(_this5.props.iKey);
			}
		};

		_this5.handleAntiHover = function () {
			_this5.setState({
				selectedItemKey: null
			});
		};

		_this5.handleItemClick = function (key) {
			_this5.setState({
				selectedItemKey: key
			});
		};

		_this5.handleItemHover = function (key) {
			_this5.setState({
				selectedItemKey: key
			});
		};

		_this5.close = function () {
			_this5.setState({
				selectedItemKey: null
			});
			if (_this5.props.close) {
				_this5.props.close();
			}
		};

		return _this5;
	}

	(0, _createClass3.default)(MenuItem, [{
		key: 'render',
		value: function render() {

			var item = this.props.item;
			var open = this.props.open;
			var depth = this.props.depth;
			var hasChildren = item.submenu && item.submenu.length;
			var enabled = item.enabled;

			var disabledCount = 0;
			var itemContainer = [];
			var classes = [];

			if (hasChildren) {

				var items = [];

				for (var i = 0; i < item.submenu.length; ++i) {
					if (item.submenu[i].visible) {
						items.push(_react2.default.createElement(MenuItem, {
							key: i, iKey: i,
							depth: depth + 1,
							item: item.submenu[i],
							open: i == this.state.selectedItemKey,
							onClick: this.handleItemClick,
							onHover: this.handleItemHover,
							close: this.close
						}));
					}
					if (item.submenu[i].type == 'separator' || !item.submenu[i].enabled) {
						disabledCount++;
					}
				}

				if (open && enabled && items.length && disabledCount < item.submenu.length) {
					itemContainer = _react2.default.createElement(
						'div',
						{ className: (0, _classnames2.default)(depth ? 'electronbar-menu-item-children' : 'electronbar-top-menu-item-children'), onMouseLeave: this.handleAntiHover },
						items
					);
				}
			}

			// set disabled if all of this menu item's children are disabled (separators don't count as active or enabled)
			if (hasChildren && disabledCount == item.submenu.length) {
				enabled = false;
			}

			// set the dynamic CSS classes
			if (enabled && hasChildren && open) {
				classes.push('open');
			}
			if (!enabled) {
				classes.push('disabled');
			}

			// render a separator
			if (item.type == 'separator') {
				return _react2.default.createElement(
					'div',
					{ className: 'electronbar-seperator', onClick: this.handleClick },
					_react2.default.createElement('hr', null)
				);
				// render a not root item
			} else if (depth) {

				var expandOrAccelerator = [];

				if (hasChildren) {
					expandOrAccelerator = _react2.default.createElement(Expander, null);
				} else if (item.accelerator) {
					expandOrAccelerator = _react2.default.createElement(Accelerator, { accelerator: item.accelerator });
				}

				return _react2.default.createElement(
					'div',
					{ className: _classnames2.default.apply(undefined, ['electronbar-menu-item'].concat(classes)) },
					_react2.default.createElement(
						'div',
						{ className: 'electronbar-menu-item-label', onClick: this.handleClick, onMouseEnter: this.handleHover },
						_react2.default.createElement(
							'div',
							{ className: 'electronbar-menu-item-label-text' },
							translateRole(item)
						),
						expandOrAccelerator
					),
					itemContainer
				);
				// render a root item
			} else {
				return _react2.default.createElement(
					'div',
					{ className: _classnames2.default.apply(undefined, ['electronbar-top-menu-item'].concat(classes)) },
					_react2.default.createElement(
						'div',
						{ className: 'electronbar-top-menu-item-label', onClick: this.handleClick, onMouseEnter: this.handleHover },
						translateRole(item)
					),
					itemContainer
				);
			}
		}
	}]);
	return MenuItem;
}(_react2.default.Component);

/**
 * Minimize, maximize, unfullscreen, and close button container.
 */


var Buttons = (_temp = _class3 = function (_React$Component4) {
	(0, _inherits3.default)(Buttons, _React$Component4);

	function Buttons(props) {
		(0, _classCallCheck3.default)(this, Buttons);

		var _this6 = (0, _possibleConstructorReturn3.default)(this, (Buttons.__proto__ || (0, _getPrototypeOf2.default)(Buttons)).call(this, props));

		_initialiseProps.call(_this6);

		var window = _this6.props.getWindow();
		_this6.state.maximized = window.isMaximized();
		_this6.state.fullScreen = window.isFullScreen();

		window.on('enter-full-screen', _this6.onWindowChange);
		window.on('leave-full-screen', _this6.onWindowChange);
		window.on('maximize', _this6.onWindowChange);
		window.on('unmaximize', _this6.onWindowChange);
		return _this6;
	}

	(0, _createClass3.default)(Buttons, [{
		key: 'componentWillUnmount',
		value: function componentWillUnmount() {
			window.removeListener('enter-full-screen', this.onWindowChange);
			window.removeListener('leave-full-screen', this.onWindowChange);
			window.removeListener('maximize', this.onWindowChange);
			window.removeListener('unmaximize', this.onWindowChange);
		}
	}, {
		key: 'render',
		value: function render() {

			var buttons = [];

			if (this.state.fullScreen) {
				buttons.push(_react2.default.createElement(UnFullscreenButton, { key: 'fullscreen-button', onClick: this.handleUnFullscreenClick }));
			} else {
				buttons.push(_react2.default.createElement(MinimizeButton, { key: 'minimize-button', onClick: this.handleMinimizeClick }));
				buttons.push(_react2.default.createElement(MaximizeButton, { key: 'maximize-button', maximized: this.state.maximized, onClick: this.handleMaximizeClick }));
			}

			buttons.push(_react2.default.createElement(CloseButton, { key: 'close-button', onClick: this.handleCloseClick }));

			return _react2.default.createElement(
				'div',
				{ className: 'electronbar-buttons' },
				buttons
			);
		}
	}]);
	return Buttons;
}(_react2.default.Component), _initialiseProps = function _initialiseProps() {
	var _this7 = this;

	this.state = {
		maximized: false,
		fullScreen: false
	};

	this.onWindowChange = function () {
		var window = _this7.props.getWindow();
		_this7.setState({
			maximized: window.isMaximized(),
			fullScreen: window.isFullScreen()
		});
	};

	this.handleUnFullscreenClick = function () {
		_this7.props.getWindow().setFullScreen(false);
	};

	this.handleMinimizeClick = function () {
		_this7.props.getWindow().minimize();
	};

	this.handleMaximizeClick = function () {
		var window = _this7.props.getWindow();
		if (window.isMaximized()) {
			window.unmaximize();
		} else {
			window.maximize();
		}
	};

	this.handleCloseClick = function () {
		_this7.props.getWindow().close();
	};
}, _temp);

/* statics */

var Favicon = function Favicon(_ref2) {
	var icon = _ref2.icon,
	    onClick = _ref2.onClick;
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-favicon', onClick: onClick },
		_react2.default.createElement('img', { src: icon, alt: '' })
	);
};
var Title = function Title(_ref3) {
	var title = _ref3.title,
	    onClick = _ref3.onClick;
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-title', onClick: onClick },
		title
	);
};

var Expander = function Expander() {
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-menu-item-label-expander' },
		_react2.default.createElement(IconChevron, null)
	);
};
var Accelerator = function Accelerator(_ref4) {
	var accelerator = _ref4.accelerator;
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-menu-item-label-accelerator' },
		translateAccelerator(accelerator)
	);
};

var MinimizeButton = function MinimizeButton(_ref5) {
	var onClick = _ref5.onClick;
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-button electronbar-button-minimize', onClick: onClick },
		_react2.default.createElement(IconMinimize, null)
	);
};
var MaximizeButton = function MaximizeButton(_ref6) {
	var onClick = _ref6.onClick,
	    _ref6$maximized = _ref6.maximized,
	    maximized = _ref6$maximized === undefined ? false : _ref6$maximized;
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-button electronbar-button-maximize', onClick: onClick },
		maximized ? _react2.default.createElement(IconUnMaximize, null) : _react2.default.createElement(IconMaximize, null)
	);
};
var UnFullscreenButton = function UnFullscreenButton(_ref7) {
	var onClick = _ref7.onClick;
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-button electronbar-button-unfullscreen', onClick: onClick },
		_react2.default.createElement(IconUnMaximize, null)
	);
};
var CloseButton = function CloseButton(_ref8) {
	var onClick = _ref8.onClick;
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-button electronbar-button-close', onClick: onClick },
		_react2.default.createElement(IconClose, null)
	);
};

/* icons */

var IconChevron = function IconChevron() {
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-icon' },
		_react2.default.createElement(
			'svg',
			{
				'aria-hidden': 'true',
				focusable: 'false',
				viewBox: '0 0 14 14' },
			_react2.default.createElement('path', {
				fill: 'currentColor',
				d: 'M4.52 12.364L9.879 7 4.52 1.636l.615-.615L11.122 7l-5.986 5.98-.615-.616z' })
		)
	);
};

var IconMinimize = function IconMinimize() {
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-icon' },
		_react2.default.createElement(
			'svg',
			{
				'aria-hidden': 'true',
				focusable: 'false',
				viewBox: '0 0 10 10'
			},
			_react2.default.createElement('path', {
				fill: 'currentColor',
				d: 'M 0,5 10,5 10,6 0,6 Z'
			})
		)
	);
};

var IconUnMaximize = function IconUnMaximize() {
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-icon' },
		_react2.default.createElement(
			'svg',
			{
				'aria-hidden': 'true',
				focusable: 'false',
				viewBox: '0 0 10 10'
			},
			_react2.default.createElement('path', {
				fill: 'currentColor',
				d: 'm 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z'
			})
		)
	);
};

var IconMaximize = function IconMaximize() {
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-icon' },
		_react2.default.createElement(
			'svg',
			{
				'aria-hidden': 'true',
				focusable: 'false',
				viewBox: '0 0 10 10'
			},
			_react2.default.createElement('path', {
				fill: 'currentColor',
				d: 'M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z'
			})
		)
	);
};

var IconClose = function IconClose() {
	return _react2.default.createElement(
		'div',
		{ className: 'electronbar-icon' },
		_react2.default.createElement(
			'svg',
			{
				'aria-hidden': 'true',
				focusable: 'false',
				viewBox: '0 0 10 10'
			},
			_react2.default.createElement('path', {
				fill: 'currentColor',
				d: 'M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z'
			})
		)
	);
};