'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));
var reactDom = _interopDefault(require('react-dom'));

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

    _defineProperty(this, "hoverTimer", null);

    _defineProperty(this, "state", {
      selectedItemKey: null
    });

    _defineProperty(this, "handleClick", e => {
      e.stopPropagation();

      if (!this.props.item.enabled) {
        return;
      }

      if (this.props.item.type == 'normal') {
        // set timeout so that React has a chance to update before any potemtially locking function is called.
        setTimeout(() => this.props.item.click(), 50);
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

    _defineProperty(this, "handleAntiHover", () => {
      this.clearHoverTimeout();
      this.hoverTimer = setTimeout(() => {
        this.hoverTimer = null;
        this.setState({
          selectedItemKey: null
        });
      }, HOVER_TIMEOUT);
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
      let items = [];

      for (let i = 0; i < item.submenu.length; ++i) {
        if (item.submenu[i].visible) {
          items.push(React.createElement(MenuItem, {
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
        itemContainer = React.createElement("div", {
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
      return React.createElement("div", {
        className: "electronbar-seperator",
        onClick: this.handleClick
      }, React.createElement("hr", null)); // render a not root item
    } else if (depth) {
      let expandOrAccelerator = [];

      if (hasChildren) {
        expandOrAccelerator = React.createElement(Expander, null);
      } else if (item.accelerator) {
        expandOrAccelerator = React.createElement(Accelerator, {
          accelerator: item.accelerator
        });
      }

      return React.createElement("div", {
        className: ['electronbar-menu-item', ...classes].join(' '),
        onMouseEnter: this.handleHover,
        onMouseLeave: this.handleAntiHover
      }, React.createElement("div", {
        className: "electronbar-menu-item-label",
        onClick: this.handleClick
      }, React.createElement("div", {
        className: "electronbar-menu-item-label-text"
      }, translateRole(item)), expandOrAccelerator), itemContainer); // render a root item
    } else {
      return React.createElement("div", {
        className: ['electronbar-top-menu-item', ...classes].join(' '),
        onMouseEnter: this.handleHover,
        onMouseLeave: this.handleAntiHover
      }, React.createElement("div", {
        className: "electronbar-top-menu-item-label",
        onClick: this.handleClick
      }, translateRole(item)), itemContainer);
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


const Expander = () => React.createElement("div", {
  className: "electronbar-menu-item-label-expander"
}, React.createElement(IconChevron, null));

const Accelerator = ({
  accelerator
}) => React.createElement("div", {
  className: "electronbar-menu-item-label-accelerator"
}, translateAccelerator(accelerator));
/* icons */


const IconChevron = () => React.createElement("div", {
  className: "electronbar-icon"
}, React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 14 14"
}, React.createElement("path", {
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
        items.push(React.createElement(MenuItem, {
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

    return React.createElement("div", {
      className: "electronbar-menu"
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
        this.window.removeListener(event, this.onWindowChange);
      });
      this.window.removeListener('closed', this.destroy);
      window.removeEventListener('beforeunload', this.destroy);
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
    this.window.on('closed', this.destroy);
    window.addEventListener('beforeunload', this.destroy);
  }

  componentWillUnmount() {
    this.destroy();
  }

  render() {
    let buttons = [];

    if (this.state.fullScreen) {
      buttons.push(React.createElement(UnFullscreenButton, {
        key: "fullscreen-button",
        onClick: this.handleUnFullscreenClick
      }));
    } else {
      buttons.push(React.createElement(MinimizeButton, {
        key: "minimize-button",
        onClick: this.handleMinimizeClick
      }));
      buttons.push(React.createElement(MaximizeButton, {
        key: "maximize-button",
        maximized: this.state.maximized,
        onClick: this.handleMaximizeClick
      }));
    }

    buttons.push(React.createElement(CloseButton, {
      key: "close-button",
      onClick: this.handleCloseClick
    }));
    return React.createElement("div", {
      className: "electronbar-buttons"
    }, buttons);
  }

}
/* statics */

const MinimizeButton = ({
  onClick
}) => React.createElement("div", {
  className: "electronbar-button electronbar-button-minimize",
  onClick: onClick
}, React.createElement(IconMinimize, null));

const MaximizeButton = ({
  onClick,
  maximized = false
}) => React.createElement("div", {
  className: "electronbar-button electronbar-button-maximize",
  onClick: onClick
}, maximized ? React.createElement(IconUnMaximize, null) : React.createElement(IconMaximize, null));

const UnFullscreenButton = ({
  onClick
}) => React.createElement("div", {
  className: "electronbar-button electronbar-button-unfullscreen",
  onClick: onClick
}, React.createElement(IconUnMaximize, null));

const CloseButton = ({
  onClick
}) => React.createElement("div", {
  className: "electronbar-button electronbar-button-close",
  onClick: onClick
}, React.createElement(IconClose, null));
/* icons */


const IconMinimize = () => React.createElement("div", {
  className: "electronbar-icon"
}, React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, React.createElement("path", {
  fill: "currentColor",
  d: "M 0,5 10,5 10,6 0,6 Z"
})));

const IconUnMaximize = () => React.createElement("div", {
  className: "electronbar-icon"
}, React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, React.createElement("path", {
  fill: "currentColor",
  d: "m 2,1e-5 0,2 -2,0 0,8 8,0 0,-2 2,0 0,-8 z m 1,1 6,0 0,6 -1,0 0,-5 -5,0 z m -2,2 6,0 0,6 -6,0 z"
})));

const IconMaximize = () => React.createElement("div", {
  className: "electronbar-icon"
}, React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, React.createElement("path", {
  fill: "currentColor",
  d: "M 0,0 0,10 10,10 10,0 Z M 1,1 9,1 9,9 1,9 Z"
})));

const IconClose = () => React.createElement("div", {
  className: "electronbar-icon"
}, React.createElement("svg", {
  "aria-hidden": "true",
  focusable: "false",
  viewBox: "0 0 10 10"
}, React.createElement("path", {
  fill: "currentColor",
  d: "M 0,0 0,0.7 4.3,5 0,9.3 0,10 0.7,10 5,5.7 9.3,10 10,10 10,9.3 5.7,5 10,0.7 10,0 9.3,0 5,4.3 0.7,0 Z"
})));

/**
 * The main react component.
 */

class TitleBar extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return React.createElement("div", {
      className: "electronbar"
    }, React.createElement(Favicon, {
      icon: this.props.icon
    }), React.createElement(Menu, {
      menu: this.props.menu
    }), React.createElement(Title, {
      title: this.props.title
    }), React.createElement(Buttons, {
      window: this.props.window
    }));
  }

}
/* statics */

const Favicon = ({
  icon,
  onClick
}) => React.createElement("div", {
  className: "electronbar-favicon",
  onClick: onClick
}, React.createElement("img", {
  src: icon,
  alt: ""
}));

const Title = ({
  title,
  onClick
}) => React.createElement("div", {
  className: "electronbar-title",
  onClick: onClick
}, title);

/** 
 * Default class to manage electron state and mount the React component.
 */

class Electronbar {
  constructor({
    electron,
    window,
    menu,
    title,
    icon,
    mountNode
  }) {
    this.electron = electron;
    this.window = window;
    this.title = title;
    this.icon = icon;
    this.mountNode = mountNode;
    this.setMenu(menu);
  }

  render() {
    reactDom.render(React.createElement(TitleBar, {
      menu: this.menu,
      title: this.title,
      icon: this.icon,
      window: this.window
    }), this.mountNode);
  }

  setMenu(menu) {
    // register all accelerators
    this.electron.remote.Menu.setApplicationMenu(menu); // the electron menu is fucked up and really slow, make a faster version

    this.menu = parseMenu(menu);
    this.render();
  }

  setTitle(title) {
    this.title = title;
    this.render();
  }

  setIcon(icon) {
    this.icon = icon;
    this.render();
  }

}
/* internal */

/**
 * The electron menu is huge and slow, make a smaller and faster version.
 * @param {*} menu the electron menu (not the template, the built menu) 
 */

function parseMenu(menu) {
  let liteMenu = [];
  let items = menu.items ? menu.items : menu.submenu ? menu.submenu.items : [];

  for (let item of items) {
    let liteItem = {
      accelerator: item.accelerator,
      click: item.click ? item.click : () => {},
      enabled: item.enabled,
      label: item.label,
      role: item.role,
      type: item.type,
      visible: item.visible,
      submenu: parseMenu(item)
    };
    liteMenu.push(liteItem);
  }

  return liteMenu;
}

module.exports = Electronbar;
