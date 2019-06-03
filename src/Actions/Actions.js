// VENDOR
import $ from "jquery";
import uuidv1 from "uuid/v1";

const UPDATE_FOCUSED = "UPDATE_FOCUSED";
const UPDATE_ROOT = "UPDATE_ROOT";
const ADD_BULLET = "ADD_BULLET";
const ADD_SUB_BULLET = "ADD_SUB_BULLET";
const EDIT_BULLET = "EDIT_BULLET";
const DELETE_BULLET = "DELETE_BULLET";
const INDENT_BULLET = "INDENT_BULLET";
const UNINDENT_BULLET = "UNINDENT_BULLET";
const MOVE_BULLET = "MOVE_BULLET";
const EDIT_BULLET_NOTE = "EDIT_BULLET_NOTE";
const TOGGLE_BULLET_COMPLETION = "TOGGLE_BULLET_COMPLETION";
const GO_DOWN = "GO_DOWN";
const GO_UP = "GO_UP";
const TOGGLE_COLLAPSE = "TOGGLE_COLLAPSE";

function updateFocused(address) {
  return {
    type: UPDATE_FOCUSED,
    exec: (state) => {
      state.root.focused = address;
      return state;
    }
  }
}

function updateRoot(root) {
  return {
    type: UPDATE_ROOT,
    root,
    exec: (state) => {
      state.root = root;
      return state;
    }
  }
}

function addBullet(address) { // add bullet as a sibling
  return {
    type: ADD_BULLET,
    exec: (state) => {
      let parent = getNode(ancestors(address), state.root);
      let position = getPosition(copy(address), state.root);
      let sibling = createNode();
      parent.children.splice((position + 1), 0, sibling);
      focusNode(sibling);
      return state;
    }
  }
}

function addSubBullet(address) { // add bullet as a child
  return {
    type: ADD_SUB_BULLET,
    exec: (state) => {
      let parent = getNode(copy(address), state.root);
      let child = createNode();
      parent.children.push(child);
      focusNode(child);
      return state;
    }
  }
}

function editBullet(address, content, focus=false) {
  return {
    type: EDIT_BULLET,
    exec: (state) => {
      let node = getNode(copy(address), state.root);
      node.content = content;
      if (focus) {
        focusNode(node);
      }
      return state;
    }
  }
}

function deleteBullet(address) {
  return {
    type: DELETE_BULLET,
    exec: (state) => {
      let parent = getNode(ancestors(address), state.root);
      let position = getPosition(copy(address), state.root);
      let node = getNode(copy(address), state.root);
      if ((node.children.length > 0) || (node.note !== "")) {
        return state;
      }
      if (position > 0) {
        let _siblingAbove = getNodeAbove(copy(address), state.root);
        parent.children.splice(position, 1);
        focusNode(_siblingAbove);
        return state;
      }
      else {

        parent.children.splice(position, 1);
        if (parent.children.length > 0) {
          if (address.length > 2) {
            focusNode(parent);
          }
        }
        return state;
      }
    }
  }
}

function indentBullet(address) {
  return {
    type: INDENT_BULLET,
    exec: (state) => {
      let position = getPosition(copy(address), state.root);
      if (getPosition(copy(address), state.root) === 0) { return state }
      let tree = getTree(ancestors(address), state.root);
      let oldParent = last(tree);
      let newParent = siblingAbove(copy(address), state.root);
      let child = oldParent.children.splice(position, 1)[0];
      newParent.children.push(child);
      newParent.collapsed = false;
      tree.push(newParent);
      for (let i in tree) {
        if (tree[i].collapsed !== null) {
          tree[i].collapsed = false;
          uncollapseNode(tree[i]);
        }
      }
      focusNode(child);
      return state;
    }
  }
}

function unindentBullet(address) {
  return {
    type: UNINDENT_BULLET,
    exec: (state) => {
      if (address.length === 1) { return state }
      let position = getPosition(copy(address), state.root);
      let parent = getNode(ancestors(address), state.root);
      let parentPosition = getPosition(ancestors(address), state.root);
      let child = parent.children.splice(position, 1)[0];
      let newParent = getNode(ancestors(ancestors(address)), state.root);
      newParent.children.splice((parentPosition + 1), 0, child);
      focusNode(child);
      return state;
    }
  }
}

function editBulletNote(address, content, focus=false) {
  return {
    type: EDIT_BULLET_NOTE,
    exec: (state) => {
      let node = getNode(copy(address), state.root);
      node.note = content;
      if (focus) {
        focusNodeNote(node);
      }
      return state;
    }
  }
}

