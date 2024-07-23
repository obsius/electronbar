'use strict';

var React = require('react');
var ReactDomClient = require('react-dom/client');

function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}

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
class MenuItem extends React.Component {
  constructor(props) {
    super(props);
    // use a timer for auto closing, but keep open if a child has been hovered open (indicated by antiHoverDisabled)
    _defineProperty(this, "hoverTimer", null);
    _defineProperty(this, "antiHoverDisabled", false);
    _defineProperty(this, "state", {
      selectedItemKey: null
    });
    _defineProperty(this, "handleAntiHover", () => {
      this.clearHoverTimeout();
      if (!this.antiHoverDisabled) {
        this.hoverTimer = setTimeout(() => {
          this.hoverTimer = null;
          this.setState({
            selectedItemKey: null
          });
        }, HOVER_TIMEOUT);
      }
    });
    _defineProperty(this, "handleClick", e => {
      e.stopPropagation();
      if (!this.props.item.enabled) {
        return;
      }
      if (this.props.item.type == 'normal') {
        // set timeout so that React has a chance to update before any potentially locking function is called.
        setTimeout(() => this.props.item.click(), CLICK_DELAY);
        this.close();
      } else if (this.props.onClick) {
        this.props.onClick(this.props.iKey);
      }
    });
    _defineProperty(this, "handleClose", () => {
      this.close();
    });
    _defineProperty(this, "handleHover", e => {
      e.stopPropagation();
      this.clearHoverTimeout();
      if (this.props.item.enabled && this.props.onHover) {
        this.props.onHover(this.props.iKey, 1);
      }
    });
    _defineProperty(this, "handleItemClick", key => {
      this.clearHoverTimeout();
      this.setState({
        selectedItemKey: key
      });
    });
    _defineProperty(this, "handleItemHover", (key, relativeDepth = 0) => {
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
      if (this.props.item.enabled && this.props.onHover) {
        this.props.onHover(this.props.iKey, relativeDepth + 1);
      }
    });
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
  render() {
    let {
      item,
      open,
      depth = 0
    } = this.props;
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
          items.push( /*#__PURE__*/React.createElement(MenuItem, {
            key: i,
            iKey: i,
            depth: depth + 1,
            item: children[i],
            open: i == this.state.selectedItemKey,
            onClick: this.handleItemClick,
            onHover: this.handleItemHover,
            onClose: this.handleClose
          }));
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
        itemContainer = /*#__PURE__*/React.createElement("div", {
          ref: this.ref,
          style: {
            zIndex: 1000 + depth
          },
          className: depth ? 'electronbar-menu-item-children' : 'electronbar-top-menu-item-children'
        }, items);
      }
    }

    // top level context menu
    if (hoisted) {
      return /*#__PURE__*/React.createElement("div", {
        ref: this.ref,
        className: "electronbar-context-menu-children",
        onMouseLeave: this.handleAntiHover
      }, itemContainer);

      // menu item
    } else {
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
        return /*#__PURE__*/React.createElement("div", {
          className: "electronbar-seperator",
          onClick: this.handleClick
        }, /*#__PURE__*/React.createElement("hr", null));

        // render a branch item
      } else if (depth) {
        let expandOrAccelerator = hasChildren ? /*#__PURE__*/React.createElement(Expander, null) : /*#__PURE__*/React.createElement(Accelerator, {
          accelerator: item.accelerator
        });
        let checkedClassName = 'electronbar-menu-item-checkbox' + (item.checked ? ' electronbar-menu-item-checkbox-active' : '');
        return /*#__PURE__*/React.createElement("div", {
          className: ['electronbar-menu-item', ...classes].join(' '),
          onMouseEnter: this.handleHover,
          onMouseLeave: this.handleAntiHover
        }, /*#__PURE__*/React.createElement("div", {
          className: "electronbar-menu-item-label",
          onClick: this.handleClick
        }, /*#__PURE__*/React.createElement("div", {
          className: checkedClassName
        }), /*#__PURE__*/React.createElement("div", {
          className: "electronbar-menu-item-label-text"
        }, translateRole(item)), expandOrAccelerator), itemContainer);

        // render a root item
      } else {
        return /*#__PURE__*/React.createElement("div", {
          className: ['electronbar-top-menu-item', ...classes].join(' '),
          onMouseEnter: this.handleHover,
          onMouseLeave: this.handleAntiHover
        }, /*#__PURE__*/React.createElement("div", {
          className: "electronbar-top-menu-item-label",
          onClick: this.handleClick
        }, translateRole(item)), itemContainer);
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

const Expander = () => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-menu-item-label-expander"
}, /*#__PURE__*/React.createElement(IconChevron, null));
const Accelerator = ({
  accelerator
}) => {
  return accelerator ? /*#__PURE__*/React.createElement("div", {
    className: "electronbar-menu-item-label-accelerator"
  }, translateAccelerator(accelerator)) : null;
};

