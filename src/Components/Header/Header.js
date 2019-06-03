// VENDOR
import $ from "jquery";
import React, { Component } from "react";

// APP
import "./Header.css";
import * as Actions from "../../Actions/Actions.js";
import { KEY_ENTER, KEY_TAB, KEY_U, KEY_DOWN } from "../../Constants/Constants.js";


class Header extends Component {
  // this shows the title of the current focused bullet along with its note

  constructor(props) {
    super(props);
    this.content = React.createRef();
    this.note = React.createRef();
    this.state = {};
  }

  focusNote() {
    this.content.current.blur();
    this.note.current.focus();
    $(`#root-bullet-note`).focus();
  }

  focusContent() {
    this.note.current.blur();
    this.content.current.focus();
    $("#root-bullet-content").focus();
  }

  onKeyDown(e) {
    switch (e.keyCode) {
      case KEY_ENTER:
        e.preventDefault();
        if (e.shiftKey) { // shift + enter > activate note for editing
          this.focusNote();
          break;
        }
        else { // enter > add a bullet as a new child
          this.props.store.dispatch(Actions.addSubBullet(this.props.address));
          break;
        }
      case KEY_U:
        if (e.nativeEvent.metaKey) { // cmd + u does not work so it must be polyfilled
          e.preventDefault();
          let selection = window.getSelection();
          let anchor = selection.anchorNode;
          let selected = anchor.splitText(selection.anchorOffset)
          let jNode = $(selected); // selected text isolated in text node using splitText method

          if (selected.parentNode.nodeName !== "U") { // wraps text around u tag
            jNode.wrap("<u></u>");
          }
          else {
            jNode.unwrap(); // removes u tag around text
          }
        }
        break;
      case KEY_DOWN:
        if (this.state.focusedBullet.children.length === 0) {
          this.props.store.dispatch(Actions.addSubBullet(this.props.address));
          break;
        }
        else {
          Actions.focusNode(this.state.focusedBullet.children[0]);
          break;
        }
      default:
        break;
    }
  }

  onKeyUp(e) {
    switch (e.keyCode) {
      default:
        this.props.store.dispatch(Actions.editBullet(this.props.address, this.content.current.innerHTML)); // edit bullet's content in redux store
    }
  }

  onNoteKeyDown(e) {
    switch(e.keyCode) {
      case KEY_ENTER:
        e.preventDefault();
        if (e.shiftKey) { // shift + enter > activate content for editing
          this.focusContent();
          break;
        }
        // eslint-disable-next-line        
      case KEY_TAB: // tab
        e.preventDefault();
        break;
      default:
        this.focusNote();
    }
  }

  onNoteKeyUp(e) {
    this.props.store.dispatch(Actions.editBulletNote(this.props.address, this.note.current.innerHTML)); // edit bullet's content in redux store
    this.focusNote();
  }

  componentDidMount() {
    this.setState({
      content: this.props.focusedBullet.content,
      note: this.props.focusedBullet.note,
      id: this.props.focusedBullet.id,
      address: this.props.focused
    });
  }

  componentWillUpdate() {
    if (this.props.focusedBullet.children.length === 0) {
      this.content.current.focus();
    }
  }

  render() {
    return (this.props.focusedBullet.content == null) ? null : (
      <div className="w-100 h-100 pl-3">
        <div className="header-content display-5"
             id="root-bullet-content"
             contentEditable="true"
             suppressContentEditableWarning="true"
             ref={ this.content }
             onKeyDown={ this.onKeyDown.bind(this) }
             onKeyUp={ this.onKeyUp.bind(this) }
             dangerouslySetInnerHTML={{ __html: this.state.content }}>
        </div>
        <div className="header-note lead"
             id="root-bullet-note"
             contentEditable="true"
             suppressContentEditableWarning="true"
             ref={ this.note }
             onKeyDown={ this.onNoteKeyDown.bind(this) }
             onKeyUp={ this.onNoteKeyUp.bind(this) }
             dangerouslySetInnerHTML={{ __html: this.state.note }}>
        </div>
      </div>
    )
  }

}

export default Header;