function moveBulletAsChild(childAddress, newParentAddress) {
  return {
    type: MOVE_BULLET,
    exec: (state) => {
      let newParent = getNode(copy(newParentAddress), state.root);
      let oldParent = getNode(ancestors(childAddress), state.root);
      let childPosition = getPosition(childAddress, state.root);
      let child = oldParent.children.splice(childPosition, 1)[0];
      newParent.children.push(child);
      uncollapseTree(getTree(copy(newParentAddress), state.root));
      focusNode(child);
      return state;
    }
  }
}

function moveBulletAsSibling(childAddress, newSiblingAddress, above) {
  return {
    type: MOVE_BULLET,
    exec: (state) => {
      let childPosition = getPosition(copy(childAddress), state.root);
      let newParent = getNode(ancestors(newSiblingAddress), state.root);
      let oldParent = getNode(ancestors(childAddress), state.root);
      let child = oldParent.children.splice(childPosition, 1)[0];
      let siblingPosition = getPosition(copy(newSiblingAddress), state.root);
      if (above) {
        newParent.children.splice(siblingPosition, 0, child);
      }
      else {
        newParent.children.splice((siblingPosition + 1), 0, child);
      }
      focusNode(child);
      return state;
    }
  }
}

function toggleBulletCompletion(address) {
  return {
    type: TOGGLE_BULLET_COMPLETION,
    exec: (state) => {
      let node = getNode(copy(address), state.root);
      node.completed = !(node.completed);
      return state;
    }
  }
}

function goDown(address) {
  return {
    type: GO_DOWN,
    exec: (state) => {
      let node = getNode(copy(address), state.root);

      if (!isCollapsed(node)) {
        let _childBelow = node.children[0];
        focusNode(_childBelow);
        return state;
      }

      if(!isLastChild(copy(address), state.root)) {
        focusNode(siblingBelow(copy(address), state.root));
        return state;
      }

      else {
        if (isRootChild(copy(address), state.root)) {
          return state;
        }
        else {
          let _address = copy(address);
          while(_address.length !== 1) {
            if (!isLastChild(_address, state.root)) {
              focusNode(siblingBelow(copy(_address), state.root));
              return state;
            }
            _address.pop();
          }
        }
      }
      return state;
    }
  }
}

function goUp(address) {
  return {
    type: GO_UP,
    exec: (state) => {
      let siblingAbove = getNodeAbove(copy(address), state.root);
      if (siblingAbove) {
        focusNode(siblingAbove);
      }
      return state;
    }
  }
}

function toggleCollapse(address) {
  return {
    type: TOGGLE_COLLAPSE,
    exec: (state) => {
      let node = getNode(copy(address), state.root);
      node.collapsed = !(node.collapsed);
      if (node.collapsed) {
        collapseNode(node);
      }
      else {
        uncollapseNode(node);
      }
      return state;
    }
  }
}

function unCollapse(address) {
  return {
    type: TOGGLE_COLLAPSE,
    exec: (state) => {
      let node = getNode(copy(address), state.root);
      node.collapsed = false;
      uncollapseNode(node);
      return state;
    }
  }
}

function getNode(address, node) {
  if (address.length === 1 && address[0] === node.id) {
    return node;
  }
  address.shift();
  let _node = node.children.find(n => (n.id === address[0]));
  return getNode(address, _node);
}

function getNodeAbove(address, node) {
  if (isFirstChild(copy(address), node)) {
    if (!isRootChild(copy(address), node)) {
      return getNode(ancestors(address), node);
    }
    else {
      return null;
    }
  }
  else {
    let _siblingAbove = siblingAbove(copy(address), node);
    while (!isCollapsed(_siblingAbove)) {
      _siblingAbove = _siblingAbove.children[_siblingAbove.children.length - 1];
    }
    return _siblingAbove;
  }
}

function getTree(address, node, tree=[]) {
  if (address.length === 1 && address[0] === node.id) {
    tree.push(node);
    return tree;
  }
  else {
    tree.push(node)
    address.shift();
    let _node = node.children.find(n => n.id === address[0]);
    return getTree(copy(address), _node, tree);
  }
}

function getPosition(address, node) {
  let parent = getNode(ancestors(address), node);
  let child = getNode(copy(address), node);
  return parent.children.indexOf(child);
}

function placeCaretAtEnd(el) {
  // https://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser/4238971
  // @Tim Down
  el.focus();
  if (typeof window.getSelection != "undefined"
          && typeof document.createRange != "undefined") {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
  } else if (typeof document.body.createTextRange != "undefined") {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.collapse(false);
      textRange.select();
  }
}

function focusNode(node, timeout=0) {
  setTimeout(() => {
    $(`#${node.id}`).find(".content").focus();
    placeCaretAtEnd($(`#${node.id}`).find(".content").get(0));
  }, timeout);
}

function focusNodeNote(node, timeout=0) {
  setTimeout(() => {
    $(`#${node.id}`).find(".note").focus();
    placeCaretAtEnd($(`#${node.id}`).find(".note").get(0));
  }, timeout);
}

