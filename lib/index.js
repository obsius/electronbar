'use strict';

var React = require('react');
var reactDom = require('react-dom');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var reactDom__default = /*#__PURE__*/_interopDefaultLegacy(reactDom);

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
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

class MenuItem extends React__default['default'].Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "hoverTimer", null);

    _defineProperty(this, "state", {
      selectedItemKey: null
    });

    _defineProperty(this, "handleAntiHover", () => {
      this.clearHoverTimeout();
      this.hoverTimer = setTimeout(() => {
        this.hoverTimer = null;
        this.setState({
          selectedItemKey: null
        });
      }, HOVER_TIMEOUT);
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

    _defineProperty(this, "handleHover", e => {
      e.stopPropagation();

      if (this.props.item.enabled && this.props.onHover) {
        this.props.onHover(this.props.iKey);
      }
    });

    _defineProperty(this, "handleItemClick", key => {
      this.clearHoverTimeout();
      this.setState({
        selectedItemKey: key
      });
    });

    _defineProperty(this, "handleItemHover", key => {
      this.clearHoverTimeout();

      if (this.state.selectedItemKey != key) {
        this.hoverTimer = setTimeout(() => {
          this.hoverTimer = null;
          this.setState({
            selectedItemKey: key
          });
        }, HOVER_TIMEOUT);
      }
    });

    _defineProperty(this, "close", () => {
      this.clearHoverTimeout();
      this.setState({
        selectedItemKey: null
      });

      if (this.props.close) {
        this.props.close();
      }
    });
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
      let items = []; // iterate through submenu

      for (let i = 0; i < item.submenu.length; ++i) {
        if (item.submenu[i].visible) {
          items.push( /*#__PURE__*/React__default['default'].createElement(MenuItem, {
            key: i,
            iKey: i,
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
        itemContainer = /*#__PURE__*/React__default['default'].createElement("div", {
          className: depth ? 'electronbar-menu-item-children' : 'electronbar-top-menu-item-children'
        }, items);
      }
    } // set disabled if all of this menu item's children are disabled (separators don't count as active or enabled)


    if (hasChildren && disabledCount == item.submenu.length) {
      enabled = false;
    } // set the dynamic CSS classes


    if (enabled && hasChildren && open) {
      classes.push('open');
    }

    if (!enabled) {
      classes.push('disabled');
    } // render a separator


    if (item.type == 'separator') {
      return /*#__PURE__*/React__default['default'].createElement("div", {
        className: "electronbar-seperator",
        onClick: this.handleClick
      }, /*#__PURE__*/React__default['default'].createElement("hr", null)); // render a branch item
    } else if (depth) {
      let expandOrAccelerator = hasChildren ? /*#__PURE__*/React__default['default'].createElement(Expander, null) : /*#__PURE__*/React__default['default'].createElement(Accelerator, {
        accelerator: item.accelerator
      });
      let checkedClassName = 'electronbar-menu-item-checkbox' + (item.checked ? ' electronbar-menu-item-checkbox-active' : '');
      return /*#__PURE__*/React__default['default'].createElement("div", {
        className: ['electronbar-menu-item', ...classes].join(' '),
        onMouseEnter: this.handleHover,
        onMouseLeave: this.handleAntiHover
      }, /*#__PURE__*/React__default['default'].createElement("div", {
        className: "electronbar-menu-item-label",
        onClick: this.handleClick
      }, /*#__PURE__*/React__default['default'].createElement("div", {
        className: checkedClassName
      }), /*#__PURE__*/React__default['default'].createElement("div", {
        className: "electronbar-menu-item-label-text"
      }, translateRole(item)), expandOrAccelerator), itemContainer); // render a root item
    } else {
      return /*#__PURE__*/React__default['default'].createElement("div", {
        className: ['electronbar-top-menu-item', ...classes].join(' '),
        onMouseEnter: this.handleHover,
        onMouseLeave: this.handleAntiHover
      }, /*#__PURE__*/React__default['default'].createElement("div", {
        className: "electronbar-top-menu-item-label",
        onClick: this.handleClick
      }, translateRole(item)), itemContainer);
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


const Expander = () => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-menu-item-label-expander"
}, /*#__PURE__*/React__default['default'].createElement(IconChevron, null));

const Accelerator = ({
  accelerator
}) => {
  return accelerator ? /*#__PURE__*/React__default['default'].createElement("div", {
    className: "electronbar-menu-item-label-accelerator"
  }, translateAccelerator(accelerator)) : null;
};
/* icons */


const IconChevron = () => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React__default['default'].createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 14 14"
}, /*#__PURE__*/React__default['default'].createElement("path", {
  fill: "currentColor",
  d: "M4.52 12.364L9.879 7 4.52 1.636l.615-.615L11.122 7l-5.986 5.98-.615-.616z"
})));

/**
 * Menu react component. Contains all menu items.
 */

class Menu extends React__default['default'].Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "state", {
      selectedItemKey: null
    });

    _defineProperty(this, "handleWindowClick", () => {
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

    window.addEventListener('click', this.handleWindowClick, false);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.handleWindowClick);
  }

  close() {
    this.setState({
      selectedItemKey: null
    });
  }

  render() {
    let menu = this.props.menu;
    let items = [];

    for (let i = 0; i < menu.length; ++i) {
      if (menu[i].visible) {
        items.push( /*#__PURE__*/React__default['default'].createElement(MenuItem, {
          key: i,
          iKey: i,
          depth: 0,
          item: menu[i],
          open: i == this.state.selectedItemKey,
          onClick: this.handleItemClick,
          onHover: this.handleItemHover,
          close: () => this.close()
        }));
      }
    }

    return /*#__PURE__*/React__default['default'].createElement("div", {
      className: "electronbar-menu"
    }, items);
  }

}

