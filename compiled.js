// babel 插件把 jsx 转化为 Hyperscript
// h 函数把 Hyperscript 转化为 vdom
// rendom 把 vdom 转化为 dom，并插入根节点

const CREATE = 'CREATE';
const REMOVE = 'REMOVE';
const REPLACE = 'REPLACE';
const UPDATE = 'UPDATE';
const SET_PROP = 'SET_PROP';
const REMOVE_PROP = 'REMOVE_PROP';

function view(count) {
  const r = [...Array(count).keys()];
  return h(
    'ul',
    { id: 'filmList', className: `list-${count % 3}` },
    r.map(n => h(
      'li',
      null,
      'item ',
      (count * n).toString()
    ))
  );
}

function flatten(arr) {
  return [].concat(...arr);
}

function h(type, props, ...children) {
  return {
    type,
    props: props || {},
    children: flatten(children)
  };
}

function render(el) {
  const initialCount = 0;

  el.appendChild(createElement(view(initialCount)));
  setTimeout(() => tick(el, initialCount), 1000);
}

function tick(el, count) {
  const patches = diff(view(count + 1), view(count));
  patch(el, patches);

  if (count > 5) {
    return;
  }
  setTimeout(() => tick(el, count + 1), 1000);
}

function diff(newNode, oldNode) {
  // 旧节点不存在，表示为新增节点
  if (!oldNode) {
    return { type: CREATE, newNode };
  }

  // 新节点不存在，表示为删除节点
  if (!newNode) {
    return { type: REMOVE };
  }

  // 两者都存在，判断是否发生变动
  if (changed(newNode, oldNode)) {
    return { type: REPLACE, newNode };
  }

  // changed 返回 false，判断新节点是否是 VDOM，如果是的话，返回一个 patches 对象
  // 类型是 update，并对 props 和 children 做 diff 操作
  if (newNode.type) {
    return {
      type: UPDATE,
      props: diffProps(newNode, oldNode),
      children: diffChildren(newNode, oldNode)
    };
  }
}

function changed(node1, node2) {
  // 比较数据类型，纯文本比较，类型比较
  return typeof node1 !== typeof node2 || typeof node1 === 'string' && node1 !== node2 || node1.type !== node2.type;
}

function diffProps(newNode, oldNode) {
  let patches = [];
  let props = Object.assign({}, newNode.props, oldNode.props);
  Object.keys(props).forEach(key => {
    const newVal = newNode.props[key];
    const oldVal = oldNode.props[key];
    // 新的属性不存在，表示是删除属性
    if (!newVal) {
      patches.push({
        type: REMOVE_PROP,
        key,
        value: oldVal
      });
    }
    // 旧的属性不存在或者新旧属性不相同，表示是增加属性
    if (!oldVal || newVal !== oldVal) {
      patches.push({
        type: SET_PROP,
        key,
        value: newVal
      });
    }
  });
  return patches;
}

function diffChildren(newNode, oldNode) {
  let patches = [];
  const maxLength = Math.max(newNode.children.length, oldNode.children.length);
  for (let i = 0; i < maxLength; i++) {
    patches[i] = diff(newNode.children[i], oldNode.children[i]);
  }
  return patches;
}

function patch(parent, patches, index = 0) {
  if (!patches) return;
  const el = parent.childNodes[index];
  switch (patches.type) {
    case CREATE:
      {
        const { newNode } = patches;
        const newEl = createElement(newNode);
        parent.appendChild(newEl);
        break;
      }
    case REMOVE:
      {
        parent.removeChild(el);
        break;
      }
    case REPLACE:
      {
        const { newNode } = patches;
        const newEl = createElement(newNode);
        return parent.replaceChild(newEl, el);
      }
    case UPDATE:
      {
        const { props, children } = patches;
        patchProps(el, props);
        for (let i = 0; i < children.length; i++) {
          patch(el, children[i], i);
        }
      }
  }
}

function patchProps(parent, patches) {
  patches.forEach(patch => {
    const { type, key, value } = patch;
    if (type === SET_PROP) {
      setProp(parent, key, value);
    }
    if (type === REMOVE_PROP) {
      removeProp(parent, key, value);
    }
  });
}

function removeProp(target, name, value) {
  if (name === 'className') {
    return target.removeAttribute('class');
  }
  target.removeAttribute(name);
}

function createElement(node) {
  if (typeof node === 'string') {
    return document.createTextNode(node);
  }

  let { type, props, children } = node;
  const el = document.createElement(type);
  setProps(el, props);
  children.map(createElement).forEach(el.appendChild.bind(el));
  return el;
}

function setProps(target, props) {
  Object.keys(props).forEach(key => {
    setProp(target, key, props[key]);
  });
}

function setProp(target, name, value) {
  if (name === 'className') {
    return target.setAttribute('class', value);
  }
  target.setAttribute(name, value);
}