function isCollapsed(node) {
  if (node.children.length === 0) {
    return true;
  }
  return ($(`#${node.id}`).find(".children").attr("class").indexOf("show")  === -1);
}

/*
function hasChildren(node) {
  return (node.children.length > 0);
}
*/

function isFirstChild(address, node) {
  let position = getPosition(copy(address), node);
  return (position === 0);
}

function isLastChild(address, node) {
  let position = getPosition(copy(address), node);
  let parent = getNode(ancestors(address), node);
  return (position === (parent.children.length - 1));
}

function isRootChild(address, node) {
  return (address.length === (node.focused.length + 1));
}

function isRootRootChild(address) {
  return (address.length === 2);
}

function uncollapseNode(node) {
  setTimeout(() => {
    $(`#${node.id}`).children(".collapse").addClass("show");
  }, 0);
}

function collapseNode(node) {
  setTimeout(() => {
    $(`#${node.id}`).children(".collapse").removeClass("show");
  }, 0);
}

function uncollapseTree(tree) {
  setTimeout(() => {
    tree.map(uncollapseNode);
  }, 0);
}

/*
function collapseTree(tree) {
  setTimeout(() => {
    tree.map(node => {
      $(`#${node.id}`).children(".collapse").removeClass("show");
      return node;
    });
  }, 0);
}
*/

function last(array) {
  return array.slice(-1)[0];
}

function siblingAbove(address, node) {
  let parent = getNode(ancestors(address), node);
  let position = getPosition(copy(address), node);
  return parent.children[position - 1];
}

function siblingBelow(address, node) {
  let parent = getNode(ancestors(address), node);
  let position = getPosition(copy(address), node);
  return parent.children[position + 1];
}

/*
function childBelow(address, node) {
  let _node = getNode(copy(address), node);
  return _node.children[0];
}
*/

function ancestors(array) {
  return array.slice(0, -1);
}

function copy(array) {
  return array.slice();
}

function sameArray(array1, array2) {
  if (!(array1 instanceof Array) || !(array2 instanceof Array)) {
    return false;
  }

  if (array1.length !== array2.length) {
    return false;
  }

  for (var i = 0; i < array1.length; i++) {
    if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

function isCorrectFormat(node) {
  return node.id !== undefined &&
         node.content !== undefined &&
         node.completed !== undefined &&
         node.children !== undefined &&
         node.collapsed !== undefined &&
         node.focused !== undefined;
}


function fixTree(node, root=true) {
  if (node.id === undefined) {
    node.id = uuidv1();
  }
  if (node.content === undefined) {
    node.content = "";
  }
  if (node.completed === undefined) {
    node.completed = false;
  }
  if (node.children === undefined) {
    node.children = [];
  }
  if (node.collapsed === undefined) {
    node.collapsed = true;
  }
  if ((node.focused === undefined || node.focused === [node.id]) && root) {
    node.focused = [node.id];
  }
  if (node.children.length > 0) {
    for (var i = 0; i < node.children.length; i++) {
      fixTree(node.children[i], false);
    }
  }
}


function createNode(uuid=false) {
  return {
    id: (uuid ? uuid : uuidv1()),
    content: "",
    note: "",
    collapsed: true,
    completed: false,
    children: []
  }
}

function createRoot(uuid=false) {
  let identifier = uuid ? uuid : uuidv1();
  let root = {
    id: identifier,
    content: null,
    note: null,
    collapsed: null,
    completed: null,
    focused: [identifier],
    children: []
  };
  root.children.push(createNode());
  return root;
}

export { UPDATE_FOCUSED,
         UPDATE_ROOT,
         ADD_BULLET,
         ADD_SUB_BULLET,
         EDIT_BULLET,
         DELETE_BULLET,
         INDENT_BULLET,
         UNINDENT_BULLET,
         EDIT_BULLET_NOTE,
         MOVE_BULLET,
         TOGGLE_BULLET_COMPLETION,
         GO_DOWN,
         GO_UP,
         TOGGLE_COLLAPSE,
         updateFocused,
         updateRoot,
         addBullet,
         addSubBullet,
         editBullet,
         deleteBullet,
         indentBullet,
         unindentBullet,
         editBulletNote,
         moveBulletAsChild,
         moveBulletAsSibling,
         toggleCollapse,
         unCollapse,
         getNode,
         getTree,
         toggleBulletCompletion,
         goUp,
         goDown,
         focusNode,
         focusNodeNote,
         placeCaretAtEnd,
         isFirstChild,
         isRootChild,
         isRootRootChild,
         isCollapsed,
         uncollapseNode,
         uncollapseTree,
         sameArray,
         ancestors,
         copy,
         isCorrectFormat,
         fixTree,
         createNode,
         createRoot };