/**
 * Minimize, maximize, unfullscreen, and close button container.
 */

class Buttons extends React__default['default'].Component {
  constructor(props) {
    super(props);

    _defineProperty(this, "state", {
      maximized: false,
      fullScreen: false
    });

    _defineProperty(this, "destroy", () => {
      ['enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize'].forEach(event => {
        this.window.removeListener(event, this.onWindowChange);
      });

      if (window) {
        window.removeEventListener('beforeunload', this.destroy);
      }
    });

    _defineProperty(this, "onWindowChange", () => {
      this.setState({
        maximized: this.window.isMaximized(),
        fullScreen: this.window.isFullScreen()
      });
    });

    _defineProperty(this, "handleUnFullscreenClick", () => {
      this.window.setFullScreen(false);
    });

    _defineProperty(this, "handleMinimizeClick", () => {
      this.window.minimize();
    });

    _defineProperty(this, "handleMaximizeClick", () => {
      if (this.window.isMaximized()) {
        this.window.unmaximize();
      } else {
        this.window.maximize();
      }
    });

    _defineProperty(this, "handleCloseClick", () => {
      this.window.close();
    });

    this.window = props.window;
    this.state.maximized = this.window.isMaximized();
    this.state.fullScreen = this.window.isFullScreen();
    ['enter-full-screen', 'leave-full-screen', 'maximize', 'unmaximize'].forEach(event => {
      this.window.on(event, this.onWindowChange);
    });
    window.addEventListener('beforeunload', this.destroy);
  }

  componentWillUnmount() {
    this.destroy();
  }

  render() {
    let buttons = this.state.fullScreen ? /*#__PURE__*/React__default['default'].createElement(UnFullscreenButton, {
      onClick: this.handleUnFullscreenClick
    }) : /*#__PURE__*/React__default['default'].createElement(React__default['default'].Fragment, null, /*#__PURE__*/React__default['default'].createElement(MinimizeButton, {
      onClick: this.handleMinimizeClick
    }), /*#__PURE__*/React__default['default'].createElement(MaximizeButton, {
      maximized: this.state.maximized,
      onClick: this.handleMaximizeClick
    }));
    return /*#__PURE__*/React__default['default'].createElement("div", {
      className: "electronbar-buttons"
    }, buttons, /*#__PURE__*/React__default['default'].createElement(CloseButton, {
      key: "close-button",
      onClick: this.handleCloseClick
    }));
  }

}
/* statics */

const MinimizeButton = ({
  onClick
}) => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-button electronbar-button-minimize",
  onClick: onClick
}, /*#__PURE__*/React__default['default'].createElement(IconMinimize, null));

const MaximizeButton = ({
  onClick,
  maximized = false
}) => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-button electronbar-button-maximize",
  onClick: onClick
}, maximized ? /*#__PURE__*/React__default['default'].createElement(IconUnMaximize, null) : /*#__PURE__*/React__default['default'].createElement(IconMaximize, null));

const UnFullscreenButton = ({
  onClick
}) => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-button electronbar-button-unfullscreen",
  onClick: onClick
}, /*#__PURE__*/React__default['default'].createElement(IconUnMaximize, null));

const CloseButton = ({
  onClick
}) => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-button electronbar-button-close",
  onClick: onClick
}, /*#__PURE__*/React__default['default'].createElement(IconClose, null));
/* icons */