/* icons */

const IconChevron = () => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 14 14"
}, /*#__PURE__*/React.createElement("path", {
  fill: "currentColor",
  d: "M4.52 12.364L9.879 7 4.52 1.636l.615-.615L11.122 7l-5.986 5.98-.615-.616z"
})));

/**
 * Menu react component. Contains all menu items.
 */
class Menu extends React.Component {
  constructor(props) {
    super(props);
    _defineProperty(this, "state", {
      selectedItemKey: null
    });
    _defineProperty(this, "handleClose", () => {
      this.close();
    });
    _defineProperty(this, "handleItemClick", key => {
      this.setState({
        selectedItemKey: this.state.selectedItemKey == key ? null : key
      });
    });
    _defineProperty(this, "handleItemHover", key => {
      if (this.state.selectedItemKey != null) {
        this.setState({
          selectedItemKey: key
        });
      }
    });
    _defineProperty(this, "handleWindowClick", e => {
      if (!e.composedPath().includes(this.ref.current)) {
        this.close();
      }
    });
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
  render() {
    let {
      context,
      menu,
      x,
      y
    } = this.props;
    let items = [];

    // context menu
    if (context) {
      items.push( /*#__PURE__*/React.createElement(MenuItem, {
        open: true,
        item: menu,
        onClose: this.handleClose
      }));

      // top-level menu
    } else {
      for (let i = 0; i < menu.length; ++i) {
        if (menu[i].visible) {
          items.push( /*#__PURE__*/React.createElement(MenuItem, {
            key: i,
            iKey: i,
            depth: context ? 1 : 0,
            item: menu[i],
            open: i == this.state.selectedItemKey,
            onClick: this.handleItemClick,
            onHover: this.handleItemHover,
            onClose: this.handleClose
          }));
        }
      }
    }
    let className = context ? 'electronbar-context-menu' : 'electronbar-menu';
    let style = context && {
      left: x,
      top: y
    };
    return /*#__PURE__*/React.createElement("div", {
      ref: this.ref,
      className: className,
      style: style
    }, items);
  }
}

/**
 * Minimize, maximize, unfullscreen, and close button container.
 */
class Buttons extends React.Component {
  constructor(props) {
    super(props);
    _defineProperty(this, "state", {
      maximized: false,
      fullScreen: false
    });
    _defineProperty(this, "destroy", () => {
      ['enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize'].forEach(event => {
        this.browserWindow.removeListener(event, this.onWindowChange);
      });
      if (window) {
        window.removeEventListener('beforeunload', this.destroy);
      }
    });
    _defineProperty(this, "onWindowChange", () => {
      this.setState({
        maximized: this.browserWindow.isMaximized(),
        fullScreen: this.browserWindow.isFullScreen()
      });
    });
    _defineProperty(this, "handleUnFullscreenClick", () => {
      this.browserWindow.setFullScreen(false);
    });
    _defineProperty(this, "handleMinimizeClick", () => {
      this.browserWindow.minimize();
    });
    _defineProperty(this, "handleMaximizeClick", () => {
      if (this.browserWindow.isMaximized()) {
        this.browserWindow.unmaximize();
      } else {
        this.browserWindow.maximize();
      }
    });
    _defineProperty(this, "handleCloseClick", () => {
      this.browserWindow.close();
    });
    this.browserWindow = props.browserWindow;
    this.state.maximized = this.browserWindow.isMaximized();
    this.state.fullScreen = this.browserWindow.isFullScreen();
    ['enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize'].forEach(event => {
      this.browserWindow.on(event, this.onWindowChange);
    });
    window.addEventListener('beforeunload', this.destroy);
  }
  componentWillUnmount() {
    this.destroy();
  }
  render() {
    let buttons = this.state.fullScreen ? /*#__PURE__*/React.createElement(UnFullscreenButton, {
      onClick: this.handleUnFullscreenClick
    }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(MinimizeButton, {
      onClick: this.handleMinimizeClick
    }), /*#__PURE__*/React.createElement(MaximizeButton, {
      maximized: this.state.maximized,
      onClick: this.handleMaximizeClick
    }));
    return /*#__PURE__*/React.createElement("div", {
      className: "electronbar-buttons"
    }, buttons, /*#__PURE__*/React.createElement(CloseButton, {
      key: "close-button",
      onClick: this.handleCloseClick
    }));
  }
}

/* statics */

const MinimizeButton = ({
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-button electronbar-button-minimize",
  onClick: onClick
}, /*#__PURE__*/React.createElement(IconMinimize, null));
const MaximizeButton = ({
  onClick,
  maximized = false
}) => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-button electronbar-button-maximize",
  onClick: onClick
}, maximized ? /*#__PURE__*/React.createElement(IconUnMaximize, null) : /*#__PURE__*/React.createElement(IconMaximize, null));
const UnFullscreenButton = ({
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-button electronbar-button-unfullscreen",
  onClick: onClick
}, /*#__PURE__*/React.createElement(IconUnMaximize, null));
const CloseButton = ({
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-button electronbar-button-close",
  onClick: onClick
}, /*#__PURE__*/React.createElement(IconClose, null));