const IconMinimize = () => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React__default['default'].createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, /*#__PURE__*/React__default['default'].createElement("path", {
  fill: "currentColor",
  d: "M 0,5 10,5 10,6 0,6 Z"
})));

const IconUnMaximize = () => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React__default['default'].createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, /*#__PURE__*/React__default['default'].createElement("path", {
  fill: "currentColor",
  d: "m 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z"
})));

const IconMaximize = () => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React__default['default'].createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, /*#__PURE__*/React__default['default'].createElement("path", {
  fill: "currentColor",
  d: "M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z"
})));

const IconClose = () => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-icon"
}, /*#__PURE__*/React__default['default'].createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, /*#__PURE__*/React__default['default'].createElement("path", {
  fill: "currentColor",
  d: "M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z"
})));

/**
 * The main react component.
 */

class TitleBar extends React__default['default'].Component {
  constructor(props) {
    super(props);
  }

  render() {
    return /*#__PURE__*/React__default['default'].createElement("div", {
      className: "electronbar"
    }, /*#__PURE__*/React__default['default'].createElement(Favicon, {
      icon: this.props.icon
    }), /*#__PURE__*/React__default['default'].createElement(Menu, {
      menu: this.props.menu
    }), /*#__PURE__*/React__default['default'].createElement(Title, {
      title: this.props.title
    }), /*#__PURE__*/React__default['default'].createElement(Buttons, {
      window: this.props.window
    }));
  }

}
/* statics */

const Favicon = ({
  icon,
  onClick
}) => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-favicon",
  onClick: onClick
}, /*#__PURE__*/React__default['default'].createElement("img", {
  src: icon,
  alt: ""
}));

const Title = ({
  title,
  onClick
}) => /*#__PURE__*/React__default['default'].createElement("div", {
  className: "electronbar-title",
  onClick: onClick
}, title);

/** 
 * Default class to manage electron state and mount the React component.
 */

class Electronbar {
  constructor({
    electronRemote,
    window,
    menu,
    icon,
    mountNode,
    title: _title
  }) {
    _defineProperty(this, "onTitleChange", (e, title) => {
      this.setTitle(title);
    });

    this.electronRemote = electronRemote && electronRemote.remote ? electronRemote.remote : electronRemote;
    this.window = window;
    this.icon = icon;
    this.mountNode = mountNode; // set a title

    if (_title != null) {
      this.title = _title; // get the title from the window
    } else if (window && window.webContents) {
      this.dynamicTitle = true;
      this.title = window.webContents.getTitle();
      window.on('page-title-updated', this.onTitleChange);
    }

    this.setMenu(menu);
  }

  destroy() {
    this.unmount();

    if (this.dynamicTitle) {
      window.removeEventListener('page-title-updated', this.onTitleChange);
    }

    this.electronRemote = null;
    this.window = null;
    this.mountNode = null;
  }

  render() {
    if (this.window) {
      reactDom__default['default'].render( /*#__PURE__*/React__default['default'].createElement(TitleBar, {
        menu: this.menu,
        title: this.title,
        icon: this.icon,
        window: this.window
      }), this.mountNode);
    }
  }

  setMenu(menu) {
    // check if an electron or electronbar built menu was passed (check append property)
    let prebuiltMenu = !!menu.append; // set electron menu if an electron built menu was provided

    if (prebuiltMenu) {
      this.electronRemote.Menu.setApplicationMenu(menu); // hijack the menu to create hidden menu item acceleartors
    } else {
      let acceleratorMenu = this.electronRemote.Menu.buildFromTemplate(buildAcceleratorMenuTemplate(menu));
      this.electronRemote.Menu.setApplicationMenu(acceleratorMenu);
    } // the electron menu is fucked up and really slow, make a faster version (also required for the electron built menu)


    this.menu = parseMenu(menu);
    this.render();
  }

  setIcon(icon) {
    this.icon = icon;
    this.render();
  }

  setTitle(title) {
    if (this.dynamicTitle) {
      this.dynamicTitle = false;
      window.removeEventListener('page-title-updated', this.onTitleChange);
    }

    this.title = title;
    this.render();
  }

  unmount() {
    reactDom__default['default'].unmountComponentAtNode(this.mountNode);
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
  } // root


  if (Array.isArray(template)) {
    return {
      items: template.map(template => Electronbar.buildMenuFromTemplate(template))
    }; // branch
  } else {
    if (template.submenu) {
      template.submenu = {
        items: template.submenu.map(template => Electronbar.buildMenuFromTemplate(template))
      };
    }

    template.enabled = template.enabled || true;
    template.visible = template.visible || true;
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