/* icons */

const IconMinimize = () => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, /*#__PURE__*/React.createElement("path", {
  fill: "currentColor",
  d: "M 0,5 10,5 10,6 0,6 Z"
})));
const IconUnMaximize = () => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, /*#__PURE__*/React.createElement("path", {
  fill: "currentColor",
  d: "m 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z"
})));
const IconMaximize = () => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, /*#__PURE__*/React.createElement("path", {
  fill: "currentColor",
  d: "M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z"
})));
const IconClose = () => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, /*#__PURE__*/React.createElement("path", {
  fill: "currentColor",
  d: "M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z"
})));

/**
 * The main react component.
 */
class TitleBar extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.needsUpdate;
  }
  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: "electronbar"
    }, /*#__PURE__*/React.createElement(Favicon, {
      icon: this.props.icon
    }), /*#__PURE__*/React.createElement(Menu, {
      menu: this.props.menu
    }), /*#__PURE__*/React.createElement(Title, {
      title: this.props.title
    }), /*#__PURE__*/React.createElement(Buttons, {
      browserWindow: this.props.browserWindow
    }));
  }
}

/* statics */

const Favicon = ({
  icon,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-favicon",
  onClick: onClick
}, /*#__PURE__*/React.createElement("img", {
  src: icon,
  alt: ""
}));
const Title = ({
  title,
  onClick
}) => /*#__PURE__*/React.createElement("div", {
  className: "electronbar-title",
  onClick: onClick
}, title);

/** 
 * Default class to manage electron state and mount the React component.
 */
class Electronbar {
  constructor({
    electronRemote,
    browserWindow,
    menu,
    icon,
    mountNode,
    title: _title
  }) {
    _defineProperty(this, "contextMenu", void 0);
    _defineProperty(this, "contextMenuEvent", void 0);
    _defineProperty(this, "onTitleChange", (e, title) => {
      this.setTitle(title);
    });
    _defineProperty(this, "onContextMenuClose", () => {
      this.contextMenu = null;
      this.contextMenuEvent = null;
      this.render();
    });
    this.electronRemote = electronRemote && electronRemote.remote ? electronRemote.remote : electronRemote;
    this.browserWindow = browserWindow;
    this.icon = icon;

    // set a title
    if (_title != null) {
      this.title = _title;

      // get the title from the window
    } else if (browserWindow && browserWindow.webContents) {
      this.dynamicTitle = true;
      this.title = browserWindow.webContents.getTitle();
      browserWindow.on('page-title-updated', this.onTitleChange);
    }
    this.setMenu(menu);
    this.mount(mountNode);
  }
  destroy() {
    this.unmount();
    if (this.dynamicTitle) {
      this.browserWindow.removeEventListener('page-title-updated', this.onTitleChange);
    }
    this.electronRemote = null;
    this.window = null;
  }
  render(titleBarNeedsUpdate = false) {
    if (this.mountNode && this.browserWindow) {
      let contextMenu = this.contextMenu && this.contextMenuEvent && /*#__PURE__*/React.createElement(Menu, {
        context: true,
        menu: this.contextMenu,
        x: this.contextMenuEvent.clientX,
        y: this.contextMenuEvent.clientY,
        onClose: this.onContextMenuClose
      });
      this.mountNode.render( /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TitleBar, {
        needsUpdate: titleBarNeedsUpdate,
        menu: this.menu,
        title: this.title,
        icon: this.icon,
        browserWindow: this.browserWindow
      }), contextMenu));
    }
  }
  setMenu(menu) {
    // check if an electron or electronbar built menu was passed (check append property)
    let prebuiltMenu = !!menu.append;

    // set electron menu if an electron built menu was provided
    if (prebuiltMenu) {
      this.electronRemote.Menu.setApplicationMenu(menu);

      // hijack the menu to create hidden menu item acceleartors
    } else {
      let acceleratorMenu = this.electronRemote.Menu.buildFromTemplate(buildAcceleratorMenuTemplate(menu));
      this.electronRemote.Menu.setApplicationMenu(acceleratorMenu);
    }

    // the electron menu is fucked up and really slow, make a faster version (also required for the electron built menu)
    this.menu = parseMenu(menu);
    this.render(true);
  }
  setIcon(icon) {
    this.icon = icon;
    this.render(true);
  }
  setContextMenu(event, menu) {
    this.contextMenuEvent = event;
    this.contextMenu = menu;
    this.render();
  }
  setTitle(title) {
    if (this.dynamicTitle) {
      this.dynamicTitle = false;
      this.browserWindow.removeEventListener('page-title-updated', this.onTitleChange);
    }
    this.title = title;
    this.render(true);
  }
  mount(mountNode) {
    if (mountNode) {
      this.unmount();
      this.mountNode = ReactDomClient.createRoot(mountNode);
    }
  }
  unmount() {
    if (this.mountNode) {
      this.mountNode.unmount();
      this.mountNode = null;
    }
  }
}

/**
 * The electron menu uses IPC for getters and setters and is really slow.
 * Use this function instead if electronbar will handle your menu entirely.
 * 
 * @param {*} template - the electron menu template
 */
Electronbar.buildMenuFromTemplate = template => {
  if (!template) {
    return {};
  }

  // root
  if (Array.isArray(template)) {
    return {
      items: template.map(template => Electronbar.buildMenuFromTemplate(template))
    };

    // branch
  } else {
    if (template.submenu) {
      template.submenu = {
        items: template.submenu.map(template => Electronbar.buildMenuFromTemplate(template))
      };
    }
    template.enabled = template.enabled != null ? !!template.enabled : true;
    template.visible = template.visible != null ? !!template.visible : true;
    template.type = template.type || (template.submenu ? 'submenu' : 'normal');
    return template;
  }
};

/* internal */

/**
 * The electron menu is huge and slow, make a smaller and faster version.
 * @param {*} menu - the electron menu (not the template, the built menu)
 */
function parseMenu(menu) {
  let liteMenu = [];
  for (let item of menu.items) {
    liteMenu.push({
      accelerator: item.accelerator,
      click: item.click ? item.click : () => {},
      checked: item.checked,
      enabled: item.enabled,
      label: item.label,
      role: item.role,
      type: item.type,
      visible: item.visible,
      submenu: item.submenu ? parseMenu(item.submenu) : undefined
    });
  }
  return liteMenu;
}

/**
 * When using an electronbar menu, accelerators need to be made on a virtual menu.
 * @param {*} menu - the electronbar menu
 */
function buildAcceleratorMenuTemplate(menu) {
  let items = [];
  for (let item of menu.items) {
    if (item.visible && item.enabled) {
      if (item.accelerator && item.click) {
        items.push({
          label: '',
          accelerator: item.accelerator,
          click: item.click,
          visible: false
        });
      }
      if (item.submenu) {
        items = items.concat(buildAcceleratorMenuTemplate(item.submenu));
      }
    }
  }
  return items;
}

module.exports = Electronbar;
